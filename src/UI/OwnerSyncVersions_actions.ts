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

export type VersionsResult = {
  matrix: VersionMatrix
  parseErrors: string[]
}

export type SyncTargets = {
  deps: Record<string, string>
  overrides: Record<string, string>
}

export type SectionMatrix = Record<string, Record<string, string | null>>

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
      ...(pkg.overrides ?? {}),
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
export async function action_readVersions(): Promise<VersionsResult> {
  const projects = discoverProjects()
  const packages = collectPackages(projects)
  const matrix: VersionMatrix = {}
  const parseErrors: string[] = []
  for (const { name, absPath } of projects) {
    const flat = readPkgFlat(join(absPath, 'package.json'))
    if (flat === null) {
      parseErrors.push(name)
      const row: Record<string, string | null> = {}
      for (const pkg of packages) row[pkg] = null
      matrix[name] = row
      continue
    }
    const row: Record<string, string | null> = {}
    for (const pkg of packages) {
      row[pkg] = flat[pkg] ?? null
    }
    matrix[name] = row
  }
  return { matrix, parseErrors }
}

//----------------------------------------------------------------------------------
//  action_readSections — per-project, per-package: which section(s) the package lives in
//----------------------------------------------------------------------------------
export async function action_readSections(): Promise<SectionMatrix> {
  const projects = discoverProjects()
  const packages = collectPackages(projects)
  const sectionCodes: { key: 'dependencies' | 'devDependencies' | 'peerDependencies' | 'overrides'; code: string }[] = [
    { key: 'dependencies', code: 'd' },
    { key: 'devDependencies', code: 'v' },
    { key: 'peerDependencies', code: 'p' },
    { key: 'overrides', code: 'o' },
  ]
  const matrix: SectionMatrix = {}
  for (const { name, absPath } of projects) {
    const pkgPath = join(absPath, 'package.json')
    if (!existsSync(pkgPath)) continue
    let pkg: Record<string, Record<string, string> | undefined>
    try {
      pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))
    } catch {
      const row: Record<string, string | null> = {}
      for (const pkgName of packages) row[pkgName] = null
      matrix[name] = row
      continue
    }
    const row: Record<string, string | null> = {}
    for (const pkgName of packages) {
      let code = ''
      for (const { key, code: letter } of sectionCodes) {
        if (pkg[key]?.[pkgName] != null) code += letter
      }
      row[pkgName] = code !== '' ? code : null
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
//  bumpDownPatch — subtract 1 from the patch segment of a semver string
//----------------------------------------------------------------------------------
function bumpDownPatch(version: string): string {
  const parts = version.split('.')
  if (parts.length < 3) return version
  const patch = parseInt(parts[2], 10)
  if (isNaN(patch) || patch === 0) return version
  return `${parts[0]}.${parts[1]}.${patch - 1}`
}

//----------------------------------------------------------------------------------
//  action_readLocalPackageVersions — read version from local source for GitHub-referenced packages
//----------------------------------------------------------------------------------
export async function action_readLocalPackageVersions(packages: string[]): Promise<Record<string, string>> {
  const result: Record<string, string> = {}
  for (const pkg of packages) {
    const localPkgPath = join(GITHUB_DIR, pkg, 'package.json')
    if (!existsSync(localPkgPath)) continue
    try {
      const data = JSON.parse(readFileSync(localPkgPath, 'utf-8')) as { version?: string }
      if (data.version) result[pkg] = bumpDownPatch(data.version)
    } catch { /* skip */ }
  }
  return result
}

//----------------------------------------------------------------------------------
//  action_readProjectVersions — read each project's own version from its package.json
//----------------------------------------------------------------------------------
export async function action_readProjectVersions(): Promise<Record<string, string>> {
  const projects = discoverProjects()
  const result: Record<string, string> = {}
  for (const { name, absPath } of projects) {
    const pkgPath = join(absPath, 'package.json')
    if (!existsSync(pkgPath)) continue
    try {
      const data = JSON.parse(readFileSync(pkgPath, 'utf-8')) as { version?: string }
      if (data.version) result[name] = bumpDownPatch(data.version)
    } catch { /* skip */ }
  }
  return result
}

//----------------------------------------------------------------------------------
//  action_readTargets — read saved targets from sync-targets.json (with migration from old flat format)
//----------------------------------------------------------------------------------
export async function action_readTargets(): Promise<SyncTargets> {
  try {
    const raw = JSON.parse(readFileSync(TARGETS_FILE, 'utf-8')) as Record<string, unknown>
    if ('deps' in raw || 'overrides' in raw) {
      return { deps: (raw.deps ?? {}) as Record<string, string>, overrides: (raw.overrides ?? {}) as Record<string, string> }
    }
    // migrate old flat format — treat everything as overrides
    return { deps: {}, overrides: raw as Record<string, string> }
  } catch {
    return { deps: {}, overrides: {} }
  }
}

//----------------------------------------------------------------------------------
//  action_saveTarget — save or update a target version for a package in the given section
//----------------------------------------------------------------------------------
export async function action_saveTarget(pkg: string, version: string, kind: 'deps' | 'overrides'): Promise<void> {
  const targets = await action_readTargets()
  targets[kind][pkg] = version
  writeFileSync(TARGETS_FILE, JSON.stringify(targets, null, 2) + '\n', 'utf-8')
}

//----------------------------------------------------------------------------------
//  action_deleteTarget — remove a target version for a package from the given section
//----------------------------------------------------------------------------------
export async function action_deleteTarget(pkg: string, kind: 'deps' | 'overrides'): Promise<void> {
  const targets = await action_readTargets()
  delete targets[kind][pkg]
  writeFileSync(TARGETS_FILE, JSON.stringify(targets, null, 2) + '\n', 'utf-8')
}

//----------------------------------------------------------------------------------
//  action_syncVersions — update each project's packages to target or npm latest
//----------------------------------------------------------------------------------
export async function action_syncVersions(): Promise<SyncResult[]> {
  const projects = discoverProjects()
  const packages = collectPackages(projects)
  const latest = await action_fetchLatestVersions(packages)
  const targets: SyncTargets = await action_readTargets()
  const results: SyncResult[] = []

  for (const { name, absPath } of projects) {
    const pkgPath = join(absPath, 'package.json')
    let pkg: Record<string, Record<string, string> | undefined> & { overrides?: Record<string, string> }
    try {
      pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))
    } catch {
      results.push({ project: name, changes: ['package.json has invalid JSON — skipped'], npmrc: '' })
      continue
    }

    const allChanges: string[] = []

    // Phase 1 — update deps/devDeps/peerDeps to npm latest (overrides handles the actual pin)
    for (const section of ['dependencies', 'devDependencies', 'peerDependencies'] as const) {
      const sec = pkg[section]
      if (!sec) continue
      for (const [dep, cur] of Object.entries(sec)) {
        if (cur.includes(':')) continue  // skip GitHub/git/file URL references
        const latestVer = latest[dep]
        if (latestVer && latestVer !== '?' && cur !== latestVer) {
          sec[dep] = latestVer
          allChanges.push(`${dep}: ${cur} → ${latestVer}`)
        }
      }
    }

    // Phase 2a — dep targets: pin directly in whichever dep section the package lives in
    for (const [dep, targetVer] of Object.entries(targets.deps)) {
      const directSection = (['dependencies', 'devDependencies', 'peerDependencies'] as const)
        .find(s => pkg[s]?.[dep] != null)
      if (!directSection) continue
      if (pkg[directSection]![dep] !== targetVer) {
        pkg[directSection]![dep] = targetVer
        allChanges.push(`${dep}: pinned to ${targetVer} in ${directSection}`)
      }
      // Remove from overrides if it was previously there
      if (pkg.overrides?.[dep] != null) {
        delete pkg.overrides![dep]
        allChanges.push(`${dep}: removed from overrides (now pinned in ${directSection})`)
      }
    }

    // Phase 2b — override targets: write to npm overrides block
    const newOverrides: Record<string, string> = { ...(pkg.overrides ?? {}) }

    for (const [dep, targetVer] of Object.entries(targets.overrides)) {
      const isInProject =
        (['dependencies', 'devDependencies', 'peerDependencies'] as const).some(s => pkg[s]?.[dep] != null) ||
        pkg.overrides?.[dep] != null
      if (!isInProject) continue
      if (newOverrides[dep] !== targetVer) {
        newOverrides[dep] = targetVer
        allChanges.push(`${dep}: override pinned to ${targetVer}`)
      }
    }

    // Remove overrides for packages no longer in override targets
    for (const dep of Object.keys(newOverrides)) {
      if (!targets.overrides[dep]) {
        delete newOverrides[dep]
        allChanges.push(`${dep}: override removed`)
        const latestVer = latest[dep]
        if (latestVer && latestVer !== '?') {
          pkg.dependencies ??= {}
          pkg.dependencies[dep] = latestVer
          allChanges.push(`${dep}: restored to dependencies at ${latestVer}`)
        }
      }
    }

    pkg.overrides = Object.keys(newOverrides).length > 0 ? newOverrides : undefined
    if (pkg.overrides === undefined) delete pkg.overrides

    if (allChanges.length > 0) {
      writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf-8')
    }

    const npmrcPath = join(absPath, '.npmrc')
    let npmrcStatus = 'already set'
    if (!existsSync(npmrcPath)) {
      writeFileSync(npmrcPath, 'save-exact=false\nlegacy-peer-deps=true\n', 'utf-8')
      npmrcStatus = 'created'
    } else {
      let content = readFileSync(npmrcPath, 'utf-8')
      let changed = false
      if (!content.includes('save-exact=false')) {
        content = content.replace(/save-exact=true/g, 'save-exact=false')
        if (!content.includes('save-exact=false')) content = content.trimEnd() + '\nsave-exact=false\n'
        changed = true
      }
      if (!content.includes('legacy-peer-deps=true')) {
        content = content.trimEnd() + '\nlegacy-peer-deps=true\n'
        changed = true
      }
      if (changed) {
        writeFileSync(npmrcPath, content, 'utf-8')
        npmrcStatus = 'updated'
      }
    }

    results.push({ project: name, changes: allChanges, npmrc: npmrcStatus })
  }

  return results
}
