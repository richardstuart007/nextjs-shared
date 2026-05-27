'use client'

import { useState, useEffect } from 'react'
import { MyButton } from '../components/MyButton'
import { MyInput } from '../components/MyInput'
import MySelect from '../components/MySelect'
import { MyTextarea } from '../components/MyTextarea'
import { MyHelp } from '../components/MyHelp'
import type { HelpItem } from '../components/MyHelp'
import { list_env_files } from './copyTables'
import type { EnvFile } from './copyTables'
import { fetchRows, createSnapshotTable } from './dataTransfer'
import type { FetchResult, SnapshotResult } from './dataTransfer'

const HELP_ITEMS: HelpItem[] = [
  {
    heading: 'Extract',
    body: 'Write a SELECT against the source database. Results are previewed here before the snapshot is created.',
  },
  {
    heading: 'Snapshot table name',
    body: 'The snapshot table is named <source_location>_<table> — e.g. prod_users or local_orders. It is created in the target database. An existing table with the same name is dropped and recreated.',
  },
  {
    heading: 'Schema',
    body: 'Column types are mirrored from the source table. Computed or aliased columns default to TEXT. No indexes or constraints are created — the table is for querying and comparison only.',
  },
  {
    heading: 'After creating',
    body: 'Use a SQL tool or your database client to query both the real table and the snapshot side by side — e.g. SELECT * FROM users u JOIN prod_users p ON u.id = p.id WHERE u.name != p.name.',
  },
]

const PREVIEW_LIMIT = 20

function extractTableName(sql: string): string {
  const m = sql.match(/FROM\s+(?:public\.)?"?(\w+)"?/i)
  return m ? m[1] : ''
}

export default function DataSnapshot({
  baseDir = '',
  title = '',
}: {
  baseDir?: string
  title?: string
}) {
  const [directory, setDirectory]         = useState(baseDir)
  const [envFiles, setEnvFiles]           = useState<EnvFile[]>([])
  const [sourceEnv, setSourceEnv]         = useState('')
  const [targetEnv, setTargetEnv]         = useState('')
  const [selectSql, setSelectSql]         = useState('')
  const [tableName, setTableName]         = useState('')
  const [fetchResult, setFetchResult]     = useState<FetchResult | null>(null)
  const [snapshotResult, setSnapshotResult] = useState<SnapshotResult | null>(null)
  const [message, setMessage]             = useState('')
  const [running, setRunning]             = useState(false)

  function fullPath(filename: string) {
    return directory ? `${directory}/${filename}` : filename
  }

  function locationFor(file: string) {
    return envFiles.find(e => e.file === file)?.location ?? ''
  }

  function snapshotPreview() {
    const loc = locationFor(sourceEnv).toLowerCase().replace(/[^a-z0-9]/g, '_') || 'snap'
    return tableName ? `${loc}_${tableName}` : ''
  }

  useEffect(() => {
    if (!directory) return
    list_env_files(directory).then(files => {
      setEnvFiles(files)
      setSourceEnv(files[0]?.file ?? '')
      setTargetEnv(files[1]?.file ?? '')
      setFetchResult(null)
      setSnapshotResult(null)
      setMessage('')
    })
  }, [directory])

  async function handleFetch() {
    if (!sourceEnv || !selectSql.trim()) return
    setRunning(true)
    setFetchResult(null)
    setSnapshotResult(null)
    setMessage('Running SELECT...')
    try {
      const r = await fetchRows(fullPath(sourceEnv), selectSql)
      setFetchResult(r)
      const detected = extractTableName(selectSql)
      if (detected) setTableName(detected)
      setMessage(`${r.rowCount} row${r.rowCount !== 1 ? 's' : ''} fetched`)
    } catch (error) {
      setMessage(`Error: ${(error as Error).message}`)
    } finally {
      setRunning(false)
    }
  }

  async function handleCreateSnapshot() {
    if (!sourceEnv || !targetEnv || !tableName.trim() || !selectSql.trim()) return
    setRunning(true)
    setSnapshotResult(null)
    const preview = snapshotPreview()
    setMessage(`Creating ${preview} in ${locationFor(targetEnv) || targetEnv}...`)
    try {
      const r = await createSnapshotTable(fullPath(sourceEnv), fullPath(targetEnv), tableName.trim(), selectSql)
      setSnapshotResult(r)
      setMessage(`Created ${r.snapshotName} with ${r.rowCount} row${r.rowCount !== 1 ? 's' : ''}`)
    } catch (error) {
      setMessage(`Error: ${(error as Error).message}`)
    } finally {
      setRunning(false)
    }
  }

  const sourceLocation = locationFor(sourceEnv)
  const targetLocation = locationFor(targetEnv)
  const preview = snapshotPreview()

  return (
    <div className='mt-4 py-2 px-4 bg-gray-50 rounded-lg shadow-md max-w-4xl space-y-4'>
      {/* Header */}
      <div className='flex items-center gap-2'>
        {title && <h2 className='text-sm font-bold'>{title}</h2>}
        <MyHelp items={HELP_ITEMS} title='Data Snapshot Help' label='Help' />
      </div>

      {/* Directory */}
      <div className='flex items-center gap-2'>
        <label className='text-xs w-20 text-right shrink-0'>Directory</label>
        <MyInput
          overrideClass='flex-1'
          type='text'
          value={directory}
          onChange={e => setDirectory(e.target.value)}
        />
        <MyHelp items={[{
          heading: 'Directory',
          body: 'Absolute path to the folder containing your .env.* files. Each file must have POSTGRES_URL and POSTGRES_DATABASE_LOCATION.',
        }]} />
      </div>

      {envFiles.length === 0 && directory && (
        <p className='text-xs text-red-700'>No .env.* files found in directory</p>
      )}

      {envFiles.length > 0 && (
        <>
          {/* ── EXTRACT ─────────────────────────────── */}
          <div className='border-t pt-3 space-y-2'>
            <p className='text-xs font-semibold text-blue-700 uppercase tracking-wide'>Extract</p>

            <div className='flex items-center gap-2'>
              <label className='text-xs w-20 text-right shrink-0'>Source</label>
              <MySelect
                value={sourceEnv}
                onChange={e => { setSourceEnv((e.target as HTMLSelectElement).value); setFetchResult(null); setSnapshotResult(null) }}
              >
                {envFiles.map(e => (
                  <option key={e.file} value={e.file}>
                    {e.file}{e.location ? ` (${e.location})` : ''}
                  </option>
                ))}
              </MySelect>
              {sourceLocation && (
                <span className='text-sm font-bold uppercase bg-blue-600 text-white px-3 py-1 rounded-md shadow'>
                  {sourceLocation}
                </span>
              )}
            </div>

            <div className='flex items-start gap-2'>
              <label className='text-xs w-20 text-right shrink-0 mt-1'>SELECT</label>
              <MyTextarea
                overrideClass='flex-1 h-20 font-mono text-xs'
                value={selectSql}
                onChange={e => setSelectSql(e.target.value)}
                placeholder={'SELECT * FROM users WHERE active = true'}
              />
              <MyHelp items={[{
                heading: 'SELECT query',
                body: 'Any valid SQL SELECT. The same query is used both for the preview and when creating the snapshot table.',
              }]} />
            </div>

            <div className='ml-24'>
              <MyButton
                onClick={handleFetch}
                overrideClass='h-6 px-2 py-2'
                disabled={!sourceEnv || !selectSql.trim() || running}
              >
                Preview
              </MyButton>
            </div>
          </div>

          {/* Preview table */}
          {fetchResult && (
            <div className='space-y-1'>
              <p className='text-xs font-semibold'>
                {fetchResult.rowCount} row{fetchResult.rowCount !== 1 ? 's' : ''} — columns:&nbsp;
                <span className='font-mono font-normal text-gray-600'>{fetchResult.columns.join(', ')}</span>
              </p>
              {fetchResult.rows.length > 0 && (
                <div className='max-h-48 overflow-auto border rounded bg-white'>
                  <table className='min-w-full text-xs'>
                    <thead className='bg-gray-50 sticky top-0'>
                      <tr>
                        {fetchResult.columns.map(c => (
                          <th key={c} className='px-2 py-1 text-left text-gray-500 font-medium border-b font-mono'>{c}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {fetchResult.rows.slice(0, PREVIEW_LIMIT).map((row, i) => (
                        <tr key={i} className='border-b border-gray-100'>
                          {row.map((cell, j) => (
                            <td key={j} className='px-2 py-1 font-mono truncate max-w-[160px]'>
                              {cell == null
                                ? <span className='text-gray-400 italic'>NULL</span>
                                : String(cell)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {fetchResult.rows.length > PREVIEW_LIMIT && (
                    <p className='text-xs text-gray-400 px-2 py-1 border-t'>
                      … and {fetchResult.rows.length - PREVIEW_LIMIT} more rows (all will be snapshotted)
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── SNAPSHOT ──────────────────────────────── */}
          {fetchResult && (
            <div className='border-t pt-3 space-y-2'>
              <p className='text-xs font-semibold text-green-700 uppercase tracking-wide'>Snapshot</p>

              <div className='flex items-center gap-2'>
                <label className='text-xs w-20 text-right shrink-0'>Target</label>
                <MySelect value={targetEnv} onChange={e => setTargetEnv((e.target as HTMLSelectElement).value)}>
                  {envFiles.map(e => (
                    <option key={e.file} value={e.file}>
                      {e.file}{e.location ? ` (${e.location})` : ''}
                    </option>
                  ))}
                </MySelect>
                {targetLocation && (
                  <span className='text-sm font-bold uppercase bg-red-600 text-white px-3 py-1 rounded-md shadow'>
                    {targetLocation}
                  </span>
                )}
              </div>

              <div className='flex items-center gap-2'>
                <label className='text-xs w-20 text-right shrink-0'>Table</label>
                <MyInput
                  overrideClass='w-48 font-mono'
                  type='text'
                  value={tableName}
                  onChange={e => setTableName(e.target.value)}
                  placeholder='users'
                />
                <MyHelp items={[{
                  heading: 'Source table name',
                  body: 'Used to look up column types from the source schema, and as the base of the snapshot name. Auto-detected from the SELECT query.',
                }]} />
              </div>

              {preview && (
                <div className='flex items-center gap-2 ml-24'>
                  <span className='text-xs text-gray-500'>Will create:</span>
                  <span className='font-mono text-xs font-semibold text-green-800 bg-green-50 border border-green-200 px-2 py-0.5 rounded'>
                    {preview}
                  </span>
                  <span className='text-xs text-gray-500'>in {targetLocation || targetEnv}</span>
                </div>
              )}

              <div className='ml-24'>
                <MyButton
                  onClick={handleCreateSnapshot}
                  overrideClass='h-6 px-2 py-2 bg-green-600 hover:bg-green-700'
                  disabled={!sourceEnv || !targetEnv || !tableName.trim() || running}
                >
                  Create Snapshot
                </MyButton>
              </div>

              {snapshotResult && (
                <div className='ml-24'>
                  <p className='text-xs font-semibold text-green-700'>
                    ✓ Created <span className='font-mono'>{snapshotResult.snapshotName}</span> with {snapshotResult.rowCount} row{snapshotResult.rowCount !== 1 ? 's' : ''}
                  </p>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {message && (
        <p className={`text-xs ${message.startsWith('Error') ? 'text-red-700' : 'text-gray-600'}`}>
          {message}
        </p>
      )}
    </div>
  )
}
