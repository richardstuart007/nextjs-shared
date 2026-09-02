'use client'

//==============================================================================================
//  1) DESCRIPTION
//    OwnerSyncVersions — cross-project package-version matrix, with per-package target pinning
//    (deps/overrides) and a one-click Sync that applies targets/npm-latest to every project's
//    package.json + .npmrc
//==============================================================================================

import { useState, useEffect, useMemo } from 'react'
import { MyButton } from '../components/MyButton'
import { MyInput } from '../components/MyInput'
import { MyHelp } from '../components/MyHelp'
import {
  action_syncVersions,
  action_readVersions,
  action_readInstalledVersions,
  action_readSections,
  action_fetchLatestVersions,
  action_readLocalPackageVersions,
  action_readProjectVersions,
  action_readTargets,
  action_saveTarget,
  action_deleteTarget,
  type SyncResult,
  type SyncTargets,
  type VersionMatrix,
  type SectionMatrix,
} from './OwnerSyncVersions_actions'
import sectionExceptions from './section-exceptions.json'

const SECTION_ORDER: Record<string, number> = { d: 0, v: 1, p: 2, o: 3 }
const SECTION_LABELS: Record<string, string> = {
  d: 'dependencies',
  v: 'devDependencies',
  p: 'peerDependencies',
  o: 'overrides',
}

//
//  Compact "?" trigger for the column-heading MyHelp popovers — sized down to fit the text-xxs header row
//
const HELP_BUTTON_CLASS = 'text-xxs text-blue-600 hover:text-blue-800 border border-blue-300 rounded px-1 leading-none'

//
//  MyHelp_panelDftClass + right-0 so the Sync column's popover (far-right column) opens leftward and stays on-screen
//
const SYNC_HELP_PANEL_CLASS = 'absolute right-0 z-10 mt-1 p-3 bg-blue-50 border border-blue-200 rounded-md text-xs space-y-2 max-w-md shadow-md'

const HELP_LATEST =
  'Newest version published to the npm registry right now (live lookup; for nextjs-shared, the local source version minus one patch = last published release). Independent of your projects — a project column only shows this value after a Sync brings it up to date, so rows normally sit behind it.'
const HELP_INSTALLED =
  'The version actually resolved into node_modules (the highest across all project columns). Project cells show the declared package.json spec instead, so they only match this where the project exact-pins and has been npm install-ed; ranges (^, ~) and stale installs make them differ.'
const HELP_DEP =
  'Optional pin: the version to set for this package in its dependencies / devDependencies / peerDependencies section on Sync. Blank = Sync uses npm latest.'
const HELP_OVERRIDE =
  'Optional pin: the version to force via the package.json "overrides" block on Sync. Blank = no override.'
const HELP_SYNC_ROW =
  "Runs Sync for just this one package across every project: writes its Dep target (or Override target, or npm latest if neither is set) into each project's package.json, then reinstall the changed projects. The button colour is that row's biggest version gap — red = a major behind, orange = minor, amber = patch, blue = already aligned. It turns blue after a successful Sync."
const HELP_SYNC_ALL =
  "Same as a per-row Sync but for every package at once — brings all projects' package.json up to each package's Dep/Override target or npm latest in one pass, then reinstall each changed project."

//
//  Severity ranking so a row's worst version gap can be picked out (major beats minor beats patch)
//
const DIFF_RANK: Record<'major' | 'minor' | 'patch', number> = { major: 3, minor: 2, patch: 1 }

export default function OwnerSyncVersions() {
  const [matrix, setMatrix] = useState<VersionMatrix | null>(null)
  const [installed, setInstalled] = useState<VersionMatrix | null>(null)
  const [latest, setLatest] = useState<Record<string, string> | null>(null)
  const [localVersions, setLocalVersions] = useState<Record<string, string>>({})
  const [projectVersions, setProjectVersions] = useState<Record<string, string>>({})
  const [targets, setTargets] = useState<SyncTargets>({ deps: {}, overrides: {} })
  const [syncResults, setSyncResults] = useState<SyncResult[] | null>(null)
  const [sections, setSections] = useState<SectionMatrix | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [parseErrors, setParseErrors] = useState<string[]>([])
  const [filterMajor, setFilterMajor] = useState(true)
  const [filterMinor, setFilterMinor] = useState(true)
  const [filterPatch, setFilterPatch] = useState(true)

  useEffect(() => {
    handleRefresh()
  }, [])

  const projects = matrix ? Object.keys(matrix) : []
  const packages = matrix
    ? [...new Set(Object.values(matrix).flatMap(row => Object.keys(row)))].sort()
    : []

  const dominantSection = useMemo(() => {
    const result: Record<string, string> = {}
    if (!sections) return result
    for (const pkg of packages) {
      const counts: Record<string, number> = {}
      for (const proj of projects) {
        const code = sections[proj]?.[pkg]
        if (!code) continue
        for (const letter of code) counts[letter] = (counts[letter] ?? 0) + 1
      }
      let best = ''
      let bestCount = -1
      for (const sec of ['d', 'v', 'p', 'o']) {
        const c = counts[sec] ?? 0
        if (c > bestCount) { bestCount = c; best = sec }
      }
      result[pkg] = best
    }
    return result
  }, [sections, packages, projects])

  const sortedPackages = useMemo(() =>
    [...packages].sort((a, b) => {
      const sa = SECTION_ORDER[dominantSection[a] ?? ''] ?? 4
      const sb = SECTION_ORDER[dominantSection[b] ?? ''] ?? 4
      return sa !== sb ? sa - sb : a.localeCompare(b)
    }),
    [packages, dominantSection]
  )

  const installedMax: Record<string, string> = {}
  if (installed) {
    for (const pkg of packages) {
      const versions = projects.map(p => installed[p]?.[pkg]).filter((v): v is string => v != null)
      if (versions.length > 0) installedMax[pkg] = versions.reduce((a, b) => semverCompare(a, b) >= 0 ? a : b)
    }
  }

  //
  //  Per-project count of packages whose declared version matches the reference but whose
  //  node_modules is still behind — i.e. the purple "needs npm install" cells. Drives the
  //  #reinstall header row. URL-referenced packages (nextjs-shared) never count.
  //
  const reinstallCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const proj of projects) counts[proj] = 0
    for (const pkg of packages) {
      const reference = targets.deps[pkg] ?? targets.overrides[pkg] ?? latest?.[pkg]
      if (reference == null) continue
      const refBase = extractBaseVersion(reference)
      for (const proj of projects) {
        const ver = matrix?.[proj]?.[pkg] ?? null
        if (ver === null || ver.includes(':')) continue
        if (ver !== reference) continue
        const instVer = installed?.[proj]?.[pkg] ?? null
        const isInstalled = instVer != null && semverCompare(instVer, refBase) >= 0
        if (!isInstalled) counts[proj] += 1
      }
    }
    return counts
  }, [projects, packages, matrix, installed, latest, targets])

  return (
    <div className='p-4'>
      <div className='w-fit'>
      <div className='flex items-center gap-3 mb-2'>
        <MyButton onClick={handleRefresh} disabled={refreshing}>
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </MyButton>
        {syncResults && (
          <span className='text-xxs text-gray-500'>
            {syncResults.every(r => r.changes.length === 0)
              ? 'All already at target'
              : `Updated ${syncResults.filter(r => r.changes.length > 0).length} project(s)`}
          </span>
        )}
        <div className='ml-auto flex items-center gap-1'>
          <MyButton onClick={handleSync} disabled={syncing || !matrix} overrideClass='bg-red-600 hover:bg-red-700'>
            {syncing ? 'Syncing...' : 'Sync'}
          </MyButton>
          <MyHelp text={HELP_SYNC_ALL} />
        </div>
      </div>
      <div className='flex items-center gap-4 mb-4 text-xxs'>
        <span className='text-green-700'>● Up to date</span>
        <span className='text-purple-600'>● Needs npm install</span>
        <button
          onClick={() => setFilterMajor(f => !f)}
          className={`px-1.5 py-0.5 rounded border cursor-pointer ${filterMajor ? 'bg-red-100 text-red-800 border-red-300' : 'text-gray-400 border-gray-300'}`}
        >
          ● Major
        </button>
        <button
          onClick={() => setFilterMinor(f => !f)}
          className={`px-1.5 py-0.5 rounded border cursor-pointer ${filterMinor ? 'bg-orange-100 text-orange-800 border-orange-300' : 'text-gray-400 border-gray-300'}`}
        >
          ● Minor
        </button>
        <button
          onClick={() => setFilterPatch(f => !f)}
          className={`px-1.5 py-0.5 rounded border cursor-pointer ${filterPatch ? 'bg-yellow-100 text-yellow-800 border-yellow-300' : 'text-gray-400 border-gray-300'}`}
        >
          ● Patch
        </button>
        <span className='flex items-center gap-1'>
          <span className='inline-block w-3 h-3 bg-pink-100 border border-gray-300'></span>
          Wrong section
        </span>
      </div>

      {!matrix ? (
        <p className='text-xxs text-gray-400'>Loading...</p>
      ) : (
        <div className='overflow-x-auto'>
          <table className='text-xxs table-fixed border-collapse'>
            <thead>
              <tr className='bg-yellow-100 text-left'>
                <th className='w-44 px-2 py-1 font-bold text-gray-600 border border-gray-200'>Package</th>
                <th className='w-24 px-2 py-1 font-bold text-gray-600 border border-gray-200'>
                  <span className='inline-flex items-center gap-1'>
                    Latest
                    <MyHelp text={HELP_LATEST} buttonClass={HELP_BUTTON_CLASS} />
                  </span>
                </th>
                <th className='w-24 px-2 py-1 font-bold text-gray-600 border border-gray-200'>
                  <span className='inline-flex items-center gap-1'>
                    Installed
                    <MyHelp text={HELP_INSTALLED} buttonClass={HELP_BUTTON_CLASS} />
                  </span>
                </th>
                <th className='w-28 px-2 py-1 font-bold text-blue-600 border border-gray-200'>
                  <span className='inline-flex items-center gap-1'>
                    Dep
                    <MyHelp text={HELP_DEP} buttonClass={HELP_BUTTON_CLASS} />
                  </span>
                </th>
                <th className='w-28 px-2 py-1 font-bold text-amber-600 border border-gray-200'>
                  <span className='inline-flex items-center gap-1'>
                    Override
                    <MyHelp text={HELP_OVERRIDE} buttonClass={HELP_BUTTON_CLASS} />
                  </span>
                </th>
                {projects.map(p => (
                  <th key={p} className={`w-32 px-2 py-1 font-bold border border-gray-200 ${parseErrors.includes(p) ? 'text-red-600' : 'text-gray-600'}`}>
                    {p}{parseErrors.includes(p) ? ' !' : ''}
                  </th>
                ))}
                <th className='w-20 px-2 py-1 font-bold text-gray-600 border border-gray-200'>
                  <span className='inline-flex items-center gap-1'>
                    Sync
                    <MyHelp text={HELP_SYNC_ROW} buttonClass={HELP_BUTTON_CLASS} panelClass={SYNC_HELP_PANEL_CLASS} />
                  </span>
                </th>
              </tr>
              <tr className='bg-yellow-100 text-left'>
                <th className='px-2 py-1 font-bold text-gray-600 border border-gray-200'>Version</th>
                <th className='px-2 py-1 border border-gray-200'></th>
                <th className='px-2 py-1 border border-gray-200'></th>
                <th className='px-2 py-1 border border-gray-200'></th>
                <th className='px-2 py-1 border border-gray-200'></th>
                {projects.map(proj => (
                  <th key={proj} className='px-2 py-1 font-mono font-semibold text-gray-600 border border-gray-200'>
                    {projectVersions[proj] ?? ''}
                  </th>
                ))}
                <th className='px-2 py-1 border border-gray-200'></th>
              </tr>
              <tr className='bg-yellow-100 text-left'>
                <th className='px-2 py-1 font-bold text-gray-600 border border-gray-200'>#reinstall</th>
                <th className='px-2 py-1 border border-gray-200'></th>
                <th className='px-2 py-1 border border-gray-200'></th>
                <th className='px-2 py-1 border border-gray-200'></th>
                <th className='px-2 py-1 border border-gray-200'></th>
                {projects.map(proj => (
                  <th key={proj} className='px-2 py-1 font-semibold text-purple-600 border border-gray-200'>
                    {reinstallCounts[proj] > 0 ? `⟳ ${reinstallCounts[proj]}` : ''}
                  </th>
                ))}
                <th className='px-2 py-1 border border-gray-200'></th>
              </tr>
            </thead>
            <tbody>
              {sortedPackages.flatMap((pkg, i) => {
                const pkgSection = dominantSection[pkg] ?? ''
                const prevSection = i > 0 ? (dominantSection[sortedPackages[i - 1]] ?? '') : ''
                const showHeader = pkgSection !== prevSection && pkgSection !== ''
                const latestVer = latest?.[pkg]
                const depTarget = targets.deps[pkg]
                const overrideTarget = targets.overrides[pkg]
                const reference = depTarget ?? overrideTarget ?? latestVer
                const localVer = localVersions[pkg]
                const displayLatest = localVer ?? latestVer

                //
                //  Row-level scan of every project cell:
                //    worstDiff       — biggest version gap, drives the Sync button colour
                //    syncWouldChange — whether a Sync would actually rewrite any project's
                //                      package.json for this package; when false the row's
                //                      Sync button is hidden entirely (nothing to do)
                //
                //  A URL-referenced dep (e.g. nextjs-shared) is only rewritten by Sync when a
                //  target is set to replace the URL, so it counts toward syncWouldChange only then.
                //
                let worstDiff: 'major' | 'minor' | 'patch' | null = null
                let syncWouldChange = false
                for (const proj of projects) {
                  const projVer = matrix[proj]?.[pkg] ?? null
                  if (projVer === null) continue
                  const projInst = installed?.[proj]?.[pkg] ?? null
                  let d: 'major' | 'minor' | 'patch' | 'same' | null = null
                  if (projVer.includes(':')) {
                    if (localVer != null && projInst != null && projInst !== localVer) d = versionDiff(projInst, localVer)
                    if ((depTarget != null || overrideTarget != null) && reference != null && projVer !== reference) syncWouldChange = true
                  } else if (reference != null && projVer !== reference) {
                    syncWouldChange = true
                    d = versionDiff(projVer, reference)
                  }
                  if (d != null && d !== 'same' && (worstDiff === null || DIFF_RANK[d] > DIFF_RANK[worstDiff])) worstDiff = d
                }
                //
                //  md: variants are repeated because MyButton's default class is 'h-6 md:h-8' /
                //  'px-1 md:px-2' — a bare h-4/px-1.5 only replaces the non-variant half
                //
                //
                //  Severity palette — red / orange / yellow, kept in step with the cell text
                //  colours below and the Major/Minor/Patch filter chips. Patch (yellow) button
                //  gets dark text since white on yellow-500 is unreadable.
                //
                const syncBtnSize = 'h-6 md:h-6 px-1.5 md:px-1.5 text-xxs'
                const syncBtnClass =
                  worstDiff === 'major' ? `${syncBtnSize} bg-red-600 hover:bg-red-700` :
                  worstDiff === 'minor' ? `${syncBtnSize} bg-orange-500 hover:bg-orange-600` :
                  worstDiff === 'patch' ? `${syncBtnSize} bg-yellow-500 hover:bg-yellow-600 text-gray-900` :
                  syncBtnSize

                const dataRow = (
                  <tr key={pkg} className='odd:bg-white even:bg-gray-50'>
                    <td className='px-2 py-0.5 font-mono text-gray-700 border border-gray-200'>{pkg}</td>
                    <td className='px-2 py-0.5 font-mono text-gray-500 border border-gray-200'>
                      {displayLatest ?? '…'}
                    </td>
                    <td className='px-2 py-0.5 font-mono text-gray-500 border border-gray-200'>
                      {installedMax[pkg] ?? ''}
                    </td>
                    <td className='px-1 py-0.5 border border-gray-200'>
                      <MyInput
                        overrideClass='h-5 w-full text-xxs font-mono rounded-none border-0 bg-transparent text-left px-0'
                        defaultValue={depTarget ?? ''}
                        placeholder=''
                        onBlur={e => handleTargetBlur(pkg, e.target.value, 'deps')}
                      />
                    </td>
                    <td className='px-1 py-0.5 border border-gray-200'>
                      <MyInput
                        overrideClass='h-5 w-full text-xxs font-mono rounded-none border-0 bg-transparent text-left px-0'
                        defaultValue={overrideTarget ?? ''}
                        placeholder=''
                        onBlur={e => handleTargetBlur(pkg, e.target.value, 'overrides')}
                      />
                    </td>
                    {projects.map(proj => {
                      const ver = matrix[proj]?.[pkg] ?? null
                      const isUrl = ver?.includes(':') ?? false
                      const instVer = installed?.[proj]?.[pkg] ?? null
                      const sectionCode = sections?.[proj]?.[pkg]
                      const sectionMismatch =
                        !!dominantSection[pkg] &&
                        sectionCode != null &&
                        !sectionCode.includes(dominantSection[pkg]) &&
                        !(sectionExceptions as Record<string, string[]>)[proj]?.includes(pkg)
                      if (isUrl) {
                        const upToDate = localVer != null && instVer === localVer
                        const behind = localVer != null && instVer != null && !upToDate
                        let urlMismatchClass = ''
                        if (behind && instVer != null && localVer != null) {
                          const diff = versionDiff(instVer, localVer)
                          const highlighted =
                            (diff === 'major' && filterMajor) ||
                            (diff === 'minor' && filterMinor) ||
                            (diff === 'patch' && filterPatch)
                          if (highlighted) {
                            urlMismatchClass =
                              diff === 'major' ? 'text-red-600 font-semibold' :
                              diff === 'minor' ? 'text-orange-500 font-semibold' : 'text-yellow-500 font-semibold'
                          } else {
                            urlMismatchClass = 'font-bold text-gray-400'
                          }
                        }
                        return (
                          <td
                            key={proj}
                            className={`px-2 py-0.5 font-mono border border-gray-200 ${sectionMismatch ? 'bg-pink-100' : ''} ${
                              instVer == null
                                ? 'text-gray-300'
                                : upToDate
                                ? 'text-green-700'
                                : behind
                                ? urlMismatchClass
                                : 'text-gray-400'
                            }`}
                          >
                            {instVer ?? ''}
                            {instVer != null && sectionCode && (
                              <span className='ml-1 font-normal text-gray-400'>{sectionCode}</span>
                            )}
                          </td>
                        )
                      }
                      const aligned = reference != null && ver === reference
                      const refBase = reference ? extractBaseVersion(reference) : null
                      const isInstalled = aligned && instVer != null && refBase != null && semverCompare(instVer, refBase) >= 0
                      let mismatchClass = ''
                      if (!aligned && ver !== null) {
                        const diff = (reference != null && ver != null) ? versionDiff(ver, reference) : 'major'
                        const highlighted =
                          (diff === 'major' && filterMajor) ||
                          (diff === 'minor' && filterMinor) ||
                          (diff === 'patch' && filterPatch)
                        if (highlighted) {
                          mismatchClass =
                            diff === 'major' ? 'text-red-600 font-semibold' :
                            diff === 'minor' ? 'text-orange-500 font-semibold' : 'text-yellow-500 font-semibold'
                        } else {
                          mismatchClass = 'font-bold text-gray-400'
                        }
                      }
                      return (
                        <td
                          key={proj}
                          className={`px-2 py-0.5 font-mono border border-gray-200 ${sectionMismatch ? 'bg-pink-100' : ''} ${
                            ver === null
                              ? 'text-gray-300'
                              : !aligned
                              ? mismatchClass
                              : isInstalled
                              ? 'text-green-700'
                              : 'text-purple-600 font-semibold'
                          }`}
                        >
                          {ver === null ? '' : ver}
                          {ver !== null && sectionCode && (
                            <span className='ml-1 font-normal text-gray-400'>{sectionCode}</span>
                          )}
                        </td>
                      )
                    })}
                    <td className='px-1 py-0.5 border border-gray-200 text-center'>
                      {syncWouldChange && (
                        <MyButton
                          onClick={() => handleSyncPackage(pkg)}
                          disabled={syncing}
                          overrideClass={syncBtnClass}
                        >
                          Sync
                        </MyButton>
                      )}
                    </td>
                  </tr>
                )
                return showHeader ? [
                  <tr key={`section-${pkgSection}`} className='bg-gray-200'>
                    <td colSpan={6 + projects.length} className='px-2 py-0.5 font-bold text-gray-600 text-xxs'>
                      {SECTION_LABELS[pkgSection] ?? pkgSection}
                    </td>
                  </tr>,
                  dataRow,
                ] : [dataRow]
              })}
            </tbody>
          </table>
        </div>
      )}

      {syncResults && syncResults.some(r => r.changes.length > 0) && (
        <div className='mt-3 text-xxs text-gray-500'>
          In each updated project run: <span className='font-mono'>Remove-Item -Recurse -Force node_modules; Remove-Item -Force package-lock.json; npm install</span>
        </div>
      )}
      </div>
    </div>
  )

  //----------------------------------------------------------------------------------------------
  //  handleRefresh — reloads the full version matrix, targets, installed versions,
  //  project versions, sections, npm-latest, and local (GitHub-referenced) versions
  //----------------------------------------------------------------------------------------------
  async function handleRefresh() {
    setRefreshing(true)
    const [vr, t, ins, pv, sec] = await Promise.all([action_readVersions(), action_readTargets(), action_readInstalledVersions(), action_readProjectVersions(), action_readSections()])
    const { matrix: m, parseErrors: pe } = vr
    setMatrix(m)
    setParseErrors(pe)
    setTargets(t)
    setInstalled(ins)
    setProjectVersions(pv)
    setSections(sec)
    const packages = [...new Set(Object.values(m).flatMap(row => Object.keys(row)))].sort()
    const urlPackages = packages.filter(pkg =>
      Object.values(m).some(row => row[pkg]?.includes(':'))
    )
    const [l, lv] = await Promise.all([
      action_fetchLatestVersions(packages),
      action_readLocalPackageVersions(urlPackages),
    ])
    setLatest(l)
    setLocalVersions(lv)
    setRefreshing(false)
  }

  //----------------------------------------------------------------------------------------------
  //  handleSync — runs action_syncVersions, then reloads the same data as handleRefresh
  //  (minus targets/project versions/local versions, which sync doesn't change)
  //----------------------------------------------------------------------------------------------
  async function handleSync() {
    setSyncing(true)
    setSyncResults(null)
    const results = await action_syncVersions()
    setSyncResults(results)
    const [vr, ins, sec] = await Promise.all([action_readVersions(), action_readInstalledVersions(), action_readSections()])
    const { matrix: m, parseErrors: pe } = vr
    setMatrix(m)
    setParseErrors(pe)
    setInstalled(ins)
    setSections(sec)
    const packages = [...new Set(Object.values(m).flatMap(row => Object.keys(row)))].sort()
    const urlPackages = packages.filter(pkg =>
      Object.values(m).some(row => row[pkg]?.includes(':'))
    )
    const [l, lv] = await Promise.all([
      action_fetchLatestVersions(packages),
      action_readLocalPackageVersions(urlPackages),
    ])
    setLatest(l)
    setLocalVersions(lv)
    setSyncing(false)
  }

  //----------------------------------------------------------------------------------------------
  //  handleSyncPackage — same as handleSync but scoped to a single package across all projects
  //
  //  Params:
  //    pkg — the package name to sync (its Dep/Override target if set, else npm latest)
  //----------------------------------------------------------------------------------------------
  async function handleSyncPackage(pkg: string) {
    setSyncing(true)
    setSyncResults(null)
    const results = await action_syncVersions(pkg)
    setSyncResults(results)
    const [vr, ins, sec] = await Promise.all([action_readVersions(), action_readInstalledVersions(), action_readSections()])
    const { matrix: m, parseErrors: pe } = vr
    setMatrix(m)
    setParseErrors(pe)
    setInstalled(ins)
    setSections(sec)
    const packages = [...new Set(Object.values(m).flatMap(row => Object.keys(row)))].sort()
    const urlPackages = packages.filter(p =>
      Object.values(m).some(row => row[p]?.includes(':'))
    )
    const [l, lv] = await Promise.all([
      action_fetchLatestVersions(packages),
      action_readLocalPackageVersions(urlPackages),
    ])
    setLatest(l)
    setLocalVersions(lv)
    setSyncing(false)
  }

  //----------------------------------------------------------------------------------------------
  //  handleTargetBlur — saves (or, if cleared, deletes) one package's target version
  //
  //  Params:
  //    pkg   — package name
  //    value — the input's current value
  //    kind  — which target section this input edits ('deps' or 'overrides')
  //----------------------------------------------------------------------------------------------
  async function handleTargetBlur(pkg: string, value: string, kind: 'deps' | 'overrides') {
    const trimmed = value.trim()

    if (trimmed === '') {
      await action_deleteTarget(pkg, kind)
      setTargets(prev => {
        const next = { deps: { ...prev.deps }, overrides: { ...prev.overrides } }
        delete next[kind][pkg]
        return next
      })
      return
    }

    if (trimmed !== targets[kind][pkg]) {
      await action_saveTarget(pkg, trimmed, kind)
      setTargets(prev => ({ ...prev, [kind]: { ...prev[kind], [pkg]: trimmed } }))
    }
  }
}

//----------------------------------------------------------------------------------------------
//  semverCompare — compares two semver strings' major.minor.patch segments
//
//  Params:
//    a, b — semver strings (a pre-release suffix, if any, is ignored)
//
//  Returns:
//    negative if a < b, positive if a > b, 0 if equal
//----------------------------------------------------------------------------------------------
function semverCompare(a: string, b: string): number {
  const pa = a.replace(/-.*$/, '').split('.').map(Number)
  const pb = b.replace(/-.*$/, '').split('.').map(Number)
  for (let i = 0; i < 3; i++) {
    const diff = (pa[i] ?? 0) - (pb[i] ?? 0)
    if (diff !== 0) return diff
  }
  return 0
}

//----------------------------------------------------------------------------------------------
//  versionDiff — classifies how two versions differ
//
//  Params:
//    a, b — version specs to compare (range operators stripped via extractBaseVersion)
//
//  Returns:
//    'major' | 'minor' | 'patch' | 'same', for the highest-order segment that differs
//----------------------------------------------------------------------------------------------
function versionDiff(a: string, b: string): 'major' | 'minor' | 'patch' | 'same' {
  const pa = extractBaseVersion(a).split('.').map(Number)
  const pb = extractBaseVersion(b).split('.').map(Number)
  if ((pa[0] ?? 0) !== (pb[0] ?? 0)) return 'major'
  if ((pa[1] ?? 0) !== (pb[1] ?? 0)) return 'minor'
  if ((pa[2] ?? 0) !== (pb[2] ?? 0)) return 'patch'
  return 'same'
}

//----------------------------------------------------------------------------------------------
//  extractBaseVersion — strips a leading range operator (>=, ^, ~, etc.) from a version spec
//
//  Params:
//    value — a version spec, e.g. '^1.2.3'
//
//  Returns:
//    the bare version, e.g. '1.2.3'
//----------------------------------------------------------------------------------------------
function extractBaseVersion(value: string): string {
  return value.replace(/^[>=<^~\s]+/, '')
}
