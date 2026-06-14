'use server'

import { readFileSync, writeFileSync, existsSync, readdirSync } from 'fs'
import { resolve, join } from 'path'

const GITHUB_DIR = resolve(process.cwd(), '..')
const TARGETS_FILE = resolve(process.cwd(), 'src', 'UI', 'sync-targets.json')

export type SyncResult = {
  project: string
  changes: string[]
  npmrc: string
}

export type VersionMatrix = Record<string, Record<string, string | null>>

//----------------------------------------------------------------------------------
//  discoverProjects — scan GITHUB_DIR for subdirs that have a package.json
//----------------------------------------------------------------------------------
function discoverProjects(): { name: string; absPath: string }[] {
  return readdirSync(GITHUB_DIR, { withFileTypes: true })
    .filter(e => e.isDirectory() && existsSync(join(GITHUB_DIR, e.name, 'package.json')))
    .map(e => ({ name: e.name, absPath: join(GITHUB_DIR, e.name) }))
}

//----------------------------------------------------------------------------------
//  readPkgFlat — merge dependencies + devDependencies + peerDependencies into one map
//----------------------------------------------------------------------------------
function readPkgFlat(pkgPath: string): Record<string, string> | null {
  if (!existsSync(pkgPath)) return null
  try {
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))
    return {
      ...(pkg.dependencies ?? {}),
      ...(pkg.devDependencies ?? {}),
      ...(pkg.peerDependencies ?? {}),
    }
  } catch {
    return null
  }
}

//----------------------------------------------------------------------------------
//  collectPackages — union of all package names across all projects, sorted
//----------------------------------------------------------------------------------
function collectPackages(projects: { absPath: string }[]): string[] {
  const all = new Set<string>()
  for (const { absPath } of projects) {
    const flat = readPkgFlat(join(absPath, 'package.json'))
    if (flat) Object.keys(flat).forEach(k => all.add(k))
  }
  return [...all].sort()
}

//----------------------------------------------------------------------------------
//  action_readVersions — matrix of every package version per project
//----------------------------------------------------------------------------------
export async function action_readVersions(): Promise<VersionMatrix> {
  const projects = discoverProjects()
  const packages = collectPackages(projects)
  const matrix: VersionMatrix = {}
  for (const { name, absPath } of projects) {
    const flat = readPkgFlat(join(absPath, 'package.json'))
    if (flat === null) continue
    const row: Record<string, string | null> = {}
    for (const pkg of packages) {
      row[pkg] = flat[pkg] ?? null
    }
    matrix[name] = row
  }
  return matrix
}

//----------------------------------------------------------------------------------
//  action_readInstalledVersions — read actual installed version from each project's node_modules
//----------------------------------------------------------------------------------
export async function action_readInstalledVersions(): Promise<VersionMatrix> {
  const projects = discoverProjects()
  const packages = collectPackages(projects)
  const matrix: VersionMatrix = {}
  for (const { name, absPath } of projects) {
    const row: Record<string, string | null> = {}
    for (const pkg of packages) {
      const installedPkgJson = join(absPath, 'node_modules', pkg, 'package.json')
      if (!existsSync(installedPkgJson)) {
        row[pkg] = null
        continue
      }
      try {
        const data = JSON.parse(readFileSync(installedPkgJson, 'utf-8')) as { version?: string }
        row[pkg] = data.version ?? null
      } catch {
        row[pkg] = null
      }
    }
    matrix[name] = row
  }
  return matrix
}

//----------------------------------------------------------------------------------
//  action_fetchLatestVersions — query npm registry for latest version of each package
//----------------------------------------------------------------------------------
export async function action_fetchLatestVersions(packages: string[]): Promise<Record<string, string>> {
  const entries = await Promise.all(
    packages.map(async pkg => {
      try {
        const encoded = pkg.startsWith('@') ? pkg.replace('/', '%2F') : pkg
        const res = await fetch(`https://registry.npmjs.org/${encoded}/latest`, {
          next: { revalidate: 0 },
        })
        const data = await res.json() as { version: string }
        return [pkg, data.version] as const
      } catch {
        return [pkg, '?'] as const
      }
    })
  )
  return Object.fromEntries(entries)
}

//----------------------------------------------------------------------------------
//  action_readTargets — read saved target versions from sync-targets.json
//----------------------------------------------------------------------------------
export async function action_readTargets(): Promise<Record<string, string>> {
  try {
    return JSON.parse(readFileSync(TARGETS_FILE, 'utf-8')) as Record<string, string>
  } catch {
    return {}
  }
}

//----------------------------------------------------------------------------------
//  action_saveTarget — save or update a target version for a package
//----------------------------------------------------------------------------------
export async function action_saveTarget(pkg: string, version: string): Promise<void> {
  const targets = await action_readTargets()
  targets[pkg] = version
  writeFileSync(TARGETS_FILE, JSON.stringify(targets, null, 2) + '\n', 'utf-8')
}

//----------------------------------------------------------------------------------
//  action_deleteTarget — remove a target version for a package
//----------------------------------------------------------------------------------
export async function action_deleteTarget(pkg: string): Promise<void> {
  const targets = await action_readTargets()
  delete targets[pkg]
  writeFileSync(TARGETS_FILE, JSON.stringify(targets, null, 2) + '\n', 'utf-8')
}

//----------------------------------------------------------------------------------
//  action_syncVersions — update each project's packages to target or npm latest
//----------------------------------------------------------------------------------
export async function action_syncVersions(): Promise<SyncResult[]> {
  const projects = discoverProjects()
  const packages = collectPackages(projects)
  const latest = await action_fetchLatestVersions(packages)
  const targets = await action_readTargets()
  const results: SyncResult[] = []

  for (const { name, absPath } of projects) {
    const pkgPath = join(absPath, 'package.json')
    let pkg: Record<string, Record<string, string> | undefined>
    try {
      pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))
    } catch {
      results.push({ project: name, changes: ['package.json has invalid JSON — skipped'], npmrc: '' })
      continue
    }

    const allChanges: string[] = []

    for (const section of ['dependencies', 'devDependencies', 'peerDependencies'] as const) {
      const sec = pkg[section]
      if (!sec) continue
      for (const [dep, cur] of Object.entries(sec)) {
        if (cur.includes(':')) continue  // skip GitHub/git/file URL references
        const effective = targets[dep] ?? latest[dep]
        if (effective && effective !== '?' && cur !== effective) {
          sec[dep] = effective
          allChanges.push(`${dep}: ${cur} → ${effective}`)
        }
      }
    }

    if (allChanges.length > 0) {
      writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf-8')
    }

    const npmrcPath = join(absPath, '.npmrc')
    let npmrcStatus = 'already set'
    if (!existsSync(npmrcPath)) {
      writeFileSync(npmrcPath, 'save-exact=true\n', 'utf-8')
      npmrcStatus = 'created'
    } else {
      const existing = readFileSync(npmrcPath, 'utf-8')
      if (!existing.includes('save-exact=true')) {
        writeFileSync(npmrcPath, existing.trimEnd() + '\nsave-exact=true\n', 'utf-8')
        npmrcStatus = 'updated'
      }
    }

    results.push({ project: name, changes: allChanges, npmrc: npmrcStatus })
  }

  return results
}
