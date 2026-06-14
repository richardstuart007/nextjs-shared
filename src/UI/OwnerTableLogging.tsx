'use client'

import { useState, useEffect, useRef } from 'react'
import { table_Logging } from '../tables/structures'
import { fetchFiltered } from '../tables/tableGeneric/table_pages/fetchFiltered'
import { fetchTotalPages } from '../tables/tableGeneric/table_pages/fetchTotalPages'
import type { Filter } from '../tables/structures'
import MyPagination from '../components/MyPagination'
import { MyInput } from '../components/MyInput'
import { MyButton } from '../components/MyButton'
import { action_truncateLogging } from './OwnerTableLogging_actions'

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
  const [currentPage, setcurrentPage] = useState(1)
  const [tabledata, settabledata] = useState<table_Logging[]>(initialRows ?? [])
  const [totalPages, setTotalPages] = useState<number>(initialTotalPages ?? 0)
  const prevFilters = useRef({ msg: '', caller: '', functionname: '', severity: '' })
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
      severity !== prevFilters.current.severity
    setMessage(filtersChanged ? 'Applying filters...' : '')
    const timeout = filtersChanged ? 2000 : 1
    const handler = setTimeout(() => {
      prevFilters.current = { msg, caller, functionname, severity }
      fetchdata()
      setMessage('')
    }, timeout)
    return () => clearTimeout(handler)
  }, [msg, caller, functionname, severity, currentPage])

  async function fetchdata() {
    const filtersToUpdate: Filter[] = [
      { column: 'lg_msg', value: msg, operator: 'LIKE' },
      { column: 'lg_caller', value: caller, operator: 'LIKE' },
      { column: 'lg_functionname', value: functionname, operator: 'LIKE' },
      { column: 'lg_severity', value: severity, operator: '=' }
    ]
    const filters = filtersToUpdate.filter(filter => filter.value)
    try {
      const table = 'xlg_logging'
      const offset = (currentPage - 1) * LOGGING_ROWS_PER_PAGE
      const data = await fetchFiltered({
        caller: functionName,
        table,
        filters,
        orderBy: 'lg_lgid DESC',
        limit: LOGGING_ROWS_PER_PAGE,
        offset,
        skipCache: true
      })
      settabledata(data)
      const fetchedTotalPages = await fetchTotalPages({
        caller: functionName,
        table,
        filters,
        items_per_page: LOGGING_ROWS_PER_PAGE,
        skipCache: true
      })
      setTotalPages(fetchedTotalPages)
    } catch (error) {
      console.error('Error fetching logging:', error)
    }
  }

  async function handleTruncate() {
    if (!confirm('Truncate logging table? This cannot be undone.')) return
    setMessage('Truncating...')
    await action_truncateLogging()
    setPopup(null)
    setcurrentPage(1)
    await fetchdata()
    setMessage('')
  }

  return (
    <div className='bg-orange-50'>
      <div className='flex items-center gap-3 py-2'>
        <MyButton overrideClass='bg-red-500 hover:bg-red-600' onClick={handleTruncate}>
          Truncate Logging
        </MyButton>
      </div>
      <div className='flex gap-4 bg-yellow-100'>
        <div className='shrink-0 bg-pink-100'>
          <table className='text-gray-900 table-fixed'>
            <thead className='sticky top-0 z-10 bg-teal-100 text-left font-normal text-xxs'>
              <tr>
                <th scope='col' className='font-medium px-2 w-10'>ID</th>
                <th scope='col' className='font-medium px-2 w-16 text-center'>Severity</th>
                <th scope='col' className='font-medium px-2 w-44'>Caller</th>
                <th scope='col' className='font-medium px-2 w-44'>Function Name</th>
                <th scope='col' className='font-medium px-2 w-96'>Message</th>
                <th scope='col' className='font-medium px-2 w-28 whitespace-nowrap'>Date (UTC)</th>
              </tr>
              <tr className='text-xxs align-bottom'>
                <th scope='col' className='px-2'></th>
                <th scope='col' className='px-2'>
                  <div className='text-center'>
                    <MyInput
                      id='severity'
                      name='severity'
                      overrideClass='w-full rounded-md border border-blue-500 font-normal text-xxs text-center'
                      type='text'
                      value={severity}
                      onChange={e => setseverity(e.target.value)}
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
                    <td className='px-2 text-center text-xxs'>{row.lg_severity}</td>
                    <td className='px-2 text-xxs'>{row.lg_caller}</td>
                    <td className='px-2 text-xxs'>{row.lg_functionname}</td>
                    <td className='px-2 text-xxs'>
                      <div className='truncate'>
                        {row.lg_msg.length > 200 ? row.lg_msg.slice(0, 200) + '…' : row.lg_msg}
                      </div>
                    </td>
                    <td className='px-2 text-xxs whitespace-nowrap'>{fmtDate(row.lg_datetime)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6}>No data available</td>
                </tr>
              )}
            </tbody>
          </table>
          <p className='text-red-600'>{message}</p>
          <div className='mt-2 flex justify-center'>
            <MyPagination
              totalPages={totalPages}
              statecurrentPage={currentPage}
              setStateCurrentPage={setcurrentPage}
            />
          </div>
        </div>

        {popup !== null && (
          <div className='w-[40rem] pl-4 shrink-0'>
            <LoggingDetail row={popup} />
          </div>
        )}
      </div>
    </div>
  )
}

function fmtDate(val: Date | string): string {
  const d = val instanceof Date ? val : new Date(val)
  return d.toISOString().slice(0, 16).replace('T', ' ')
}

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
          <span className='font-medium text-gray-500'>Severity: </span>
          {row.lg_severity}
        </div>
        <div>
          <span className='font-medium text-gray-500'>Caller: </span>
          {row.lg_caller || '—'}
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

      <div>
        <p className='text-xs font-medium text-gray-500 mb-1'>Message:</p>
        <pre className='bg-gray-100 rounded p-2 text-xs font-mono whitespace-pre-wrap break-all'>
          {row.lg_msg}
        </pre>
      </div>
    </div>
  )
}
