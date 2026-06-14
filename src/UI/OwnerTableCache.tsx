'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  cacheAction_getEntries,
  cacheAction_clearAll,
  cacheAction_deleteEntry,
  cacheAction_getEntryData
} from '../tables/cache/cache_actions'
import type { CacheEntryInfo } from '../tables/cache/userCache_store'
import { MyInput } from '../components/MyInput'
import { MyButton } from '../components/MyButton'
import MyPopup from '../components/MyPopup'

type PopupState = { entry: CacheEntryInfo; data: any } | null

export default function OwnerTableCache() {
  const functionName = 'OwnerTableCache'
  const [entries, setEntries] = useState<CacheEntryInfo[]>([])
  const [keyFilter, setKeyFilter] = useState('')
  const [tableFilter, setTableFilter] = useState('')
  const [callerFilter, setCallerFilter] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [popup, setPopup] = useState<PopupState>(null)

  useEffect(() => {
    fetchdata()
  }, [])

  async function fetchdata() {
    setLoading(true)
    try {
      const data = await cacheAction_getEntries()
      setEntries(data)
    } catch (error) {
      console.error('Error fetching cache entries:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleClearAll() {
    setMessage('Clearing all...')
    try {
      await cacheAction_clearAll(functionName)
      await fetchdata()
    } catch (error) {
      console.error('Error clearing cache:', error)
    } finally {
      setMessage('')
    }
  }

  async function handleDelete(sql: string) {
    try {
      await cacheAction_deleteEntry(sql, functionName)
      await fetchdata()
    } catch (error) {
      console.error('Error deleting entry:', error)
    }
  }

  async function handleRowClick(entry: CacheEntryInfo) {
    const data = await cacheAction_getEntryData(entry.sql)
    setPopup({ entry, data })
  }

  const filteredEntries = useMemo(() => {
    return entries.filter(entry => {
      const matchKey = keyFilter === '' || entry.sql.toLowerCase().includes(keyFilter.toLowerCase())
      const matchTable =
        tableFilter === '' ||
        entry.tables.some(t => t.toLowerCase().includes(tableFilter.toLowerCase()))
      const matchCaller =
        callerFilter === '' || entry.caller.toLowerCase().includes(callerFilter.toLowerCase())
      return matchKey && matchTable && matchCaller
    })
  }, [entries, keyFilter, tableFilter, callerFilter])

  return (
    <>
      <div className='flex items-center gap-2 mb-2'>
        <span className='text-xs font-medium text-gray-600'>
          {filteredEntries.length} / {entries.length} entries
        </span>
        <MyButton onClick={fetchdata} disabled={loading}>
          Refresh
        </MyButton>
        <MyButton
          overrideClass='bg-red-500 hover:bg-red-600'
          onClick={handleClearAll}
          disabled={loading || entries.length === 0}
        >
          Clear All
        </MyButton>
      </div>
      <div>
        <div>
          <table className='min-w-full text-gray-900 table-auto'>
            <thead className='sticky top-0 z-10 bg-gray-50 text-left font-normal text-xxs'>
              <tr>
                <th scope='col' className='font-medium px-2'>#</th>
                <th scope='col' className='font-medium px-2'>Tables</th>
                <th scope='col' className='font-medium px-2'>Caller</th>
                <th scope='col' className='font-medium px-2 text-center'>Rows</th>
                <th scope='col' className='font-medium px-2 text-center'>Hits</th>
                <th scope='col' className='font-medium px-2'>Key (SQL)</th>
                <th scope='col' className='font-medium px-2'></th>
              </tr>
              <tr className='text-xxs align-bottom'>
                <th scope='col' className='px-2'></th>
                <th scope='col' className='px-2'>
                  <MyInput
                    id='tableFilter'
                    name='tableFilter'
                    overrideClass='w-24 font-normal text-xxs'
                    type='text'
                    value={tableFilter}
                    onChange={e => setTableFilter(e.target.value)}
                    placeholder='filter...'
                  />
                </th>
                <th scope='col' className='px-2'>
                  <MyInput
                    id='callerFilter'
                    name='callerFilter'
                    overrideClass='w-28 font-normal text-xxs'
                    type='text'
                    value={callerFilter}
                    onChange={e => setCallerFilter(e.target.value)}
                    placeholder='filter...'
                  />
                </th>
                <th scope='col' className='px-2'></th>
                <th scope='col' className='px-2'></th>
                <th scope='col' className='px-2'>
                  <MyInput
                    id='keyFilter'
                    name='keyFilter'
                    overrideClass='w-[400px] font-normal text-xxs'
                    type='text'
                    value={keyFilter}
                    onChange={e => setKeyFilter(e.target.value)}
                    placeholder='filter by key...'
                  />
                </th>
                <th scope='col' className='px-2'></th>
              </tr>
            </thead>
            <tbody className='bg-white text-xxs'>
              {filteredEntries.length > 0 ? (
                filteredEntries.map((entry, idx) => (
                  <tr
                    key={entry.sql}
                    className='w-full border-b border-gray-100 cursor-pointer hover:bg-blue-50'
                    onClick={() => handleRowClick(entry)}
                  >
                    <td className='px-2'>{idx + 1}</td>
                    <td className='px-2'>
                      <TablesBadge tables={entry.tables} />
                    </td>
                    <td className='px-2'>{entry.caller}</td>
                    <td className='px-2 text-center'>
                      {entry.rowCount >= 0 ? entry.rowCount : entry.info}
                    </td>
                    <td className='px-2 text-center'>{entry.hitCount}</td>
                    <td className='px-2 font-mono'>
                      {entry.sql}
                    </td>
                    <td className='px-2' onClick={e => e.stopPropagation()}>
                      <MyButton
                        overrideClass='h-5 px-1 text-xxs bg-red-400 hover:bg-red-500'
                        onClick={() => handleDelete(entry.sql)}
                      >
                        Delete
                      </MyButton>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className='px-2 py-4 text-center text-gray-500'>
                    {loading ? 'Loading...' : 'No cache entries'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {message && <p className='text-red-600 mt-1 text-xs'>{message}</p>}

      <MyPopup isOpen={popup !== null} onClose={() => setPopup(null)} maxWidth='max-w-[95vw]'>
        {popup !== null && <CacheEntryDetail entry={popup.entry} data={popup.data} />}
      </MyPopup>
    </>
  )
}

function TablesBadge({ tables }: { tables: string[] }) {
  if (tables.length === 0) return <span className='text-gray-400'>—</span>
  const visible = tables.slice(0, 3)
  const extra = tables.length - visible.length
  return (
    <>
      {visible.join(', ')}
      {extra > 0 && <span className='text-gray-400'> +{extra}</span>}
    </>
  )
}

const MAX_DISPLAY_ROWS = 100

function CacheEntryDetail({ entry, data }: { entry: CacheEntryInfo; data: any }) {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null)
  const rows = Array.isArray(data) ? data : null
  const columns = rows && rows.length > 0 ? Object.keys(rows[0]) : []
  const selectedRow = selectedIdx !== null && rows ? rows[selectedIdx] : null

  return (
    <div>
      <h3 className='text-sm font-semibold text-gray-700 mb-3'>Cache Entry Detail</h3>

      <div className='grid grid-cols-4 gap-2 mb-3 text-xs'>
        <div>
          <span className='font-medium text-gray-500'>Tables: </span>
          {entry.tables.length > 0 ? entry.tables.join(', ') : '—'}
        </div>
        <div>
          <span className='font-medium text-gray-500'>Caller: </span>
          {entry.caller || '—'}
        </div>
        <div>
          <span className='font-medium text-gray-500'>Rows: </span>
          {entry.rowCount >= 0 ? entry.rowCount : entry.info}
        </div>
        <div>
          <span className='font-medium text-gray-500'>Hits: </span>
          {entry.hitCount}
        </div>
      </div>

      <div className='mb-4'>
        <p className='text-xs font-medium text-gray-500 mb-1'>Key (SQL):</p>
        <pre className='bg-gray-100 rounded p-2 text-xs font-mono whitespace-pre-wrap break-all'>
          {entry.sql}
        </pre>
      </div>

      <div>
        <p className='text-xs font-medium text-gray-500 mb-1'>
          Cached Data
          {rows
            ? ` (${rows.length} row${rows.length !== 1 ? 's' : ''}${rows.length > MAX_DISPLAY_ROWS ? `, showing first ${MAX_DISPLAY_ROWS}` : ''})`
            : ''}
          :
        </p>
        {rows && columns.length > 0 ? (
          <div className='flex gap-4'>
            <div className='flex-1 border rounded overflow-auto'>
              <table className='min-w-full text-xxs text-gray-900'>
                <thead className='sticky top-0 bg-gray-100'>
                  <tr>
                    {columns.map(col => (
                      <th key={col} className='px-2 py-1 font-medium text-left whitespace-nowrap'>
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, MAX_DISPLAY_ROWS).map((row: any, i: number) => (
                    <tr
                      key={i}
                      className={`border-t border-gray-100 cursor-pointer ${i === selectedIdx ? 'bg-blue-100' : 'hover:bg-blue-50'}`}
                      onClick={() => setSelectedIdx(i)}
                    >
                      {columns.map(col => (
                        <td key={col} className='px-2 py-0.5 max-w-xs'>
                          {row[col] === null || row[col] === undefined ? (
                            <span className='text-gray-400'>null</span>
                          ) : (
                            <div className='truncate'>{fmtCellValue(row[col])}</div>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {selectedRow !== null && (
              <div className='w-80 border-l pl-4 shrink-0'>
                <p className='text-xs font-medium text-gray-500 mb-2'>
                  Row {selectedIdx! + 1} of {rows.length}
                </p>
                <dl className='space-y-2'>
                  {Object.entries(selectedRow).map(([col, val]) => (
                    <div key={col} className='text-xs'>
                      <dt className='font-medium text-gray-500'>{col}</dt>
                      <dd className='mt-0.5'>
                        {val === null || val === undefined ? (
                          <span className='text-gray-400'>null</span>
                        ) : (
                          <pre className='bg-gray-100 rounded px-2 py-0.5 font-mono whitespace-pre-wrap break-all'>
                            {fmtCellValue(val)}
                          </pre>
                        )}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}
          </div>
        ) : (
          <pre className='bg-gray-100 rounded p-2 text-xs font-mono whitespace-pre-wrap break-all'>
            {JSON.stringify(data, null, 2)}
          </pre>
        )}
      </div>
    </div>
  )
}

function fmtCellValue(val: unknown): string {
  if (val instanceof Date) return val.toISOString().slice(0, 16).replace('T', ' ')
  return String(val)
}
