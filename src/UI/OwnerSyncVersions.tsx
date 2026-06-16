'use client'

import { useState, useEffect } from 'react'
import { MyButton } from '../components/MyButton'
import { MyInput } from '../components/MyInput'
import {
  action_syncVersions,
  action_readVersions,
  action_readInstalledVersions,
  action_fetchLatestVersions,
  action_readLocalPackageVersions,
  action_readProjectVersions,
  action_readTargets,
  action_saveTarget,
  action_deleteTarget,
  type SyncResult,
  type VersionMatrix,
} from './OwnerSyncVersions_actions'

function semverCompare(a: string, b: string): number {
  const pa = a.split('.').map(Number)
  const pb = b.split('.').map(Number)
  for (let i = 0; i < 3; i++) {
    const diff = (pa[i] ?? 0) - (pb[i] ?? 0)
    if (diff !== 0) return diff
  }
  return 0
}

function extractBaseVersion(value: string): string {
  return value.replace(/^[>=<^~\s]+/, '')
}

export default function OwnerSyncVersions() {
  const [matrix, setMatrix] = useState<VersionMatrix | null>(null)
  const [installed, setInstalled] = useState<VersionMatrix | null>(null)
  const [latest, setLatest] = useState<Record<string, string> | null>(null)
  const [localVersions, setLocalVersions] = useState<Record<string, string>>({})
  const [projectVersions, setProjectVersions] = useState<Record<string, string>>({})
  const [targets, setTargets] = useState<Record<string, string>>({})
  const [targetError, setTargetError] = useState<string | null>(null)
  const [syncResults, setSyncResults] = useState<SyncResult[] | null>(null)
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    async function load() {
      const [m, t, ins, pv] = await Promise.all([action_readVersions(), action_readTargets(), action_readInstalledVersions(), action_readProjectVersions()])
      setMatrix(m)
      setTargets(t)
      setInstalled(ins)
      setProjectVersions(pv)
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
    }
    load()
  }, [])

  async function handleSync() {
    setSyncing(true)
    setSyncResults(null)
    const results = await action_syncVersions()
    setSyncResults(results)
    const [m, ins] = await Promise.all([action_readVersions(), action_readInstalledVersions()])
    setMatrix(m)
    setInstalled(ins)
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

  async function handleTargetBlur(pkg: string, value: string) {
    const trimmed = value.trim()
    setTargetError(null)

    if (trimmed === '') {
      await action_deleteTarget(pkg)
      setTargets(prev => { const next = { ...prev }; delete next[pkg]; return next })
      return
    }

    const latestVer = latest?.[pkg]
    if (latestVer && latestVer !== '?') {
      const base = extractBaseVersion(trimmed)
      if (semverCompare(base, latestVer) > 0) {
        setTargetError(`${pkg}: target ${trimmed} exceeds latest ${latestVer} — not saved`)
        return
      }
    }

    if (trimmed !== targets[pkg]) {
      await action_saveTarget(pkg, trimmed)
      setTargets(prev => ({ ...prev, [pkg]: trimmed }))
    }
  }

  const projects = matrix ? Object.keys(matrix) : []
  const packages = matrix
    ? [...new Set(Object.values(matrix).flatMap(row => Object.keys(row)))].sort()
    : []

  return (
    <div className='p-4'>
      <div className='flex items-center gap-3 mb-2'>
        <MyButton onClick={handleSync} disabled={syncing || !matrix}>
          {syncing ? 'Syncing...' : 'Sync All'}
        </MyButton>
        {syncResults && (
          <span className='text-xxs text-gray-500'>
            {syncResults.every(r => r.changes.length === 0)
              ? 'All already at target'
              : `Updated ${syncResults.filter(r => r.changes.length > 0).length} project(s)`}
          </span>
        )}
      </div>
      <div className='flex items-center gap-4 mb-4 text-xxs'>
        <span className='text-green-700'>● Up to date</span>
        <span className='text-purple-600'>● Needs npm install</span>
        <span className='text-red-600'>● Version mismatch</span>
      </div>

      {targetError && (
        <p className='mb-3 text-xxs text-red-600 font-semibold'>{targetError}</p>
      )}

      {!matrix ? (
        <p className='text-xxs text-gray-400'>Loading...</p>
      ) : (
        <div className='overflow-x-auto'>
          <table className='text-xxs table-fixed border-collapse'>
            <thead>
              <tr className='bg-gray-100 text-left'>
                <th className='w-44 px-2 py-1 font-semibold text-gray-600 border border-gray-200'>Package</th>
                <th className='w-20 px-2 py-1 font-semibold text-gray-600 border border-gray-200'>Latest</th>
                <th className='w-20 px-2 py-1 font-semibold text-blue-600 border border-gray-200'>Target</th>
                {projects.map(p => (
                  <th key={p} className='w-32 px-2 py-1 font-semibold text-gray-600 border border-gray-200'>{p}</th>
                ))}
              </tr>
              <tr className='bg-gray-100 text-left'>
                <th className='px-2 py-1 font-semibold text-gray-600 border border-gray-200'>Version</th>
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
              {packages.map(pkg => {
                const latestVer = latest?.[pkg]
                const targetVer = targets[pkg]
                const reference = targetVer ?? latestVer
                const localVer = localVersions[pkg]
                const displayLatest = localVer ?? latestVer
                return (
                  <tr key={pkg} className='odd:bg-white even:bg-gray-50'>
                    <td className='px-2 py-0.5 font-mono text-gray-700 border border-gray-200'>{pkg}</td>
                    <td className='px-2 py-0.5 font-mono text-gray-500 border border-gray-200'>
                      {displayLatest ?? '…'}
                    </td>
                    <td className='px-1 py-0.5 border border-gray-200'>
                      <MyInput
                        overrideClass='h-5 w-full text-xxs font-mono rounded-none border-0'
                        defaultValue={targetVer ?? ''}
                        placeholder=''
                        onBlur={e => handleTargetBlur(pkg, e.target.value)}
                      />
                    </td>
                    {projects.map(proj => {
                      const ver = matrix[proj]?.[pkg] ?? null
                      const isUrl = ver?.includes(':') ?? false
                      const instVer = installed?.[proj]?.[pkg] ?? null
                      if (isUrl) {
                        const upToDate = localVer != null && instVer === localVer
                        const behind = localVer != null && instVer != null && !upToDate
                        return (
                          <td
                            key={proj}
                            className={`px-2 py-0.5 font-mono border border-gray-200 ${
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
                          </td>
                        )
                      }
                      const aligned = reference != null && ver === reference
                      const refBase = reference ? extractBaseVersion(reference) : null
                      const isInstalled = aligned && instVer != null && refBase != null && semverCompare(instVer, refBase) >= 0
                      return (
                        <td
                          key={proj}
                          className={`px-2 py-0.5 font-mono border border-gray-200 ${
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
                        </td>
                      )
                    })}
                  </tr>
                )
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
  )
}
