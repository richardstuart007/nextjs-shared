'use client'

//==============================================================================================
//  1) DESCRIPTION
//    OwnerTableSessionStorage — lists, deletes, or clears the current tab's
//    SessionStorageKeyPrefix-prefixed sessionStorage entries
//==============================================================================================

import { useState, useEffect } from 'react'
import { MyButton } from '../components/MyButton'
import { SessionStorageKeyPrefix } from '../constants'

type SessionStorageEntry = { key: string; value: string }

export default function OwnerTableSessionStorage() {
  const [entries, setEntries] = useState<SessionStorageEntry[]>([])

  useEffect(() => {
    refresh()
  }, [])

  return (
    <>
      <div className='flex items-center gap-2 mb-2 bg-orange-50'>
        <MyButton onClick={refresh}>Refresh</MyButton>
        <MyButton
          overrideClass='bg-red-500 hover:bg-red-600'
          onClick={handleClearAll}
          disabled={entries.length === 0}
        >
          Clear All
        </MyButton>
      </div>
      <div>
        <table className='min-w-full text-gray-900 table-auto'>
          <thead className='sticky top-0 z-10 bg-teal-100 text-left font-normal text-xxs'>
            <tr>
              <th scope='col' className='font-medium px-2'>#</th>
              <th scope='col' className='font-medium px-2'>Key</th>
              <th scope='col' className='font-medium px-2'>Value</th>
              <th scope='col' className='font-medium px-2'></th>
            </tr>
          </thead>
          <tbody className='bg-sky-50 text-xxs'>
            {entries.length > 0 ? (
              entries.map((entry, idx) => (
                <tr key={entry.key} className='w-full border-b border-gray-100'>
                  <td className='px-2'>{idx + 1}</td>
                  <td className='px-2 font-mono'>{entry.key}</td>
                  <td className='px-2 font-mono break-all whitespace-pre-wrap'>{entry.value}</td>
                  <td className='px-2'>
                    <MyButton
                      overrideClass='h-5 px-1 text-xxs bg-red-400 hover:bg-red-500'
                      onClick={() => handleDelete(entry.key)}
                    >
                      Delete
                    </MyButton>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className='px-2 py-4 text-center text-gray-500'>
                  No sessionStorage entries
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  )

  //----------------------------------------------------------------------------------------------
  //  refresh — reloads entries from sessionStorage, filtered to SessionStorageKeyPrefix
  //  and sorted by key
  //----------------------------------------------------------------------------------------------
  function refresh() {
    const nextEntries: SessionStorageEntry[] = []
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i)
      if (key === null || !key.startsWith(SessionStorageKeyPrefix)) continue
      nextEntries.push({ key, value: sessionStorage.getItem(key) ?? '' })
    }
    nextEntries.sort((a, b) => a.key.localeCompare(b.key))
    setEntries(nextEntries)
  }

  //----------------------------------------------------------------------------------------------
  //  handleDelete — removes one entry and refreshes
  //
  //  Params:
  //    key — the sessionStorage key to remove
  //----------------------------------------------------------------------------------------------
  function handleDelete(key: string) {
    sessionStorage.removeItem(key)
    refresh()
  }

  //----------------------------------------------------------------------------------------------
  //  handleClearAll — removes every currently-listed entry and refreshes
  //----------------------------------------------------------------------------------------------
  function handleClearAll() {
    //
    //  Only clear the rs7_-prefixed entries this table actually displays — a bare
    //  sessionStorage.clear() would also wipe unrelated, unfiltered entries the user
    //  never saw listed here
    //
    entries.forEach(entry => sessionStorage.removeItem(entry.key))
    refresh()
  }
}
