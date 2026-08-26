'use client'

//==============================================================================================
//  1) DESCRIPTION
//    OwnerTableLogging — paginated, filterable view of xlg_logging, with per-row detail popup,
//    SQL raw/readable/params toggle, and a Truncate action
//
//    Parameters:
//      initialRows       — optional server-fetched first page, to avoid an initial client-side
//                          loading flash
//      initialTotalPages — page count matching initialRows
//==============================================================================================

import { useState, useEffect, useRef } from 'react'
import { table_Logging } from '../tables/structures'
import { fetchFiltered } from '../tables/tableGeneric/table_pages/fetchFiltered'
import { fetchTotalRows } from '../tables/tableGeneric/table_pages/fetchTotalRows'
import type { Filter } from '../tables/structures'
import MyPaginationFooter from '../components/MyPaginationFooter'
import { MyInput } from '../components/MyInput'
import { MyButton } from '../components/MyButton'
import MyPopup from '../components/MyPopup'
import DbKeySelect from './DbKeySelect'
import { action_truncateLogging } from './OwnerTableLogging_actions'
import {
  OwnerTableLogging_filterDebounceMs,
  OwnerTableLogging_msgTruncateLen,
  OwnerTableLogging_rowsOptions
} from '../constants'

const LOGGING_ROWS_PER_PAGE = 40

interface TableProps {
  initialRows?: table_Logging[]
  initialTotalPages?: number
}

export default function OwnerTableLogging({ initialRows, initialTotalPages }: TableProps = {}) {
  const functionName = 'OwnerTableLogging'
  const [msg, setmsg] = useState('')
  const [caller, setcaller] = useState('')
  const [functionname, setfunctionname] = useState('')
  const [severity, setseverity] = useState('')
  const [level, setlevel] = useState('')
  const [dbkey, setdbkey] = useState('')
  const [table, settable] = useState('')
  const [isupdate, setisupdate] = useState('')
  const [sqlfilter, setsqlfilter] = useState('')
  const [sqlView, setSqlView] = useState<'raw' | 'readable' | 'params'>('raw')
  const [currentPage, setcurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(LOGGING_ROWS_PER_PAGE)
  const [tabledata, settabledata] = useState<table_Logging[]>(initialRows ?? [])
  const [totalPages, setTotalPages] = useState<number>(initialTotalPages ?? 0)
  const [totalRows, setTotalRows] = useState<number>(0)
  const prevFilters = useRef({
    msg: '',
    caller: '',
    functionname: '',
    severity: '',
    level: '',
    dbkey: '',
    table: '',
    isupdate: '',
    sqlfilter: '',
    sqlView: 'raw' as 'raw' | 'readable' | 'params'
  })
  const [message, setMessage] = useState('')
  const [popup, setPopup] = useState<table_Logging | null>(null)

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) setcurrentPage(totalPages)
  }, [currentPage, totalPages])

  useEffect(() => {
    const filtersChanged =
      msg !== prevFilters.current.msg ||
      caller !== prevFilters.current.caller ||
      functionname !== prevFilters.current.functionname ||
      severity !== prevFilters.current.severity ||
      level !== prevFilters.current.level ||
      dbkey !== prevFilters.current.dbkey ||
      table !== prevFilters.current.table ||
      isupdate !== prevFilters.current.isupdate ||
      sqlfilter !== prevFilters.current.sqlfilter ||
      sqlView !== prevFilters.current.sqlView
    setMessage(filtersChanged ? 'Applying filters...' : '')
    const timeout = filtersChanged ? OwnerTableLogging_filterDebounceMs : 1
    const handler = setTimeout(() => {
      prevFilters.current = { msg, caller, functionname, severity, level, dbkey, table, isupdate, sqlfilter, sqlView }
      fetchdata()
      setMessage('')
    }, timeout)
    return () => clearTimeout(handler)
  }, [msg, caller, functionname, severity, level, dbkey, table, isupdate, sqlfilter, sqlView, currentPage, rowsPerPage])

  return (
    <div className='bg-orange-50'>
      <div className='flex items-center gap-3 py-2'>
        <MyButton overrideClass='bg-red-500 hover:bg-red-600' onClick={handleTruncate}>
          Truncate Logging
        </MyButton>
      </div>
      <div className='bg-yellow-100'>
        <table className='text-gray-900 table-fixed'>
          <thead className='sticky top-0 z-10 bg-teal-100 text-left font-normal text-xxs'>
            <tr>
              <th scope='col' className='font-medium px-2 w-10'>ID</th>
              <th scope='col' className='font-medium px-2 w-14 text-center'>Level</th>
              <th scope='col' className='font-medium px-2 w-16 text-center'>Severity</th>
              <th scope='col' className='font-medium px-2 w-28'>DbKey</th>
              <th scope='col' className='font-medium px-2 w-32'>Table</th>
              <th scope='col' className='font-medium px-2 w-16 text-center'>IsUpdate</th>
              <th scope='col' className='font-medium px-2 w-44'>Caller</th>
              <th scope='col' className='font-medium px-2 w-44'>Function Name</th>
              <th scope='col' className='font-medium px-2 w-64'>Message</th>
              <th scope='col' className='font-medium px-2 w-96'>
                <div className='flex items-center gap-2'>
                  <span>SQL</span>
                  <div className='flex gap-1'>
                    {(['raw', 'readable', 'params'] as const).map(opt => (
                      <button
                        key={opt}
                        type='button'
                        onClick={() => setSqlView(opt)}
                        className={`px-1.5 py-0.5 rounded text-xxs font-normal ${sqlView === opt ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                      >
                        {opt === 'raw' ? 'Raw' : opt === 'readable' ? 'Readable' : 'Params'}
                      </button>
                    ))}
                  </div>
                </div>
              </th>
              <th scope='col' className='font-medium px-2 w-28 whitespace-nowrap'>Date (UTC)</th>
            </tr>
            <tr className='text-xxs align-bottom'>
              <th scope='col' className='px-2'></th>
              <th scope='col' className='px-2'>
                <div className='text-center'>
                  <MyInput
                    id='level'
                    name='level'
                    overrideClass='w-full rounded-md border border-blue-500 font-normal text-xxs text-center'
                    type='text'
                    value={level}
                    onChange={e => setlevel(e.target.value)}
                  />
                </div>
              </th>
              <th scope='col' className='px-2'>
                <div className='text-center'>
                  <MyInput
                    id='severity'
                    name='severity'
                    overrideClass='w-full rounded-md border border-blue-500 font-normal text-xxs text-center'
                    type='text'
                    value={severity}
                    onChange={e => setseverity(e.target.value.toUpperCase())}
                  />
                </div>
              </th>
              <th scope='col' className='px-2'>
                <DbKeySelect
                  id='dbkey'
                  overrideClass='w-full rounded-md border border-blue-500 font-normal text-xxs'
                  includeBlank
                  value={dbkey}
                  onChange={setdbkey}
                />
              </th>
              <th scope='col' className='px-2'>
                <MyInput
                  id='table'
                  name='table'
                  overrideClass='w-full rounded-md border border-blue-500 font-normal text-xxs'
                  type='text'
                  value={table}
                  onChange={e => settable(e.target.value)}
                />
              </th>
              <th scope='col' className='px-2'>
                <div className='text-center'>
                  <MyInput
                    id='isupdate'
                    name='isupdate'
                    overrideClass='w-full rounded-md border border-blue-500 font-normal text-xxs text-center'
                    type='text'
                    value={isupdate}
                    onChange={e => setisupdate(e.target.value)}
                  />
                </div>
              </th>
              <th scope='col' className='px-2'>
                <MyInput
                  id='caller'
                  name='caller'
                  overrideClass='w-full rounded-md border border-blue-500 font-normal text-xxs'
                  type='text'
                  value={caller}
                  onChange={e => setcaller(e.target.value)}
                />
              </th>
              <th scope='col' className='px-2'>
                <MyInput
                  id='functionname'
                  name='functionname'
                  overrideClass='w-full rounded-md border border-blue-500 font-normal text-xxs'
                  type='text'
                  value={functionname}
                  onChange={e => setfunctionname(e.target.value)}
                />
              </th>
              <th scope='col' className='px-2'>
                <MyInput
                  id='msg'
                  name='msg'
                  overrideClass='w-full rounded-md border border-blue-500 font-normal text-xxs'
                  type='text'
                  value={msg}
                  onChange={e => setmsg(e.target.value)}
                />
              </th>
              <th scope='col' className='px-2'>
                <MyInput
                  id='sqlfilter'
                  name='sqlfilter'
                  overrideClass='w-full rounded-md border border-blue-500 font-normal text-xxs'
                  type='text'
                  value={sqlfilter}
                  onChange={e => setsqlfilter(e.target.value)}
                />
              </th>
              <th scope='col' className='px-2'></th>
            </tr>
          </thead>
          <tbody className='bg-sky-50 text-xxs'>
            {tabledata && tabledata.length > 0 ? (
              tabledata.map(row => (
                <tr
                  key={row.lg_lgid}
                  className={`w-full border-b border-gray-100 cursor-pointer ${popup?.lg_lgid === row.lg_lgid ? 'bg-blue-100' : 'hover:bg-blue-50'}`}
                  onClick={() => setPopup(row)}
                >
                  <td className='px-2 text-xxs'>{row.lg_lgid}</td>
                  <td className='px-2 text-center text-xxs'>{row.lg_level}</td>
                  <td className='px-2 text-center text-xxs'>{row.lg_severity}</td>
                  <td className='px-2 text-xxs'>{row.lg_dbkey}</td>
                  <td className='px-2 text-xxs'>{row.lg_table}</td>
                  <td className='px-2 text-center text-xxs'>{row.lg_isupdate ? 'Y' : 'N'}</td>
                  <td className='px-2 text-xxs'>{row.lg_caller}</td>
                  <td className='px-2 text-xxs'>{row.lg_functionname}</td>
                  <td className='px-2 text-xxs'>
                    <div className='truncate'>
                      {row.lg_msg.length > OwnerTableLogging_msgTruncateLen ? row.lg_msg.slice(0, OwnerTableLogging_msgTruncateLen) + '…' : row.lg_msg}
                    </div>
                  </td>
                  <td className='px-2 text-xxs'>
                    <div className='truncate'>{truncateDisplay(sqlViewValue(row, sqlView))}</div>
                  </td>
                  <td className='px-2 text-xxs whitespace-nowrap'>{fmtDate(row.lg_datetime)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={11}>No data available</td>
              </tr>
            )}
          </tbody>
        </table>
        <p className='text-red-600'>{message}</p>
        <div className='mt-2'>
          <MyPaginationFooter
            totalPages={totalPages}
            statecurrentPage={currentPage}
            setStateCurrentPage={setcurrentPage}
            rowsPerPage={rowsPerPage}
            setRowsPerPage={v => { setRowsPerPage(v); setcurrentPage(1) }}
            rowsOptions={OwnerTableLogging_rowsOptions}
            totalRows={totalRows}
          />
        </div>
      </div>

      <MyPopup isOpen={popup !== null} onClose={() => setPopup(null)} overrideClass='max-w-[95vw] bg-pink-100'>
        {popup !== null && <LoggingDetail row={popup} />}
      </MyPopup>
    </div>
  )

  //----------------------------------------------------------------------------------------------
  //  fetchdata — reloads rows and total-row count for the current page/filters
  //----------------------------------------------------------------------------------------------
  async function fetchdata() {
    //
    //  The SQL column's filter targets whichever field the header toggle has selected —
    //  lg_sql_params is jsonb, so it's cast to text so LIKE can search inside it
    //
    const sqlFilterColumn =
      sqlView === 'raw' ? 'lg_sql_raw' : sqlView === 'readable' ? 'lg_sql_readable' : 'lg_sql_params::text'
    const filtersToUpdate: Filter[] = [
      { column: 'lg_msg', value: msg, operator: 'LIKE' },
      { column: 'lg_caller', value: caller, operator: 'LIKE' },
      { column: 'lg_functionname', value: functionname, operator: 'LIKE' },
      { column: 'lg_severity', value: severity, operator: '=' },
      { column: 'lg_level', value: level, operator: '=' },
      { column: 'lg_dbkey', value: dbkey, operator: '=' },
      { column: 'lg_table', value: table, operator: 'LIKE' },
      { column: 'lg_isupdate', value: isupdate, operator: '=' },
      { column: sqlFilterColumn, value: sqlfilter, operator: 'LIKE' }
    ]
    const filters = filtersToUpdate.filter(filter => filter.value)
    const tableName = 'xlg_logging'
    const offset = (currentPage - 1) * rowsPerPage
    const fetchResult = await fetchFiltered({
      caller: functionName,
      table: tableName,
      filters,
      orderBy: 'lg_lgid DESC',
      limit: rowsPerPage,
      offset,
      skipCache: true
    })
    if (fetchResult.ok) settabledata(fetchResult.data)
    else console.error('Error fetching logging:', fetchResult.error)

    const totalRowsResult = await fetchTotalRows({
      caller: functionName,
      table: tableName,
      filters,
      skipCache: true
    })
    if (totalRowsResult.ok) {
      setTotalRows(totalRowsResult.data)
      setTotalPages(Math.max(1, Math.ceil(totalRowsResult.data / rowsPerPage)))
    } else {
      console.error('Error fetching logging total rows:', totalRowsResult.error)
    }
  }

  //----------------------------------------------------------------------------------------------
  //  handleTruncate — truncates xlg_logging (after confirmation), then reloads page 1
  //----------------------------------------------------------------------------------------------
  async function handleTruncate() {
    if (!confirm('Truncate logging table? This cannot be undone.')) return
    setMessage('Truncating...')
    await action_truncateLogging()
    setPopup(null)
    setcurrentPage(1)
    await fetchdata()
    setMessage('')
  }
}

//----------------------------------------------------------------------------------------------
//  truncateDisplay — shortens a string to OwnerTableLogging_msgTruncateLen with a trailing …
//
//  Params:
//    val — the string to truncate, or null
//
//  Returns:
//    the truncated string, or '' if val is null
//----------------------------------------------------------------------------------------------
function truncateDisplay(val: string | null): string {
  if (!val) return ''
  return val.length > OwnerTableLogging_msgTruncateLen ? val.slice(0, OwnerTableLogging_msgTruncateLen) + '…' : val
}

//----------------------------------------------------------------------------------------------
//  sqlViewValue — extracts the SQL field matching the header's raw/readable/params toggle
//
//  Params:
//    row  — a logging row
//    view — which SQL field to return
//
//  Returns:
//    the raw/readable SQL string, the params object as JSON text, or null if absent
//----------------------------------------------------------------------------------------------
function sqlViewValue(row: table_Logging, view: 'raw' | 'readable' | 'params'): string | null {
  if (view === 'raw') return row.lg_sql_raw
  if (view === 'readable') return row.lg_sql_readable
  return row.lg_sql_params ? JSON.stringify(row.lg_sql_params) : null
}

//----------------------------------------------------------------------------------------------
//  fmtDate — formats a log timestamp as 'YYYY-MM-DD HH:mm'
//
//  Params:
//    val — a Date or date string
//
//  Returns:
//    the formatted display string
//----------------------------------------------------------------------------------------------
function fmtDate(val: Date | string): string {
  const d = val instanceof Date ? val : new Date(val)
  return d.toISOString().slice(0, 16).replace('T', ' ')
}

//----------------------------------------------------------------------------------------------
//  LoggingDetail — full detail view for one logging row
//
//  Params:
//    row — the logging row to display
//----------------------------------------------------------------------------------------------
function LoggingDetail({ row }: { row: table_Logging }) {
  return (
    <div>
      <h3 className='text-sm font-semibold text-gray-700 mb-3'>Log Entry Detail</h3>

      <div className='grid grid-cols-4 gap-2 mb-3 text-xs'>
        <div>
          <span className='font-medium text-gray-500'>ID: </span>
          {row.lg_lgid}
        </div>
        <div>
          <span className='font-medium text-gray-500'>Level: </span>
          {row.lg_level}
        </div>
        <div>
          <span className='font-medium text-gray-500'>Severity: </span>
          {row.lg_severity}
        </div>
        <div>
          <span className='font-medium text-gray-500'>DbKey: </span>
          {row.lg_dbkey || ''}
        </div>
        <div>
          <span className='font-medium text-gray-500'>Table: </span>
          {row.lg_table || ''}
        </div>
        <div>
          <span className='font-medium text-gray-500'>IsUpdate: </span>
          {row.lg_isupdate ? 'Y' : 'N'}
        </div>
        <div>
          <span className='font-medium text-gray-500'>Caller: </span>
          {row.lg_caller || ''}
        </div>
        <div>
          <span className='font-medium text-gray-500'>Date (UTC): </span>
          {fmtDate(row.lg_datetime)}
        </div>
      </div>

      <div className='mb-3'>
        <p className='text-xs font-medium text-gray-500 mb-1'>Function Name:</p>
        <p className='text-xs'>{row.lg_functionname}</p>
      </div>

      <div className='mb-3'>
        <p className='text-xs font-medium text-gray-500 mb-1'>Message:</p>
        <pre className='rounded p-2 text-xs font-mono whitespace-pre-wrap break-all'>
          {row.lg_msg}
        </pre>
      </div>

      {row.lg_sql_raw && (
        <div className='mb-3'>
          <p className='text-xs font-medium text-gray-500 mb-1'>SQL (raw):</p>
          <pre className='rounded p-2 text-xs font-mono whitespace-pre-wrap break-all'>
            {row.lg_sql_raw}
          </pre>
        </div>
      )}

      {row.lg_sql_params !== null && row.lg_sql_params !== undefined && (
        <div className='mb-3'>
          <p className='text-xs font-medium text-gray-500 mb-1'>SQL Params:</p>
          <pre className='rounded p-2 text-xs font-mono whitespace-pre-wrap break-all'>
            {JSON.stringify(row.lg_sql_params, null, 2)}
          </pre>
        </div>
      )}

      {row.lg_sql_readable && (
        <div>
          <p className='text-xs font-medium text-gray-500 mb-1'>SQL (readable):</p>
          <pre className='rounded p-2 text-xs font-mono whitespace-pre-wrap break-all'>
            {row.lg_sql_readable}
          </pre>
        </div>
      )}
    </div>
  )
}
