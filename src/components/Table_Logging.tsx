'use client'

import { useState, useEffect, useRef } from 'react'
import { table_Logging } from '../tables/structures'
import { fetchFiltered } from '../tables/tableGeneric/table_pages/fetchFiltered'
import { fetchTotalPages } from '../tables/tableGeneric/table_pages/fetchTotalPages'
import type { Filter } from '../tables/structures'
import MyPagination from './MyPagination'
import { MyInput } from './MyInput'

const LOGGING_ROWS_PER_PAGE = 50

interface TableProps {
  initialRows?: table_Logging[]
  initialTotalPages?: number
}

export default function Table({ initialRows, initialTotalPages }: TableProps = {}) {
  const functionName = 'Table_Logging'
  const [msg, setmsg] = useState('')
  const [functionname, setfunctionname] = useState('')
  const [severity, setseverity] = useState('')
  const [currentPage, setcurrentPage] = useState(1)
  const [tabledata, settabledata] = useState<table_Logging[]>(initialRows ?? [])
  const [totalPages, setTotalPages] = useState<number>(initialTotalPages ?? 0)
  const prevFilters = useRef({ msg: '', functionname: '', severity: '' })
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) setcurrentPage(totalPages)
  }, [currentPage, totalPages])

  useEffect(() => {
    const filtersChanged =
      msg !== prevFilters.current.msg ||
      functionname !== prevFilters.current.functionname ||
      severity !== prevFilters.current.severity
    setMessage(filtersChanged ? 'Applying filters...' : '')
    const timeout = filtersChanged ? 2000 : 1
    const handler = setTimeout(() => {
      prevFilters.current = { msg, functionname, severity }
      fetchdata()
      setMessage('')
    }, timeout)
    return () => clearTimeout(handler)
  }, [msg, functionname, severity, currentPage])

  async function fetchdata() {
    const filtersToUpdate: Filter[] = [
      { column: 'lg_msg', value: msg, operator: 'LIKE' },
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

  return (
    <>
      <div>
        <div>
          <table className='min-w-full text-gray-900 table-auto'>
            <thead className='sticky top-0 z-10 bg-gray-50 text-left font-normal text-xxs'>
              <tr>
                <th scope='col' className='font-medium px-2'>ID</th>
                <th scope='col' className='font-medium px-2 text-center'>Severity</th>
                <th scope='col' className='font-medium px-2'>Caller</th>
                <th scope='col' className='font-medium px-2'>Function Name</th>
                <th scope='col' className='font-medium px-2'>Message</th>
                <th scope='col' className='font-medium px-2 whitespace-nowrap'>Date (UTC)</th>
              </tr>
              <tr className='text-xxs align-bottom'>
                <th scope='col' className='px-2'></th>
                <th scope='col' className='px-2'>
                  <div className='text-center'>
                    <MyInput
                      id='severity'
                      name='severity'
                      overrideClass='w-16 rounded-md border border-blue-500 font-normal text-xxs text-center'
                      type='text'
                      value={severity}
                      onChange={e => setseverity(e.target.value)}
                    />
                  </div>
                </th>
                <th scope='col' className='px-2'></th>
                <th scope='col' className='px-2'>
                  <MyInput
                    id='functionname'
                    name='functionname'
                    overrideClass='w-28 rounded-md border border-blue-500 font-normal text-xxs'
                    type='text'
                    value={functionname}
                    onChange={e => setfunctionname(e.target.value)}
                  />
                </th>
                <th scope='col' className='px-2'>
                  <MyInput
                    id='msg'
                    name='msg'
                    overrideClass='w-[950px] rounded-md border border-blue-500 font-normal text-xxs'
                    type='text'
                    value={msg}
                    onChange={e => setmsg(e.target.value)}
                  />
                </th>
                <th scope='col' className='px-2'></th>
              </tr>
            </thead>
            <tbody className='bg-white text-xxs'>
              {tabledata && tabledata.length > 0 ? (
                tabledata.map(row => (
                  <tr key={row.lg_lgid} className='w-full border-b'>
                    <td className='px-2 text-xxs'>{row.lg_lgid}</td>
                    <td className='px-2 text-center text-xxs'>{row.lg_severity}</td>
                    <td className='px-2 text-xxs'>{row.lg_caller}</td>
                    <td className='px-2 text-xxs'>{row.lg_functionname}</td>
                    <td className='px-2 text-xxs'>{row.lg_msg}</td>
                    <td className='px-2 text-xxs whitespace-nowrap'>
                      {new Date(row.lg_datetime).toISOString().slice(0, 16).replace('T', ' ')}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6}>No data available</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <p className='text-red-600'>{message}</p>
      <div className='mt-5 flex w-full justify-center'>
        <MyPagination
          totalPages={totalPages}
          statecurrentPage={currentPage}
          setStateCurrentPage={setcurrentPage}
        />
      </div>
    </>
  )
}
