'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  cacheAction_getEntries,
  cacheAction_clearAll,
  cacheAction_deleteEntry
} from '../tables/cache/cache_actions'
import type { CacheEntryInfo } from '../tables/cache/userCache_store'
import { MyInput } from './MyInput'
import { MyButton } from './MyButton'

export default function Table_Cache() {
  const functionName = 'Table_Cache'
  const [entries, setEntries] = useState<CacheEntryInfo[]>([])
  const [keyFilter, setKeyFilter] = useState('')
  const [tableFilter, setTableFilter] = useState('')
  const [callerFilter, setCallerFilter] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

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

  const filteredEntries = useMemo(() => {
    return entries.filter(entry => {
      const matchKey = keyFilter === '' || entry.sql.toLowerCase().includes(keyFilter.toLowerCase())
      const matchTable =
        tableFilter === '' || entry.table.toLowerCase().includes(tableFilter.toLowerCase())
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
                <th scope='col' className='font-medium px-2'>Table</th>
                <th scope='col' className='font-medium px-2'>Caller</th>
                <th scope='col' className='font-medium px-2'>Rows</th>
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
                    overrideClass='w-[600px] font-normal text-xxs'
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
                  <tr key={entry.sql} className='w-full border-b'>
                    <td className='px-2 text-xxs'>{idx + 1}</td>
                    <td className='px-2 text-xxs'>{entry.table}</td>
                    <td className='px-2 text-xxs'>{entry.caller}</td>
                    <td className='px-2 text-xxs whitespace-nowrap'>{entry.info}</td>
                    <td className='px-2 text-xxs font-mono max-w-[600px] truncate' title={entry.sql}>
                      {entry.sql}
                    </td>
                    <td className='px-2 text-xxs'>
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
                  <td colSpan={6} className='px-2 py-4 text-center text-gray-500'>
                    {loading ? 'Loading...' : 'No cache entries'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {message && <p className='text-red-600 mt-1 text-xs'>{message}</p>}
    </>
  )
}
