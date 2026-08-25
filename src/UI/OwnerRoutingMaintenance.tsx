'use client'

//==============================================================================================
//  1) DESCRIPTION
//    OwnerRoutingMaintenance — write, edit-in-place, and delete xrtg_routing rows. Exported so
//    any consuming project can add it to their own /owner page to maintain their own routing
//    table.
//==============================================================================================

import { useEffect, useState } from 'react'
import { table_fetch } from '../tables/tableGeneric/table_fetch'
import { table_write } from '../tables/tableGeneric/table_write'
import { table_update } from '../tables/tableGeneric/table_update'
import { table_delete } from '../tables/tableGeneric/table_delete'
import DbKeySelect from './DbKeySelect'
import type { table_Routing } from '../tables/structures'
import { MyInput } from '../components/MyInput'
import { MyButton } from '../components/MyButton'
import { POSTGRES_URL_PREFIX } from '../constants'

const ROUTING_TABLE = 'xrtg_routing'

export default function OwnerRoutingMaintenance() {
  const functionName = 'OwnerRoutingMaintenance'

  const [routingRows, setRoutingRows] = useState<table_Routing[]>([])
  const [newTable, setNewTable] = useState('')
  const [newDbKey, setNewDbKey] = useState(POSTGRES_URL_PREFIX)
  const [routingMessage, setRoutingMessage] = useState('')
  const [editRtgid, setEditRtgid] = useState<number | null>(null)
  const [editTable, setEditTable] = useState('')
  const [editDbKey, setEditDbKey] = useState('')

  useEffect(() => {
    fetchRouting()
  }, [])

  return (
    <div className='p-4'>
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
          {routingRows.map(row => {
            const isEditing = editRtgid === row.rtg_rtgid
            return (
              <tr key={row.rtg_rtgid} className='border-b border-gray-100'>
                <td className='px-2'>{row.rtg_rtgid}</td>
                <td className='px-2'>
                  {isEditing ? (
                    <MyInput
                      overrideClass='w-40 text-xs'
                      value={editTable}
                      onChange={e => setEditTable(e.target.value)}
                    />
                  ) : (
                    row.rtg_table
                  )}
                </td>
                <td className='px-2'>
                  {isEditing ? (
                    <DbKeySelect overrideClass='w-40 text-xs' value={editDbKey} onChange={setEditDbKey} />
                  ) : (
                    row.rtg_dbkey
                  )}
                </td>
                <td className='px-2 flex gap-1'>
                  {isEditing ? (
                    <>
                      <MyButton overrideClass='text-xxs h-6 px-2' onClick={handleSaveEditRouting}>
                        Save
                      </MyButton>
                      <MyButton
                        overrideClass='bg-gray-400 hover:bg-gray-500 text-xxs h-6 px-2'
                        onClick={handleCancelEditRouting}
                      >
                        Cancel
                      </MyButton>
                    </>
                  ) : (
                    <>
                      <MyButton overrideClass='text-xxs h-6 px-2' onClick={() => handleEditRouting(row)}>
                        Edit
                      </MyButton>
                      <MyButton
                        overrideClass='bg-red-500 hover:bg-red-600 text-xxs h-6 px-2'
                        onClick={() => handleDeleteRouting(row)}
                      >
                        Delete
                      </MyButton>
                    </>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )

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
  //
  //  Params:
  //    row — the row to remove
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
  //  handleEditRouting — enter edit mode for a routing row
  //
  //  Params:
  //    row — the row to edit
  //----------------------------------------------------------------------------------------------
  function handleEditRouting(row: table_Routing) {
    setEditRtgid(row.rtg_rtgid)
    setEditTable(row.rtg_table)
    setEditDbKey(row.rtg_dbkey)
    setRoutingMessage('')
  }

  //----------------------------------------------------------------------------------------------
  //  handleCancelEditRouting — discard in-progress edits and exit edit mode
  //----------------------------------------------------------------------------------------------
  function handleCancelEditRouting() {
    setEditRtgid(null)
    setEditTable('')
    setEditDbKey('')
    setRoutingMessage('')
  }

  //----------------------------------------------------------------------------------------------
  //  handleSaveEditRouting — persist the in-progress edit for a routing row
  //----------------------------------------------------------------------------------------------
  async function handleSaveEditRouting() {
    if (editRtgid === null || !editTable || !editDbKey) return
    setRoutingMessage('Saving...')
    const result = await table_update({
      caller: functionName,
      table: ROUTING_TABLE,
      columnValuePairs: [
        { column: 'rtg_table', value: editTable },
        { column: 'rtg_dbkey', value: editDbKey }
      ],
      whereColumnValuePairs: [{ column: 'rtg_rtgid', value: editRtgid }]
    })
    if (!result.ok) {
      setRoutingMessage(`Error: ${result.error}`)
      return
    }
    setEditRtgid(null)
    setEditTable('')
    setEditDbKey('')
    setRoutingMessage('')
    await fetchRouting()
  }
}
