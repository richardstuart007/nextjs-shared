'use client'

//==============================================================================================
//  1) DESCRIPTION
//    OwnerRoutingTest — write/delete ttst_test rows to verify multi-database query routing
//    (src/tables/db.ts) actually reaches the database a table is routed to. Not exported —
//    nextjs-shared-internal only, same as the Components tab.
//==============================================================================================

import { useEffect, useState } from 'react'
import { table_fetch } from '../tables/tableGeneric/table_fetch'
import { table_write } from '../tables/tableGeneric/table_write'
import { table_delete } from '../tables/tableGeneric/table_delete'
import type { table_Test } from '../tables/structures'
import { MyInput } from '../components/MyInput'
import { MyButton } from '../components/MyButton'

const TEST_TABLE = 'ttst_test'

export default function OwnerRoutingTest() {
  const functionName = 'OwnerRoutingTest'

  const [testRows, setTestRows] = useState<table_Test[]>([])
  const [newNote, setNewNote] = useState('')
  const [testMessage, setTestMessage] = useState('')

  useEffect(() => {
    fetchTest()
  }, [])

  return (
    <div className='p-4'>
      <h3 className='text-sm font-semibold text-gray-700 mb-2'>Test data (ttst_test)</h3>
      <div className='flex items-end gap-2 mb-3'>
        <div>
          <label htmlFor='tst-note' className='block text-xxs font-bold text-gray-500'>
            Note
          </label>
          <MyInput
            id='tst-note'
            overrideClass='w-56 text-xs'
            value={newNote}
            onChange={e => setNewNote(e.target.value)}
          />
        </div>
        <MyButton onClick={handleAddTest}>Write</MyButton>
        {testMessage && <span className='text-xs text-gray-600'>{testMessage}</span>}
      </div>
      <table className='text-xs'>
        <thead>
          <tr className='text-left'>
            <th className='px-2'>ID</th>
            <th className='px-2'>Note</th>
            <th className='px-2'></th>
          </tr>
        </thead>
        <tbody>
          {testRows.map(row => (
            <tr key={row.tst_tstid} className='border-b border-gray-100'>
              <td className='px-2'>{row.tst_tstid}</td>
              <td className='px-2'>{row.tst_note}</td>
              <td className='px-2'>
                <MyButton
                  overrideClass='bg-red-500 hover:bg-red-600 text-xxs h-6 px-2'
                  onClick={() => handleDeleteTest(row)}
                >
                  Delete
                </MyButton>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )

  //----------------------------------------------------------------------------------------------
  //  fetchTest — reload ttst_test rows
  //----------------------------------------------------------------------------------------------
  async function fetchTest() {
    const result = await table_fetch({
      caller: functionName,
      table: TEST_TABLE,
      orderBy: 'tst_tstid DESC',
      skipCache: true
    })
    if (result.ok) setTestRows(result.data as table_Test[])
    else setTestMessage(`Error: ${result.error}`)
  }

  //----------------------------------------------------------------------------------------------
  //  handleAddTest — write a row into ttst_test, routed per the current xrtg_routing entry (if
  //  any) for ttst_test
  //----------------------------------------------------------------------------------------------
  async function handleAddTest() {
    if (!newNote) return
    setTestMessage('Writing...')
    const result = await table_write({
      caller: functionName,
      table: TEST_TABLE,
      columnValuePairs: [{ column: 'tst_note', value: newNote }]
    })
    if (!result.ok) {
      setTestMessage(`Error: ${result.error}`)
      return
    }
    setNewNote('')
    setTestMessage('')
    await fetchTest()
  }

  //----------------------------------------------------------------------------------------------
  //  handleDeleteTest — remove a ttst_test row
  //
  //  Params:
  //    row — the row to delete
  //----------------------------------------------------------------------------------------------
  async function handleDeleteTest(row: table_Test) {
    if (!confirm(`Delete test row ${row.tst_tstid}?`)) return
    const result = await table_delete({
      caller: functionName,
      table: TEST_TABLE,
      whereColumnValuePairs: [{ column: 'tst_tstid', value: row.tst_tstid }]
    })
    if (!result.ok) {
      setTestMessage(`Error: ${result.error}`)
      return
    }
    await fetchTest()
  }
}
