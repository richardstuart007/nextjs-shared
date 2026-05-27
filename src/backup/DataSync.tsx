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
import { fetchRows, applyRows } from './dataTransfer'
import type { FetchResult, TransferApplyResult } from './dataTransfer'

const HELP_ITEMS: HelpItem[] = [
  {
    heading: 'Extract',
    body: 'Write a SELECT against the source database. Results are loaded into memory and shown as a preview.',
  },
  {
    heading: 'Load',
    body: 'Write an INSERT or UPDATE against the target database. Use $1, $2, ... to reference columns from the SELECT in order. Each row is applied individually — failures are reported per row without stopping the run.',
  },
  {
    heading: 'Column mapping',
    body: 'Columns map positionally: $1 = first column in SELECT, $2 = second, etc. Use an explicit column list (SELECT id, name, ...) rather than SELECT * to control the order.',
  },
  {
    heading: 'ON CONFLICT',
    body: 'Add ON CONFLICT (pk_column) DO UPDATE SET col = EXCLUDED.col to upsert, or ON CONFLICT DO NOTHING to skip duplicates. Without it, duplicate primary keys will error.',
  },
]

const PREVIEW_LIMIT = 20

function buildInsertSql(columns: string[], selectSql: string): string {
  const tableMatch = selectSql.match(/FROM\s+(?:public\.)?"?(\w+)"?/i)
  const tableName = tableMatch ? tableMatch[1] : 'table_name'
  const cols = columns.map(c => `"${c}"`).join(', ')
  const vals = columns.map((_, i) => `$${i + 1}`).join(', ')
  return `INSERT INTO "${tableName}" (${cols})\nVALUES (${vals})\nON CONFLICT DO NOTHING;`
}

export default function DataSync({
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
  const [fetchResult, setFetchResult]     = useState<FetchResult | null>(null)
  const [insertSql, setInsertSql]         = useState('')
  const [applyResult, setApplyResult]     = useState<TransferApplyResult | null>(null)
  const [message, setMessage]             = useState('')
  const [running, setRunning]             = useState(false)

  function fullPath(filename: string) {
    return directory ? `${directory}/${filename}` : filename
  }

  function locationFor(file: string) {
    return envFiles.find(e => e.file === file)?.location ?? ''
  }

  useEffect(() => {
    if (!directory) return
    list_env_files(directory).then(files => {
      setEnvFiles(files)
      setSourceEnv(files[0]?.file ?? '')
      setTargetEnv(files[1]?.file ?? '')
      setFetchResult(null)
      setApplyResult(null)
      setMessage('')
    })
  }, [directory])

  async function handleFetch() {
    if (!sourceEnv || !selectSql.trim()) return
    setRunning(true)
    setFetchResult(null)
    setApplyResult(null)
    setMessage('Running SELECT...')
    try {
      const r = await fetchRows(fullPath(sourceEnv), selectSql)
      setFetchResult(r)
      setInsertSql(buildInsertSql(r.columns, selectSql))
      setMessage(`${r.rowCount} row${r.rowCount !== 1 ? 's' : ''} fetched`)
    } catch (error) {
      setMessage(`Error: ${(error as Error).message}`)
    } finally {
      setRunning(false)
    }
  }

  async function handleApply() {
    if (!targetEnv || !insertSql.trim() || !fetchResult) return
    setRunning(true)
    setApplyResult(null)
    const targetLabel = locationFor(targetEnv) || targetEnv
    setMessage(`Applying ${fetchResult.rowCount} rows to ${targetLabel}...`)
    try {
      const r = await applyRows(fullPath(targetEnv), insertSql, fetchResult.rows)
      setApplyResult(r)
      setMessage(r.errors.length === 0
        ? `${r.ok} row${r.ok !== 1 ? 's' : ''} applied successfully`
        : `${r.ok} ok, ${r.errors.length} failed`)
    } catch (error) {
      setMessage(`Error: ${(error as Error).message}`)
    } finally {
      setRunning(false)
    }
  }

  const sourceLocation = locationFor(sourceEnv)
  const targetLocation = locationFor(targetEnv)

  return (
    <div className='mt-4 py-2 px-4 bg-gray-50 rounded-lg shadow-md max-w-4xl space-y-4'>
      {/* Header */}
      <div className='flex items-center gap-2'>
        {title && <h2 className='text-sm font-bold'>{title}</h2>}
        <MyHelp items={HELP_ITEMS} title='Data Sync Help' label='Help' />
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
              <MySelect value={sourceEnv} onChange={e => setSourceEnv((e.target as HTMLSelectElement).value)}>
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
                placeholder={'SELECT id, name, email FROM users WHERE active = true'}
              />
              <MyHelp items={[{
                heading: 'SELECT query',
                body: 'Standard SQL SELECT against the source database. List columns explicitly (not SELECT *) so the $1/$2/... order in the INSERT is predictable.',
              }]} />
            </div>

            <div className='ml-24'>
              <MyButton
                onClick={handleFetch}
                overrideClass='h-6 px-2 py-2'
                disabled={!sourceEnv || !selectSql.trim() || running}
              >
                Run SELECT
              </MyButton>
            </div>
          </div>

          {/* Results preview */}
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
                      … and {fetchResult.rows.length - PREVIEW_LIMIT} more rows (all will be applied)
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── LOAD ──────────────────────────────────── */}
          {fetchResult && (
            <div className='border-t pt-3 space-y-2'>
              <p className='text-xs font-semibold text-red-700 uppercase tracking-wide'>Load</p>

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
                  <span className='text-sm font-bold uppercase bg-red-600 text-white px-3 py-1 rounded-md shadow animate-pulse'>
                    {targetLocation}
                  </span>
                )}
                <MyHelp items={[{
                  heading: 'Target database',
                  body: 'The INSERT/UPDATE below is executed once per row from the SELECT result. Rows that fail are reported individually — the rest still apply.',
                }]} />
              </div>

              <div className='flex items-start gap-2'>
                <label className='text-xs w-20 text-right shrink-0 mt-1'>INSERT</label>
                <MyTextarea
                  overrideClass='flex-1 h-28 font-mono text-xs'
                  value={insertSql}
                  onChange={e => setInsertSql(e.target.value)}
                />
                <MyHelp items={[{
                  heading: 'INSERT / UPDATE SQL',
                  body: 'Use $1, $2, ... to reference the SELECT columns in order. Add ON CONFLICT (pk) DO UPDATE SET col = EXCLUDED.col to upsert, or ON CONFLICT DO NOTHING to skip duplicates.',
                }]} />
              </div>

              <div className='flex items-center gap-3 ml-24'>
                <MyButton
                  onClick={handleApply}
                  overrideClass='h-6 px-2 py-2 bg-red-500 hover:bg-red-600'
                  disabled={!targetEnv || !insertSql.trim() || running}
                >
                  Apply {fetchResult.rowCount} rows to {targetLocation || 'target'}
                </MyButton>
              </div>
            </div>
          )}

          {/* Apply errors */}
          {applyResult && applyResult.errors.length > 0 && (
            <div className='space-y-1'>
              <p className='text-xs font-semibold text-red-700'>
                {applyResult.ok} applied, {applyResult.errors.length} failed:
              </p>
              <div className='max-h-40 overflow-y-auto border rounded bg-white'>
                <table className='min-w-full text-xs'>
                  <thead className='bg-red-50 sticky top-0'>
                    <tr>
                      <th className='px-2 py-1 text-left border-b text-red-700'>Row</th>
                      <th className='px-2 py-1 text-left border-b text-red-700'>Error</th>
                    </tr>
                  </thead>
                  <tbody>
                    {applyResult.errors.map((e, i) => (
                      <tr key={i} className='border-b border-gray-100 text-red-600'>
                        <td className='px-2 py-1'>{e.row}</td>
                        <td className='px-2 py-1'>{e.error}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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
