'use client'

import { useState, useEffect } from 'react'
import { MyButton } from '../components/MyButton'
import { MyInput } from '../components/MyInput'
import MySelect from '../components/MySelect'
import { MyTextarea } from '../components/MyTextarea'
import { list_env_files } from './copyTables'
import type { EnvFile } from './copyTables'
import { compareSchemas, applySQL, generateCreateSQL, fetchTableCounts } from './schemaSync'
import { generateAlterSQL } from './schemaUtils'
import type { SchemaCompareResult, ChangeRow, DiffRow, TableSummary, TableDDL } from './schemaSync'
import { MyHelp } from '../components/MyHelp'
import type { HelpItem } from '../components/MyHelp'

const HELP_ITEMS: HelpItem[] = [
  {
    heading: 'Compare Schemas',
    body: 'Select a source and target .env file then click Compare. Source is the reference; target will be updated to match.',
  },
  {
    heading: 'Generated SQL',
    body: 'ALTER TABLE / CREATE TABLE statements that will bring the target in line with the source. Review and edit before applying.',
  },
  {
    heading: 'Apply SQL',
    body: 'Executes the SQL against the target database. This is irreversible — each statement is run independently and errors are reported per-statement.',
  },
  {
    heading: 'Create SQL (Generate from source)',
    body: 'Runs pg_dump --schema-only against the source database and shows full CREATE TABLE + index DDL per table. Use this to recreate an empty environment from scratch.',
  },
]

export default function SchemaSync({
  baseDir = '',
  caller: _caller = 'SchemaSync',
  title = '',
}: {
  baseDir?: string
  caller?: string
  title?: string
}) {
  const [directory, setDirectory]       = useState(baseDir)
  const [envFiles, setEnvFiles]         = useState<EnvFile[]>([])
  const [sourceEnv, setSourceEnv]       = useState('')
  const [targetEnv, setTargetEnv]       = useState('')
  const [result, setResult]             = useState<SchemaCompareResult | null>(null)
  const [sql, setSql]                   = useState('')
  const [applyResult, setApplyResult]   = useState<{ ok: number; errors: Array<{ sql: string; error: string }> } | null>(null)
  const [excludePrefix, setExcludePrefix] = useState('bk_,local_,prod_,dev_')
  const [message, setMessage]           = useState('')
  const [running, setRunning]           = useState(false)
  const [counts, setCounts]             = useState<Record<string, number>>({})
  const [tableDDLs, setTableDDLs]       = useState<TableDDL[]>([])
  const [selectedTable, setSelectedTable] = useState('')
  const [createMsg, setCreateMsg]       = useState('')

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
    setCounts({})
    setMessage('Comparing schemas...')
    try {
      const r = await compareSchemas(fullPath(sourceEnv), fullPath(targetEnv), excludePrefix)
      setResult(r)
      const lines = generateAlterSQL(r)
      setSql(lines.join('\n'))
      const diffCount = r.tableSummary.filter(t => t.status !== 'identical').length
      setMessage(diffCount === 0 ? 'Schemas are identical' : `Found differences in ${diffCount} table${diffCount !== 1 ? 's' : ''}`)
      const allTables = r.tableSummary.map(t => t.table_name)
      const c = await fetchTableCounts(allTables)
      setCounts(c)
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
      const r = await applySQL(fullPath(targetEnv), sql)
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

  async function handleGenerateCreateSQL() {
    if (!sourceEnv) return
    setRunning(true)
    setTableDDLs([])
    setSelectedTable('')
    setCreateMsg('Generating CREATE SQL from source...')
    try {
      const ddls = await generateCreateSQL(fullPath(sourceEnv))
      setTableDDLs(ddls)
      setSelectedTable(ddls[0]?.table_name ?? '')
      setCreateMsg('')
    } catch (error) {
      setCreateMsg(`Error: ${(error as Error).message}`)
    } finally {
      setRunning(false)
    }
  }

  const sourceLabel = envFiles.find(e => e.file === sourceEnv)?.location ?? ''
  const targetLabel = envFiles.find(e => e.file === targetEnv)?.location ?? ''
  const sameEnv = sourceLabel && targetLabel && sourceLabel === targetLabel
  const hasDiffs = result && (result.onlyIn1.length + result.onlyIn2.length + result.changed.length) > 0

  return (
    <div className='mt-4 py-2 px-4 bg-gray-50 rounded-lg shadow-md max-w-4xl space-y-4'>
      <div className='flex items-center gap-2'>
        {title && <h2 className='text-sm font-bold'>{title}</h2>}
        <MyHelp items={HELP_ITEMS} title='Schema Sync Help' label='Help' />
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
          body: 'Absolute path to the folder that contains your .env.* files (one per database). Each file must have POSTGRES_URL and POSTGRES_DATABASE_LOCATION.',
        }]} />
      </div>

      {envFiles.length > 0 && (
        <>
          {/* Source */}
          <div className='flex items-center gap-2'>
            <label className='text-xs w-20 text-right shrink-0'>Source</label>
            <MySelect value={sourceEnv} onChange={e => setSourceEnv((e.target as HTMLSelectElement).value)}>
              {envFiles.map(e => (
                <option key={e.file} value={e.file}>
                  {e.file}{e.location ? ` (${e.location})` : ''}
                </option>
              ))}
            </MySelect>
            {sourceLabel && (
              <span className='text-sm font-bold uppercase bg-blue-600 text-white px-3 py-1 rounded-md shadow'>
                {sourceLabel}
              </span>
            )}
            <MyHelp items={[{
              heading: 'Source',
              body: 'The reference database. SQL is generated to make the target match this schema.',
            }]} />
          </div>

          {/* Target */}
          <div className='flex items-center gap-2'>
            <label className='text-xs w-20 text-right shrink-0'>Target</label>
            <MySelect value={targetEnv} onChange={e => setTargetEnv((e.target as HTMLSelectElement).value)}>
              {envFiles.map(e => (
                <option key={e.file} value={e.file}>
                  {e.file}{e.location ? ` (${e.location})` : ''}
                </option>
              ))}
            </MySelect>
            {targetLabel && (
              <span className='text-sm font-bold uppercase bg-red-600 text-white px-3 py-1 rounded-md shadow animate-pulse'>
                {targetLabel}
              </span>
            )}
            <MyHelp items={[{
              heading: 'Target',
              body: 'The database to be modified. Generated SQL is applied here — review carefully before applying.',
            }]} />
          </div>

          {/* Exclude prefixes */}
          <div className='flex items-center gap-2'>
            <label className='text-xs w-20 text-right shrink-0'>Exclude</label>
            <MyInput
              overrideClass='w-40'
              type='text'
              value={excludePrefix}
              onChange={e => setExcludePrefix(e.target.value)}
            />
            <MyHelp items={[{
              heading: 'Exclude tables',
              body: 'Comma-separated prefixes — tables whose names start with any of these are ignored entirely. Default covers backup copies (bk_) and snapshot/work tables (local_, prod_, dev_).',
            }]} />
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
      {result && <TableSummarySection rows={result.tableSummary} label1={result.label1} label2={result.label2} counts={counts} />}

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
          <MyTextarea
            overrideClass='w-full h-48 font-mono bg-white px-2 py-2'
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

      {/* CREATE TABLE + indexes SQL — master/detail */}
      <div className='border-t pt-3 space-y-2'>
        <div className='flex items-center gap-3'>
          <p className='text-xs font-semibold'>Create SQL</p>
          <MyButton
            onClick={handleGenerateCreateSQL}
            overrideClass='h-6 px-2 py-2'
            disabled={!sourceEnv || running}
          >
            Generate from {sourceLabel || 'source'}
          </MyButton>
          <span className='text-xs text-gray-400'>CREATE TABLE + indexes — use to recreate an environment</span>
        </div>
        {createMsg && <p className='text-xs text-red-700'>{createMsg}</p>}
        {tableDDLs.length > 0 && (
          <div className='flex gap-2 border rounded bg-white overflow-hidden' style={{ height: '24rem' }}>
            {/* Left — table list */}
            <div className='w-48 shrink-0 border-r overflow-y-auto'>
              {tableDDLs.map(t => (
                <button
                  key={t.table_name}
                  onClick={() => setSelectedTable(t.table_name)}
                  className={`w-full text-left px-2 py-1 text-xs font-mono truncate border-b border-gray-100 hover:bg-blue-50 ${
                    selectedTable === t.table_name ? 'bg-blue-100 font-semibold text-blue-800' : 'text-gray-700'
                  }`}
                >
                  {t.table_name}
                </button>
              ))}
            </div>
            {/* Right — SQL for selected table */}
            <div className='flex-1 overflow-auto p-2'>
              {selectedTable && (
                <pre className='text-xs font-mono whitespace-pre-wrap text-gray-800'>
                  {tableDDLs.find(t => t.table_name === selectedTable)?.sql ?? ''}
                </pre>
              )}
            </div>
          </div>
        )}
      </div>
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
  counts,
}: {
  rows: TableSummary[]
  label1: string
  label2: string
  counts: Record<string, number>
}) {
  if (rows.length === 0) return null
  const statusCounts = rows.reduce<Record<string, number>>((acc, r) => {
    acc[r.status] = (acc[r.status] ?? 0) + 1
    return acc
  }, {})
  return (
    <div className='space-y-2'>
      <div className='flex items-center gap-3'>
        <p className='text-xs font-semibold'>Table Summary ({rows.length} tables)</p>
        <span className='text-xs text-green-700'>{statusCounts.identical ?? 0} identical</span>
        {(statusCounts.different ?? 0) > 0 && <span className='text-xs text-yellow-700'>{statusCounts.different} different</span>}
        {(statusCounts.only_in_source ?? 0) > 0 && <span className='text-xs text-blue-700'>{statusCounts.only_in_source} only in {label1}</span>}
        {(statusCounts.only_in_target ?? 0) > 0 && <span className='text-xs text-orange-700'>{statusCounts.only_in_target} only in {label2}</span>}
      </div>
      <div className='max-h-64 overflow-y-auto border rounded bg-white'>
        <table className='min-w-full text-xs'>
          <thead className='bg-gray-50 sticky top-0'>
            <tr>
              <th className='px-2 py-1 text-left text-gray-500 font-medium border-b'>Table</th>
              <th className='px-2 py-1 text-left text-gray-500 font-medium border-b'>Status</th>
              <th className='px-2 py-1 text-right text-gray-500 font-medium border-b'>Rows</th>
            </tr>
          </thead>
          <tbody>
        {rows.map(r => {
          const meta = statusMeta(r.status, label1, label2)
          const rowCount = counts[r.table_name]
          return (
            <tr key={r.table_name} className='border-b border-gray-100'>
              <td className={`px-2 py-1 font-mono ${r.status !== 'identical' ? 'font-semibold' : 'text-gray-500'}`}>
                {r.table_name}
              </td>
              <td className='px-2 py-1'>
                <span className={`px-1 rounded ${meta.className}`}>{meta.label}</span>
              </td>
              <td className='px-2 py-1 text-right tabular-nums text-gray-600'>
                {rowCount != null ? rowCount.toLocaleString() : '—'}
              </td>
            </tr>
          )
        })}
          </tbody>
        </table>
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
