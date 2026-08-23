'use client'

import { useEffect, useState } from 'react'
import { table_fetch } from '../tables/tableGeneric/table_fetch'
import { table_write } from '../tables/tableGeneric/table_write'
import { table_delete } from '../tables/tableGeneric/table_delete'
import DbKeySelect from './DbKeySelect'
import type { table_Routing, table_Test } from '../tables/structures'
import { MyInput } from '../components/MyInput'
import { MyButton } from '../components/MyButton'
import { POSTGRES_URL_PREFIX } from '../constants'

const ROUTING_TABLE = 'xrtg_routing'
const TEST_TABLE = 'ttst_test'

//----------------------------------------------------------------------------------------------
//  OwnerDbRouting — manage xrtg_routing rows and exercise ttst_test to verify multi-database
//  query routing (src/tables/db.ts) actually reaches the database a table is routed to.
//----------------------------------------------------------------------------------------------
export default function OwnerDbRouting() {
  const functionName = 'OwnerDbRouting'

  const [routingRows, setRoutingRows] = useState<table_Routing[]>([])
  const [newTable, setNewTable] = useState('')
  const [newDbKey, setNewDbKey] = useState(POSTGRES_URL_PREFIX)
  const [routingMessage, setRoutingMessage] = useState('')

  const [testRows, setTestRows] = useState<table_Test[]>([])
  const [newNote, setNewNote] = useState('')
  const [testMessage, setTestMessage] = useState('')

  useEffect(() => {
    fetchRouting()
    fetchTest()
  }, [])

  //----------------------------------------------------------------------------------------------
  //  fetchRouting — reload xrtg_routing rows
  //----------------------------------------------------------------------------------------------
  async function fetchRouting() {
    const result = await table_fetch({
      caller: functionName,
      table: ROUTING_TABLE,
      orderBy: 'rtg_rtgid',
      skipCache: true
    })
    if (result.ok) setRoutingRows(result.data as table_Routing[])
    else setRoutingMessage(`Error: ${result.error}`)
  }

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
  //  handleAddRouting — insert a new table -> dbKey routing row
  //----------------------------------------------------------------------------------------------
  async function handleAddRouting() {
    if (!newTable || !newDbKey) return
    setRoutingMessage('Adding...')
    const result = await table_write({
      caller: functionName,
      table: ROUTING_TABLE,
      columnValuePairs: [
        { column: 'rtg_table', value: newTable },
        { column: 'rtg_dbkey', value: newDbKey }
      ]
    })
    if (!result.ok) {
      setRoutingMessage(`Error: ${result.error}`)
      return
    }
    setNewTable('')
    setNewDbKey('')
    setRoutingMessage('')
    await fetchRouting()
  }

  //----------------------------------------------------------------------------------------------
  //  handleDeleteRouting — remove a routing row (the table falls back to primary)
  //----------------------------------------------------------------------------------------------
  async function handleDeleteRouting(row: table_Routing) {
    if (!confirm(`Remove routing for "${row.rtg_table}"? It will fall back to primary.`)) return
    const result = await table_delete({
      caller: functionName,
      table: ROUTING_TABLE,
      whereColumnValuePairs: [{ column: 'rtg_rtgid', value: row.rtg_rtgid }]
    })
    if (!result.ok) {
      setRoutingMessage(`Error: ${result.error}`)
      return
    }
    await fetchRouting()
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

  return (
    <div className='p-4 flex gap-8'>
      <div>
        <h3 className='text-sm font-semibold text-gray-700 mb-2'>Routing (xrtg_routing)</h3>
        <div className='flex items-end gap-2 mb-3'>
          <div>
            <label htmlFor='rtg-table' className='block text-xxs font-bold text-gray-500'>
              Table
            </label>
            <MyInput
              id='rtg-table'
              overrideClass='w-40 text-xs'
              value={newTable}
              onChange={e => setNewTable(e.target.value)}
            />
          </div>
          <DbKeySelect
            id='rtg-dbkey'
            label='DbKey'
            labelClass='block text-xxs font-bold text-gray-500'
            value={newDbKey}
            onChange={setNewDbKey}
          />
          <MyButton onClick={handleAddRouting}>Add</MyButton>
          {routingMessage && <span className='text-xs text-gray-600'>{routingMessage}</span>}
        </div>
        <table className='text-xs'>
          <thead>
            <tr className='text-left'>
              <th className='px-2'>ID</th>
              <th className='px-2'>Table</th>
              <th className='px-2'>DbKey</th>
              <th className='px-2'></th>
            </tr>
          </thead>
          <tbody>
            {routingRows.map(row => (
              <tr key={row.rtg_rtgid} className='border-b border-gray-100'>
                <td className='px-2'>{row.rtg_rtgid}</td>
                <td className='px-2'>{row.rtg_table}</td>
                <td className='px-2'>{row.rtg_dbkey}</td>
                <td className='px-2'>
                  <MyButton
                    overrideClass='bg-red-500 hover:bg-red-600 text-xxs h-6 px-2'
                    onClick={() => handleDeleteRouting(row)}
                  >
                    Delete
                  </MyButton>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div>
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
    </div>
  )
}
