'use client'

import { useState, useEffect } from 'react'
import { MyButton } from '../components/MyButton'
import { MyInput } from '../components/MyInput'
import {
  action_syncVersions,
  action_readVersions,
  action_readInstalledVersions,
  action_fetchLatestVersions,
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
  const [targets, setTargets] = useState<Record<string, string>>({})
  const [targetError, setTargetError] = useState<string | null>(null)
  const [syncResults, setSyncResults] = useState<SyncResult[] | null>(null)
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    async function load() {
      const [m, t, ins] = await Promise.all([action_readVersions(), action_readTargets(), action_readInstalledVersions()])
      setMatrix(m)
      setTargets(t)
      setInstalled(ins)
      const packages = [...new Set(Object.values(m).flatMap(row => Object.keys(row)))].sort()
      const l = await action_fetchLatestVersions(packages)
      setLatest(l)
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
    const l = await action_fetchLatestVersions(packages)
    setLatest(l)
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
      <div className='flex items-center gap-3 mb-4'>
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
            </thead>
            <tbody>
              {packages.map(pkg => {
                const latestVer = latest?.[pkg]
                const targetVer = targets[pkg]
                const reference = targetVer ?? latestVer
                return (
                  <tr key={pkg} className='odd:bg-white even:bg-gray-50'>
                    <td className='px-2 py-0.5 font-mono text-gray-700 border border-gray-200'>{pkg}</td>
                    <td className='px-2 py-0.5 font-mono text-gray-500 border border-gray-200'>
                      {latestVer ?? '…'}
                    </td>
                    <td className='px-1 py-0.5 border border-gray-200'>
                      <MyInput
                        overrideClass='h-5 w-full text-xxs font-mono rounded-none border-0'
                        defaultValue={targetVer ?? ''}
                        placeholder='—'
                        onBlur={e => handleTargetBlur(pkg, e.target.value)}
                      />
                    </td>
                    {projects.map(proj => {
                      const ver = matrix[proj]?.[pkg] ?? null
                      const isUrl = ver?.includes(':') ?? false
                      const aligned = reference != null && ver === reference
                      const instVer = installed?.[proj]?.[pkg]
                      const refBase = reference ? extractBaseVersion(reference) : null
                      const isInstalled = aligned && instVer != null && refBase != null && semverCompare(instVer, refBase) >= 0
                      return (
                        <td
                          key={proj}
                          className={`px-2 py-0.5 font-mono border border-gray-200 ${
                            ver === null
                              ? 'text-gray-300'
                              : isUrl
                              ? 'text-gray-400'
                              : !aligned
                              ? 'text-red-600 font-semibold'
                              : isInstalled
                              ? 'text-green-700'
                              : 'text-purple-600 font-semibold'
                          }`}
                        >
                          {ver === null ? '—' : isUrl ? '@latest' : ver}
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
          Run <span className='font-mono'>npm install --force</span> in each updated project to apply changes.
        </div>
      )}
    </div>
  )
}
