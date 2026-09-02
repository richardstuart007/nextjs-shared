'use server'

import { readFileSync, writeFileSync, existsSync, readdirSync } from 'fs'
import { resolve, join } from 'path'
import { execFileSync } from 'child_process'

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
//
//  Returns:
//    each project's directory name and absolute path
//----------------------------------------------------------------------------------
function discoverProjects(): { name: string; absPath: string }[] {
  return readdirSync(GITHUB_DIR, { withFileTypes: true })
    .filter(e => e.isDirectory() && existsSync(join(GITHUB_DIR, e.name, 'package.json')))
    .map(e => ({ name: e.name, absPath: join(GITHUB_DIR, e.name) }))
}

//----------------------------------------------------------------------------------
//  readPkgFlat — merge dependencies + devDependencies + peerDependencies into one map
//
//  Params:
//    pkgPath — absolute path to a package.json
//
//  Returns:
//    the merged {package: versionSpec} map, or null if the file is missing/invalid
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
//
//  Params:
//    projects — projects to scan (each project's absPath)
//
//  Returns:
//    every distinct package name referenced by any project, alphabetically sorted
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
//
//  Returns:
//    matrix       — [project][package] -> version spec from package.json, or null
//    parseErrors  — project names whose package.json failed to parse
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
//
//  Returns:
//    matrix — [project][package] -> a code string combining 'd'/'v'/'p'/'o' for
//    dependencies/devDependencies/peerDependencies/overrides, or null if absent
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
//
//  Returns:
//    matrix — [project][package] -> the version actually installed, or null
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
//
//  Params:
//    packages — package names to look up
//
//  Returns:
//    a {package: latestVersion} map; a package whose lookup failed maps to '?'
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
//
//  Params:
//    version — a semver string, e.g. '1.2.3'
//
//  Returns:
//    version with its patch segment decremented by 1, or unchanged if the patch is
//    already 0 or the string doesn't have 3 dot-separated segments
//----------------------------------------------------------------------------------
function bumpDownPatch(version: string): string {
  const parts = version.split('.')
  if (parts.length < 3) return version
  const patch = parseInt(parts[2], 10)
  if (isNaN(patch) || patch === 0) return version
  return `${parts[0]}.${parts[1]}.${patch - 1}`
}

//----------------------------------------------------------------------------------
//  action_readLocalPackageVersions — version for GitHub-referenced packages, taken
//  from the package's own committed package.json (git show HEAD:package.json)
//
//  Params:
//    packages — package names to look up (matched against GITHUB_DIR/<pkg>)
//
//  Returns:
//    a {package: version} map — the version on the current commit, i.e. what a
//    `github:` consumer install actually resolves to. Falls back to the working-copy
//    package.json version if the git call fails (git missing / not a repo). Only
//    includes packages whose local repo was found.
//----------------------------------------------------------------------------------
export async function action_readLocalPackageVersions(packages: string[]): Promise<Record<string, string>> {
  const result: Record<string, string> = {}
  for (const pkg of packages) {
    const pkgDir = join(GITHUB_DIR, pkg)
    const localPkgPath = join(pkgDir, 'package.json')
    if (!existsSync(localPkgPath)) continue
    //
    //  Prefer the committed package.json — that's what a `github:` ref resolves to,
    //  not the working copy (normally one release bump ahead before it's pushed)
    //
    try {
      const committed = execFileSync('git', ['-C', pkgDir, 'show', 'HEAD:package.json'], { encoding: 'utf-8' })
      const data = JSON.parse(committed) as { version?: string }
      if (data.version) {
        result[pkg] = data.version
        continue
      }
    } catch { /* git unavailable or not a repo — fall through to the working copy */ }
    try {
      const data = JSON.parse(readFileSync(localPkgPath, 'utf-8')) as { version?: string }
      if (data.version) result[pkg] = data.version
    } catch { /* skip */ }
  }
  return result
}

//----------------------------------------------------------------------------------
//  action_readProjectVersions — read each project's own version from its package.json
//
//  Returns:
//    a {project: version} map (bumped down one patch — see bumpDownPatch)
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
//
//  Returns:
//    the current {deps, overrides} target maps (empty maps if the file is
//    missing/invalid)
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
//
//  Params:
//    pkg     — package name
//    version — the target version to pin
//    kind    — which target section to write into ('deps' or 'overrides')
//----------------------------------------------------------------------------------
export async function action_saveTarget(pkg: string, version: string, kind: 'deps' | 'overrides'): Promise<void> {
  const targets = await action_readTargets()
  targets[kind][pkg] = version
  writeFileSync(TARGETS_FILE, JSON.stringify(targets, null, 2) + '\n', 'utf-8')
}

//----------------------------------------------------------------------------------
//  action_deleteTarget — remove a target version for a package from the given section
//
//  Params:
//    pkg  — package name
//    kind — which target section to remove from ('deps' or 'overrides')
//----------------------------------------------------------------------------------
export async function action_deleteTarget(pkg: string, kind: 'deps' | 'overrides'): Promise<void> {
  const targets = await action_readTargets()
  delete targets[kind][pkg]
  writeFileSync(TARGETS_FILE, JSON.stringify(targets, null, 2) + '\n', 'utf-8')
}

//----------------------------------------------------------------------------------
//  action_syncVersions — update each project's packages to target or npm latest
//
//  Params:
//    packageName — optional; when set, only this one package is synced across all
//                  projects. Phase 1/2a/2b are limited to it, and the stale-override
//                  cleanup only considers this package — every other package's
//                  overrides are left untouched.
//
//  Returns:
//    one SyncResult per project — the human-readable list of changes made and the
//    resulting .npmrc status ('already set' / 'created' / 'updated')
//----------------------------------------------------------------------------------
export async function action_syncVersions(packageName?: string): Promise<SyncResult[]> {
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
        if (packageName && dep !== packageName) continue
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
      if (packageName && dep !== packageName) continue
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
      if (packageName && dep !== packageName) continue
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
    // (when scoped to one package, only that package is eligible for removal)
    for (const dep of Object.keys(newOverrides)) {
      if (packageName && dep !== packageName) continue
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
