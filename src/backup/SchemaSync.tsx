'use client'

import { useState, useEffect } from 'react'
import { MyButton } from '../components/MyButton'
import { list_env_files } from './copyTables'
import type { EnvFile } from './copyTables'
import { compareSchemas, applySQL } from './schemaSync'
import { generateAlterSQL } from './schemaUtils'
import type { SchemaCompareResult, ChangeRow, DiffRow, TableSummary } from './schemaSync'

export default function SchemaSync({
  baseDir = '',
  caller = 'SchemaSync',
}: {
  baseDir?: string
  caller?: string
}) {
  const [directory, setDirectory]       = useState(baseDir)
  const [envFiles, setEnvFiles]         = useState<EnvFile[]>([])
  const [sourceEnv, setSourceEnv]       = useState('')
  const [targetEnv, setTargetEnv]       = useState('')
  const [result, setResult]             = useState<SchemaCompareResult | null>(null)
  const [sql, setSql]                   = useState('')
  const [applyResult, setApplyResult]   = useState<{ ok: number; errors: Array<{ sql: string; error: string }> } | null>(null)
  const [message, setMessage]           = useState('')
  const [running, setRunning]           = useState(false)

  function fullPath(filename: string) {
    return directory ? `${directory}/${filename}` : filename
  }

  useEffect(() => {
    if (!directory) return
    list_env_files(directory).then(files => {
      setEnvFiles(files)
      setSourceEnv(files[0]?.file ?? '')
      setTargetEnv(files[1]?.file ?? '')
      setResult(null)
      setSql('')
      setApplyResult(null)
      setMessage('')
    })
  }, [directory])

  async function handleCompare() {
    if (!sourceEnv || !targetEnv) return
    setRunning(true)
    setResult(null)
    setSql('')
    setApplyResult(null)
    setMessage('Comparing schemas...')
    try {
      const r = await compareSchemas(fullPath(sourceEnv), fullPath(targetEnv))
      setResult(r)
      const lines = generateAlterSQL(r)
      setSql(lines.join('\n'))
      const diffCount = r.tableSummary.filter(t => t.status !== 'identical').length
      setMessage(diffCount === 0 ? 'Schemas are identical' : `Found differences in ${diffCount} table${diffCount !== 1 ? 's' : ''}`)
    } catch (error) {
      setMessage(`Error: ${(error as Error).message}`)
    } finally {
      setRunning(false)
    }
  }

  async function handleApplySQL() {
    if (!sql.trim() || !targetEnv) return
    setRunning(true)
    setApplyResult(null)
    setMessage('Applying SQL to target...')
    try {
      const statements = sql.split('\n')
      const r = await applySQL(fullPath(targetEnv), statements)
      setApplyResult(r)
      setMessage(r.errors.length === 0
        ? `Applied ${r.ok} statement${r.ok !== 1 ? 's' : ''} successfully`
        : `Applied ${r.ok} ok, ${r.errors.length} failed`)
    } catch (error) {
      setMessage(`Error: ${(error as Error).message}`)
    } finally {
      setRunning(false)
    }
  }

  const sourceLabel = envFiles.find(e => e.file === sourceEnv)?.location ?? ''
  const targetLabel = envFiles.find(e => e.file === targetEnv)?.location ?? ''
  const sameEnv = sourceLabel && targetLabel && sourceLabel === targetLabel
  const hasDiffs = result && (result.onlyIn1.length + result.onlyIn2.length + result.changed.length) > 0

  const selectClass = 'py-1 px-2 w-72 text-sm border border-blue-500 rounded-md focus:outline-none'

  return (
    <div className='mt-4 py-2 px-4 bg-gray-50 rounded-lg shadow-md max-w-4xl space-y-4'>
      <h2 className='text-sm font-bold'>Schema Compare &amp; Sync</h2>

      {/* Directory */}
      <div className='flex items-center gap-2'>
        <label className='text-xs w-20 text-right shrink-0'>Directory</label>
        <input
          className='flex-1 text-xs border border-blue-500 rounded-md px-2 py-1 focus:outline-none'
          type='text'
          value={directory}
          onChange={e => setDirectory(e.target.value)}
        />
      </div>

      {envFiles.length > 0 && (
        <>
          {/* Source */}
          <div className='flex items-center gap-2'>
            <label className='text-xs w-20 text-right shrink-0'>Source</label>
            <select className={selectClass} value={sourceEnv} onChange={e => setSourceEnv(e.target.value)}>
              {envFiles.map(e => (
                <option key={e.file} value={e.file}>
                  {e.file}{e.location ? ` (${e.location})` : ''}
                </option>
              ))}
            </select>
            {sourceLabel && (
              <span className='text-sm font-bold uppercase bg-blue-600 text-white px-3 py-1 rounded-md shadow'>
                {sourceLabel}
              </span>
            )}
          </div>

          {/* Target */}
          <div className='flex items-center gap-2'>
            <label className='text-xs w-20 text-right shrink-0'>Target</label>
            <select className={selectClass} value={targetEnv} onChange={e => setTargetEnv(e.target.value)}>
              {envFiles.map(e => (
                <option key={e.file} value={e.file}>
                  {e.file}{e.location ? ` (${e.location})` : ''}
                </option>
              ))}
            </select>
            {targetLabel && (
              <span className='text-sm font-bold uppercase bg-red-600 text-white px-3 py-1 rounded-md shadow animate-pulse'>
                {targetLabel}
              </span>
            )}
          </div>

          {sameEnv ? (
            <p className='text-xs font-bold text-red-700 ml-24'>&#9888; Source and target are the same environment</p>
          ) : (
            <div className='ml-24'>
              <MyButton onClick={handleCompare} overrideClass='h-6 px-2 py-2' disabled={!sourceEnv || !targetEnv || running}>
                Compare Schemas
              </MyButton>
            </div>
          )}
        </>
      )}

      {message && <p className='text-xs text-red-700'>{message}</p>}

      {/* Table summary */}
      {result && <TableSummarySection rows={result.tableSummary} label1={result.label1} label2={result.label2} />}

      {/* Diff details */}
      {result && hasDiffs && (
        <div className='space-y-3'>
          <DiffSection
            title={`Only in ${result.label1}`}
            rows={result.onlyIn1}
            tableSummary={result.tableSummary}
            className='text-green-700'
          />
          <DiffSection
            title={`Only in ${result.label2} — not in source (review before dropping)`}
            rows={result.onlyIn2}
            tableSummary={result.tableSummary}
            className='text-orange-600'
          />
          {result.changed.length > 0 && <ChangedSection rows={result.changed} />}
        </div>
      )}

      {/* Generated SQL */}
      {hasDiffs && (
        <div className='space-y-2'>
          <p className='text-xs font-semibold'>Generated SQL (review and edit before applying)</p>
          <textarea
            className='w-full h-48 text-xs font-mono border border-gray-300 rounded p-2 bg-white focus:outline-none focus:border-blue-500'
            value={sql}
            onChange={e => setSql(e.target.value)}
          />
          <div className='flex items-center gap-3'>
            <MyButton
              onClick={handleApplySQL}
              overrideClass='h-6 px-2 py-2 bg-red-500 hover:bg-red-600'
              disabled={!sql.trim() || running}
            >
              Apply SQL to {targetLabel || 'target'}
            </MyButton>
            <span className='text-xs text-gray-500'>Applies to {targetLabel} database</span>
          </div>
        </div>
      )}

      {/* Apply result */}
      {applyResult && applyResult.errors.length > 0 && (
        <div className='space-y-1'>
          <p className='text-xs font-semibold text-red-700'>Failed statements:</p>
          {applyResult.errors.map((e, i) => (
            <div key={i} className='text-xs bg-red-50 border border-red-200 rounded p-2'>
              <code className='block font-mono'>{e.sql}</code>
              <span className='text-red-600'>{e.error}</span>
            </div>
          ))}
        </div>
      )}

      {/* Copy reminder for affected tables */}
      {hasDiffs && (
        <div className='border-t pt-3'>
          <p className='text-xs text-gray-500'>After applying SQL, use CopyTable to copy data for the affected tables.</p>
        </div>
      )}
    </div>
  )
}

function statusMeta(status: string, label1: string, label2: string) {
  switch (status) {
    case 'identical':      return { label: '✓ Identical',           className: 'bg-green-100 text-green-800' }
    case 'different':      return { label: '! Different',            className: 'bg-yellow-100 text-yellow-800' }
    case 'only_in_source': return { label: `+ ${label1} only`,      className: 'bg-blue-100 text-blue-800' }
    case 'only_in_target': return { label: `− ${label2} only`,      className: 'bg-orange-100 text-orange-800' }
    default:               return { label: status,                   className: 'bg-gray-100 text-gray-800' }
  }
}

function TableSummarySection({
  rows,
  label1,
  label2,
}: {
  rows: TableSummary[]
  label1: string
  label2: string
}) {
  if (rows.length === 0) return null
  const counts = rows.reduce<Record<string, number>>((acc, r) => {
    acc[r.status] = (acc[r.status] ?? 0) + 1
    return acc
  }, {})
  return (
    <div className='space-y-2'>
      <div className='flex items-center gap-3'>
        <p className='text-xs font-semibold'>Table Summary ({rows.length} tables)</p>
        <span className='text-xs text-green-700'>{counts.identical ?? 0} identical</span>
        {(counts.different ?? 0) > 0 && <span className='text-xs text-yellow-700'>{counts.different} different</span>}
        {(counts.only_in_source ?? 0) > 0 && <span className='text-xs text-blue-700'>{counts.only_in_source} only in {label1}</span>}
        {(counts.only_in_target ?? 0) > 0 && <span className='text-xs text-orange-700'>{counts.only_in_target} only in {label2}</span>}
      </div>
      <div className='grid grid-cols-3 gap-1 max-h-48 overflow-y-auto border rounded bg-white p-2'>
        {rows.map(r => {
          const meta = statusMeta(r.status, label1, label2)
          return (
            <div key={r.table_name} className='flex items-center gap-1'>
              <span className={`text-xs font-mono flex-1 truncate ${r.status !== 'identical' ? 'font-semibold' : 'text-gray-500'}`}>
                {r.table_name}
              </span>
              <span className={`text-xs px-1 rounded shrink-0 ${meta.className}`}>{meta.label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function DiffSection({
  title,
  rows,
  tableSummary,
  className,
}: {
  title: string
  rows: DiffRow[]
  tableSummary: TableSummary[]
  className: string
}) {
  if (rows.length === 0) return null
  const missingTables = new Set(
    tableSummary.filter(t => t.status === 'only_in_source' || t.status === 'only_in_target').map(t => t.table_name)
  )
  const byTable = groupByTable(rows)
  const tableCount = Object.keys(byTable).length
  return (
    <div>
      <p className={`text-xs font-semibold mb-1 ${className}`}>{title} ({tableCount} table{tableCount !== 1 ? 's' : ''})</p>
      {Object.entries(byTable).map(([table, cols]) => (
        <div key={table} className='mb-2'>
          {missingTables.has(table) ? (
            <p className='text-xs font-mono font-bold text-gray-700'>
              {table} <span className='font-normal text-gray-500'>— entire table missing ({cols.length} columns) — SQL will CREATE TABLE</span>
            </p>
          ) : (
            <>
              <p className='text-xs font-mono font-bold text-gray-700'>{table}</p>
              <table className='w-full text-xs border border-gray-200 rounded bg-white'>
                <thead className='bg-gray-50'>
                  <tr>
                    {['Column', 'Type', 'Nullable', 'Default', 'PK', 'Unique', 'Index'].map(h => (
                      <th key={h} className='px-2 py-1 text-left text-gray-500 font-medium border-b'>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {cols.map((r, i) => (
                    <tr key={i} className='border-b border-gray-100'>
                      <td className='px-2 py-1 font-mono'>{r.column_name}</td>
                      <td className='px-2 py-1'>{r.data_type}{r.max_len ? `(${r.max_len})` : ''}</td>
                      <td className='px-2 py-1'>{r.is_nullable === 'YES' ? '✓' : ''}</td>
                      <td className='px-2 py-1 text-gray-400 truncate max-w-[120px]'>{r.column_default ?? ''}</td>
                      <td className='px-2 py-1'>{r.is_pk ? '✓' : ''}</td>
                      <td className='px-2 py-1'>{r.is_unique ? '✓' : ''}</td>
                      <td className='px-2 py-1'>{r.has_index ? '✓' : ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      ))}
    </div>
  )
}

function ChangedSection({ rows }: { rows: ChangeRow[] }) {
  return (
    <div>
      <p className='text-xs font-semibold mb-1 text-purple-700'>Changed columns ({rows.length})</p>
      <table className='w-full text-xs border border-gray-200 rounded bg-white'>
        <thead className='bg-gray-50'>
          <tr>
            {['Table', 'Column', 'Attribute', 'Source', 'Target'].map(h => (
              <th key={h} className='px-2 py-1 text-left text-gray-500 font-medium border-b'>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.flatMap((c, i) => {
            const changes: Array<{ attr: string; src: string; tgt: string }> = []
            if (c.source.data_type !== c.target.data_type || c.source.max_len !== c.target.max_len) {
              const srcType = `${c.source.data_type}${c.source.max_len ? `(${c.source.max_len})` : ''}`
              const tgtType = `${c.target.data_type}${c.target.max_len ? `(${c.target.max_len})` : ''}`
              changes.push({ attr: 'type', src: srcType, tgt: tgtType })
            }
            if (c.source.is_nullable !== c.target.is_nullable)
              changes.push({ attr: 'nullable', src: c.source.is_nullable, tgt: c.target.is_nullable })
            if (c.source.column_default !== c.target.column_default)
              changes.push({ attr: 'default', src: c.source.column_default ?? '', tgt: c.target.column_default ?? '' })
            return changes.map((ch, j) => (
              <tr key={`${i}-${j}`} className='border-b border-gray-100'>
                <td className='px-2 py-1 font-mono'>{j === 0 ? c.table_name : ''}</td>
                <td className='px-2 py-1 font-mono'>{j === 0 ? c.column_name : ''}</td>
                <td className='px-2 py-1 text-purple-600'>{ch.attr}</td>
                <td className='px-2 py-1 text-blue-700'>{ch.src}</td>
                <td className='px-2 py-1 text-red-600'>{ch.tgt}</td>
              </tr>
            ))
          })}
        </tbody>
      </table>
    </div>
  )
}

function groupByTable<T extends { table_name: string }>(rows: T[]): Record<string, T[]> {
  const out: Record<string, T[]> = {}
  for (const r of rows) {
    ;(out[r.table_name] ??= []).push(r)
  }
  return out
}
