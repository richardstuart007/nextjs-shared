'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  cacheAction_getEntries,
  cacheAction_clearAll,
  cacheAction_deleteEntry,
  cacheAction_getEntryData
} from '../tables/cache/cache_actions'
import type { CacheEntryInfo } from '../tables/cache/userCache_store'
import { MyInput } from './MyInput'
import { MyButton } from './MyButton'
import MyPopup from './MyPopup'

type PopupState =
  | { type: 'key'; entry: CacheEntryInfo }
  | { type: 'row'; entry: CacheEntryInfo; data: any }
  | null

export default function Table_Cache() {
  const functionName = 'Table_Cache'
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
    setPopup({ type: 'row', entry, data })
  }

  function handleKeyClick(e: React.MouseEvent, entry: CacheEntryInfo) {
    e.stopPropagation()
    setPopup({ type: 'key', entry })
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
      <div className='mt-2 bg-gray-50 rounded-lg shadow-md max-w-full'>
        <div className='overflow-x-auto overflow-y-auto max-h-[70vh]'>
          <table className='min-w-full text-gray-900 table-auto'>
            <thead className='sticky top-0 z-10 bg-gray-50 text-left font-normal text-xxs'>
              <tr>
                <th scope='col' className='font-medium px-2'>#</th>
                <th scope='col' className='font-medium px-2'>Tables</th>
                <th scope='col' className='font-medium px-2'>Caller</th>
                <th scope='col' className='font-medium px-2'>Rows</th>
                <th scope='col' className='font-medium px-2'>Hits</th>
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
                    className='w-full border-b cursor-pointer hover:bg-blue-50'
                    onClick={() => handleRowClick(entry)}
                  >
                    <td className='px-2'>{idx + 1}</td>
                    <td className='px-2 whitespace-nowrap'>
                      <TablesBadge tables={entry.tables} />
                    </td>
                    <td className='px-2'>{entry.caller}</td>
                    <td className='px-2 text-right'>
                      {entry.rowCount >= 0 ? entry.rowCount : entry.info}
                    </td>
                    <td className='px-2 text-right'>{entry.hitCount}</td>
                    <td
                      className='px-2 font-mono max-w-[400px] truncate text-blue-600 hover:text-blue-800 underline'
                      title='Click to view full key'
                      onClick={e => handleKeyClick(e, entry)}
                    >
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

      <MyPopup isOpen={popup?.type === 'key'} onClose={() => setPopup(null)} maxWidth='max-w-3xl'>
        {popup?.type === 'key' && (
          <>
            <h3 className='text-sm font-semibold text-gray-700 mb-2'>Full Cache Key (SQL)</h3>
            <pre className='bg-gray-100 rounded p-3 text-xs font-mono whitespace-pre-wrap break-all overflow-auto max-h-[60vh]'>
              {popup.entry.sql}
            </pre>
          </>
        )}
      </MyPopup>

      <MyPopup isOpen={popup?.type === 'row'} onClose={() => setPopup(null)} maxWidth='max-w-5xl'>
        {popup?.type === 'row' && <CacheEntryDetail entry={popup.entry} data={popup.data} />}
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
  const rows = Array.isArray(data) ? data : null
  const columns = rows && rows.length > 0 ? Object.keys(rows[0]) : []

  return (
    <div>
      <h3 className='text-sm font-semibold text-gray-700 mb-3'>Cache Entry Detail</h3>

      <div className='grid grid-cols-3 gap-2 mb-3 text-xs'>
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
          <div className='overflow-auto max-h-[50vh] border rounded'>
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
                  <tr key={i} className='border-t'>
                    {columns.map(col => (
                      <td key={col} className='px-2 py-0.5 whitespace-nowrap'>
                        {row[col] === null || row[col] === undefined ? (
                          <span className='text-gray-400'>null</span>
                        ) : (
                          String(row[col])
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <pre className='bg-gray-100 rounded p-2 text-xs font-mono whitespace-pre-wrap break-all overflow-auto max-h-[50vh]'>
            {JSON.stringify(data, null, 2)}
          </pre>
        )}
      </div>
    </div>
  )
}
