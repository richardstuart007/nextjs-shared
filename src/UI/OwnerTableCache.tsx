'use client'

//==============================================================================================
//  1) DESCRIPTION
//    OwnerTableCache — paginated, filterable inspector for the userCache_store, with
//    per-row detail popup, delete, and clear-all
//==============================================================================================

import { useState, useEffect, useRef } from 'react'
import {
  cacheAction_getEntries,
  cacheAction_clearAll,
  cacheAction_deleteEntry,
  cacheAction_getEntryData
} from '../tables/cache/cache_actions'
import type { CacheEntryInfo } from '../tables/cache/userCache_store'
import { write_logging } from '../tables/tableGeneric/write_logging'
import { MyInput } from '../components/MyInput'
import { MyButton } from '../components/MyButton'
import MyPopup from '../components/MyPopup'
import MyPaginationFooter from '../components/MyPaginationFooter'
import {
  OwnerTableCache_tablesBadgeVisibleCount,
  OwnerTableCache_filterDebounceMs,
  OwnerTableCache_maxDisplayRows,
  MySelectRows_valueDftShared
} from '../constants'

type PopupState = { entry: CacheEntryInfo; data: any } | null

export default function OwnerTableCache() {
  const functionName = 'OwnerTableCache'
  const [entries, setEntries] = useState<CacheEntryInfo[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [overallSize, setOverallSize] = useState(0)
  const [filter_key, setFilter_key] = useState('')
  const [filter_table, setFilter_table] = useState('')
  const [filter_caller, setFilter_caller] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(MySelectRows_valueDftShared)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [popup, setPopup] = useState<PopupState>(null)
  const prevFilters = useRef({ filter_key: '', filter_table: '', filter_caller: '' })

  const totalPages = Math.max(1, Math.ceil(totalCount / rowsPerPage))

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages)
  }, [currentPage, totalPages])

  useEffect(() => {
    const filtersChanged =
      filter_key !== prevFilters.current.filter_key ||
      filter_table !== prevFilters.current.filter_table ||
      filter_caller !== prevFilters.current.filter_caller
    if (filtersChanged) setCurrentPage(1)
    const timeout = filtersChanged ? OwnerTableCache_filterDebounceMs : 1
    const handler = setTimeout(() => {
      prevFilters.current = { filter_key, filter_table, filter_caller }
      fetchdata()
    }, timeout)
    return () => clearTimeout(handler)
  }, [filter_key, filter_table, filter_caller, currentPage, rowsPerPage])

  const clearAllDisabled = loading || overallSize === 0
  const hasEntries = entries.length > 0
  const noEntries = !hasEntries
  const emptyMessage = loading ? 'Loading...' : 'No cache entries'
  const popupOpen = popup !== null

  return (
    <>
      <div className='flex items-center gap-2 mb-2 bg-orange-50'>
        <MyButton onClick={fetchdata} disabled={loading}>
          Refresh
        </MyButton>
        <MyButton
          overrideClass='bg-red-500 hover:bg-red-600'
          onClick={handleClearAll}
          disabled={clearAllDisabled}
        >
          Clear All
        </MyButton>
      </div>
      <div>
        <div>
          <table className='min-w-full text-gray-900 table-auto'>
            <thead className='sticky top-0 z-10 bg-teal-100 text-left font-normal text-xxs'>
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
                    id='filter_table'
                    name='filter_table'
                    overrideClass='w-24 font-normal text-xxs'
                    type='text'
                    value={filter_table}
                    onChange={e => setFilter_table(e.target.value)}
                    placeholder='filter...'
                  />
                </th>
                <th scope='col' className='px-2'>
                  <MyInput
                    id='filter_caller'
                    name='filter_caller'
                    overrideClass='w-28 font-normal text-xxs'
                    type='text'
                    value={filter_caller}
                    onChange={e => setFilter_caller(e.target.value)}
                    placeholder='filter...'
                  />
                </th>
                <th scope='col' className='px-2'></th>
                <th scope='col' className='px-2'></th>
                <th scope='col' className='px-2'>
                  <MyInput
                    id='filter_key'
                    name='filter_key'
                    overrideClass='w-[800px] font-normal text-xxs'
                    type='text'
                    value={filter_key}
                    onChange={e => setFilter_key(e.target.value)}
                    placeholder='filter by key...'
                  />
                </th>
                <th scope='col' className='px-2'></th>
              </tr>
            </thead>
            <tbody className='bg-sky-50 text-xxs'>
              {hasEntries &&
                entries.map((entry, idx) => {
                  const rowNumber = (currentPage - 1) * rowsPerPage + idx + 1
                  const rowCountText = entry.rowCount >= 0 ? entry.rowCount : entry.info
                  return (
                    <tr
                      key={entry.sql}
                      className='w-full border-b border-gray-100 cursor-pointer hover:bg-blue-50'
                      onClick={() => handleRowClick(entry)}
                    >
                      <td className='px-2'>{rowNumber}</td>
                      <td className='px-2'>
                        <TablesBadge tables={entry.tables} />
                      </td>
                      <td className='px-2'>{entry.caller}</td>
                      <td className='px-2 text-center'>
                        {rowCountText}
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
                  )
                })}
              {noEntries && (
                <tr>
                  <td colSpan={7} className='px-2 py-4 text-center text-gray-500'>
                    {emptyMessage}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <div className='mt-2'>
        <MyPaginationFooter
          totalPages={totalPages}
          statecurrentPage={currentPage}
          setStateCurrentPage={setCurrentPage}
          rowsPerPage={rowsPerPage}
          setRowsPerPage={v => { setRowsPerPage(v); setCurrentPage(1) }}
          totalRows={totalCount}
        />
      </div>
      {message && <p className='text-red-600 mt-1 text-xs'>{message}</p>}

      <MyPopup isOpen={popupOpen} onClose={() => setPopup(null)} overrideClass='max-w-[95vw] bg-pink-100'>
        {popup && <CacheEntryDetail entry={popup.entry} data={popup.data} />}
      </MyPopup>
    </>
  )

  //----------------------------------------------------------------------------------------------
  //  fetchdata — reloads entries for the current page/filters
  //----------------------------------------------------------------------------------------------
  async function fetchdata() {
    setLoading(true)
    setMessage('')
    try {
      const data = await cacheAction_getEntries({
        limit: rowsPerPage,
        offset: (currentPage - 1) * rowsPerPage,
        keyFilter: filter_key,
        tableFilter: filter_table,
        callerFilter: filter_caller
      })
      setEntries(data.entries)
      setTotalCount(data.totalCount)
      setOverallSize(data.overallSize)
    } catch (error) {
      const errorMessage = 'Error fetching cache entries: ' + (error as Error).message
      setMessage(errorMessage)
      await write_logging({
        lg_functionname: 'fetchdata',
        lg_caller: functionName,
        lg_msg: errorMessage,
        lg_severity: 'E'
      })
    } finally {
      setLoading(false)
    }
  }

  //----------------------------------------------------------------------------------------------
  //  handleClearAll — clears every cache entry, then refreshes
  //----------------------------------------------------------------------------------------------
  async function handleClearAll() {
    setMessage('Clearing all...')
    try {
      await cacheAction_clearAll(functionName)
      await fetchdata()
    } catch (error) {
      const errorMessage = 'Error clearing cache: ' + (error as Error).message
      setMessage(errorMessage)
      await write_logging({
        lg_functionname: 'handleClearAll',
        lg_caller: functionName,
        lg_msg: errorMessage,
        lg_severity: 'E'
      })
    }
  }

  //----------------------------------------------------------------------------------------------
  //  handleRowClick — fetches the full cached data for one entry and opens the detail popup
  //
  //  Params:
  //    entry — the clicked row's summary info
  //----------------------------------------------------------------------------------------------
  async function handleRowClick(entry: CacheEntryInfo) {
    try {
      const data = await cacheAction_getEntryData(entry.sql)
      setPopup({ entry, data })
    } catch (error) {
      const errorMessage = 'Error fetching cache entry data: ' + (error as Error).message
      setMessage(errorMessage)
      await write_logging({
        lg_functionname: 'handleRowClick',
        lg_caller: functionName,
        lg_msg: errorMessage,
        lg_severity: 'E'
      })
    }
  }

  //----------------------------------------------------------------------------------------------
  //  handleDelete — deletes one cache entry, then refreshes
  //
  //  Params:
  //    sql — the entry's cache key (the SQL string)
  //----------------------------------------------------------------------------------------------
  async function handleDelete(sql: string) {
    try {
      await cacheAction_deleteEntry(sql, functionName)
      await fetchdata()
    } catch (error) {
      const errorMessage = 'Error deleting entry: ' + (error as Error).message
      setMessage(errorMessage)
      await write_logging({
        lg_functionname: 'handleDelete',
        lg_caller: functionName,
        lg_msg: errorMessage,
        lg_severity: 'E'
      })
    }
  }
}

//----------------------------------------------------------------------------------
//  TablesBadge — comma-joined table list, truncated with a "+N" suffix past the visible count
//
//  Params:
//    tables — the tables this cache entry touches
//----------------------------------------------------------------------------------
function TablesBadge({ tables }: { tables: string[] }) {
  if (tables.length === 0) return <span className='text-gray-400'>—</span>
  const visible = tables.slice(0, OwnerTableCache_tablesBadgeVisibleCount)
  const extra = tables.length - visible.length
  const hasExtra = extra > 0
  return (
    <>
      {visible.join(', ')}
      {hasExtra && <span className='text-gray-400'> +{extra}</span>}
    </>
  )
}

//----------------------------------------------------------------------------------
//  CacheEntryDetail — full detail view for one cache entry: metadata, the cache key
//  (SQL), and a row/column grid (with a per-row detail panel) if the cached data is an
//  array, otherwise raw JSON
//
//  Params:
//    entry — the entry's summary info (tables, caller, rowCount, hitCount, sql)
//    data  — the entry's full cached value
//----------------------------------------------------------------------------------
function CacheEntryDetail({ entry, data }: { entry: CacheEntryInfo; data: any }) {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null)
  const rows = Array.isArray(data) ? data : null
  const columns = rows && rows.length > 0 ? Object.keys(rows[0]) : []
  const selectedRow = selectedIdx !== null && rows ? rows[selectedIdx] : null
  const tablesText = entry.tables.length > 0 ? entry.tables.join(', ') : '—'
  const rowCountText = entry.rowCount >= 0 ? entry.rowCount : entry.info
  const cachedDataSuffix = rows
    ? ` (${rows.length} row${rows.length !== 1 ? 's' : ''}${rows.length > OwnerTableCache_maxDisplayRows ? `, showing first ${OwnerTableCache_maxDisplayRows}` : ''})`
    : ''
  const hasColumns = columns.length > 0
  const showRawJson = !rows || !hasColumns
  const displayRows = rows?.slice(0, OwnerTableCache_maxDisplayRows) ?? []
  const hasSelectedRow = selectedRow !== null
  const selectedRowEntries = selectedRow !== null ? Object.entries(selectedRow) : []
  const selectedRowNumber = selectedIdx !== null ? selectedIdx + 1 : 0

  return (
    <div>
      <h3 className='text-sm font-semibold text-gray-700 mb-3'>Cache Entry Detail</h3>

      <div className='grid grid-cols-4 gap-2 mb-3 text-xs'>
        <div>
          <span className='font-medium text-gray-500'>Tables: </span>
          {tablesText}
        </div>
        <div>
          <span className='font-medium text-gray-500'>Caller: </span>
          {entry.caller || '—'}
        </div>
        <div>
          <span className='font-medium text-gray-500'>Rows: </span>
          {rowCountText}
        </div>
        <div>
          <span className='font-medium text-gray-500'>Hits: </span>
          {entry.hitCount}
        </div>
      </div>

      <div className='mb-4'>
        <p className='text-xs font-medium text-gray-500 mb-1'>Key (SQL):</p>
        <pre className='rounded p-2 text-xs font-mono whitespace-pre-wrap break-all'>
          {entry.sql}
        </pre>
      </div>

      <div>
        <p className='text-xs font-medium text-gray-500 mb-1'>
          Cached Data
          {cachedDataSuffix}
          :
        </p>
        {rows && hasColumns && (
          <div className='flex gap-4'>
            <div className='flex-1 border rounded overflow-auto'>
              <table className='min-w-full text-xxs text-gray-900'>
                <thead className='sticky top-0'>
                  <tr>
                    {columns.map(col => (
                      <th key={col} className='px-2 py-1 font-medium text-left whitespace-nowrap'>
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {displayRows.map((row: any, i: number) => {
                    const rowClass = `border-t border-gray-100 cursor-pointer ${i === selectedIdx ? 'bg-blue-100' : 'hover:bg-blue-50'}`
                    return (
                      <tr
                        key={i}
                        className={rowClass}
                        onClick={() => setSelectedIdx(i)}
                      >
                        {columns.map(col => {
                          const isNullCell = row[col] === null || row[col] === undefined
                          const hasCellValue = !isNullCell
                          return (
                            <td key={col} className='px-2 py-0.5 max-w-xs'>
                              {isNullCell && <span className='text-gray-400'>null</span>}
                              {hasCellValue && <div className='truncate'>{fmtCellValue(row[col])}</div>}
                            </td>
                          )
                        })}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {hasSelectedRow && (
              <div className='w-80 border-l pl-4 shrink-0'>
                <p className='text-xs font-medium text-gray-500 mb-2'>
                  Row {selectedRowNumber} of {rows.length}
                </p>
                <dl className='space-y-2'>
                  {selectedRowEntries.map(([col, val]) => {
                    const isNullValue = val === null || val === undefined
                    const hasValue = !isNullValue
                    return (
                      <div key={col} className='text-xs'>
                        <dt className='font-medium text-gray-500'>{col}</dt>
                        <dd className='mt-0.5'>
                          {isNullValue && <span className='text-gray-400'>null</span>}
                          {hasValue && (
                            <pre className='rounded px-2 py-0.5 font-mono whitespace-pre-wrap break-all'>
                              {fmtCellValue(val)}
                            </pre>
                          )}
                        </dd>
                      </div>
                    )
                  })}
                </dl>
              </div>
            )}
          </div>
        )}
        {showRawJson && (
          <pre className='rounded p-2 text-xs font-mono whitespace-pre-wrap break-all'>
            {JSON.stringify(data, null, 2)}
          </pre>
        )}
      </div>
    </div>
  )
}

//----------------------------------------------------------------------------------
//  fmtCellValue — formats one cell's raw value for display (Date -> 'YYYY-MM-DD HH:mm',
//  everything else -> String(val))
//
//  Params:
//    val — the raw cell value
//
//  Returns:
//    the display string
//----------------------------------------------------------------------------------
function fmtCellValue(val: unknown): string {
  if (val instanceof Date) {
    const dateText = val.toISOString().slice(0, 16).replace('T', ' ')
    return dateText
  }
  const result = String(val)
  return result
}
