'use client'

import { useState, useEffect, useMemo } from 'react'
import { MyButton } from '../components/MyButton'
import { MyInput } from '../components/MyInput'
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

function semverCompare(a: string, b: string): number {
  const pa = a.replace(/-.*$/, '').split('.').map(Number)
  const pb = b.replace(/-.*$/, '').split('.').map(Number)
  for (let i = 0; i < 3; i++) {
    const diff = (pa[i] ?? 0) - (pb[i] ?? 0)
    if (diff !== 0) return diff
  }
  return 0
}

function extractBaseVersion(value: string): string {
  return value.replace(/^[>=<^~\s]+/, '')
}

const SECTION_ORDER: Record<string, number> = { d: 0, v: 1, p: 2, o: 3 }
const SECTION_LABELS: Record<string, string> = {
  d: 'dependencies',
  v: 'devDependencies',
  p: 'peerDependencies',
  o: 'overrides',
}

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

  useEffect(() => {
    handleRefresh()
  }, [])

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
        <div className='ml-auto'>
          <MyButton onClick={handleSync} disabled={syncing || !matrix} overrideClass='bg-red-600 hover:bg-red-700'>
            {syncing ? 'Syncing...' : 'Sync'}
          </MyButton>
        </div>
      </div>
      <div className='flex items-center gap-4 mb-4 text-xxs'>
        <span className='text-green-700'>● Up to date</span>
        <span className='text-purple-600'>● Needs npm install</span>
        <span className='text-red-600'>● Version mismatch</span>
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
                <th className='w-20 px-2 py-1 font-bold text-gray-600 border border-gray-200'>Latest</th>
                <th className='w-20 px-2 py-1 font-bold text-gray-600 border border-gray-200'>Installed</th>
                <th className='w-28 px-2 py-1 font-bold text-blue-600 border border-gray-200'>Dep</th>
                <th className='w-28 px-2 py-1 font-bold text-amber-600 border border-gray-200'>Override</th>
                {projects.map(p => (
                  <th key={p} className={`w-32 px-2 py-1 font-bold border border-gray-200 ${parseErrors.includes(p) ? 'text-red-600' : 'text-gray-600'}`}>
                    {p}{parseErrors.includes(p) ? ' !' : ''}
                  </th>
                ))}
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
                        return (
                          <td
                            key={proj}
                            className={`px-2 py-0.5 font-mono border border-gray-200 ${sectionMismatch ? 'bg-pink-100' : ''} ${
                              instVer == null
                                ? 'text-gray-300'
                                : upToDate
                                ? 'text-green-700'
                                : behind
                                ? 'text-red-600 font-semibold'
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
                      return (
                        <td
                          key={proj}
                          className={`px-2 py-0.5 font-mono border border-gray-200 ${sectionMismatch ? 'bg-pink-100' : ''} ${
                            ver === null
                              ? 'text-gray-300'
                              : !aligned
                              ? 'text-red-600 font-semibold'
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
                  </tr>
                )
                return showHeader ? [
                  <tr key={`section-${pkgSection}`} className='bg-gray-200'>
                    <td colSpan={5 + projects.length} className='px-2 py-0.5 font-bold text-gray-600 text-xxs'>
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
}
