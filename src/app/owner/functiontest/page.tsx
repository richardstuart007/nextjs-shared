'use client'

//==============================================================================================
//  1) DESCRIPTION
//    FunctionTestPage — /owner/functiontest dev page. Exercises every tableGeneric function's
//    TableResult<T> contract, both the success path and an induced-failure path, so a change to
//    that contract can be verified end to end in one place instead of spot-checked per caller.
//==============================================================================================

import { useState } from 'react'
import { table_fetch } from '../../../tables/tableGeneric/table_fetch'
import { table_fetch_join } from '../../../tables/tableGeneric/table_fetch_join'
import { table_query } from '../../../tables/tableGeneric/table_query'
import { table_write } from '../../../tables/tableGeneric/table_write'
import { table_update } from '../../../tables/tableGeneric/table_update'
import { table_upsert } from '../../../tables/tableGeneric/table_upsert'
import { table_delete } from '../../../tables/tableGeneric/table_delete'
import { table_count } from '../../../tables/tableGeneric/table_count'
import { table_check } from '../../../tables/tableGeneric/table_check'
import { table_seqGet } from '../../../tables/tableGeneric/table_seq_get'
import { table_seqReset } from '../../../tables/tableGeneric/table_seq_reset'
import { table_duplicate } from '../../../tables/tableGeneric/table_duplicate'
import { table_drop } from '../../../tables/tableGeneric/table_drop'
import { table_truncate } from '../../../tables/tableGeneric/table_truncate'
import { table_copy_data } from '../../../tables/tableGeneric/table_copy_data'
import { fetchFiltered } from '../../../tables/tableGeneric/table_pages/fetchFiltered'
import { fetchTotalPages } from '../../../tables/tableGeneric/table_pages/fetchTotalPages'
import { fetchTotalRows } from '../../../tables/tableGeneric/table_pages/fetchTotalRows'
import { MyButton } from '../../../components/MyButton'

const SOURCE_TABLE = 'xrtg_routing'
const SCRATCH_TABLE = 'ttst_functiontest_scratch'
const BOGUS_TABLE = 'ttst_does_not_exist'

type TestOutcome = {
  name: string
  expectedOk: boolean
  actualOk: boolean
  pass: boolean
  detail: string
}

export default function FunctionTestPage() {
  const functionName = 'FunctionTestPage'
  const [results, setResults] = useState<TestOutcome[]>([])
  const [running, setRunning] = useState(false)

  const failCount = results.filter(r => !r.pass).length

  return (
    <div className='p-4'>
      <h2 className='text-lg font-semibold text-gray-800 mb-2'>Table Function Test</h2>
      <p className='text-xs text-gray-600 mb-3'>
        Exercises every tableGeneric function's TableResult&lt;T&gt; contract (success + induced
        failure) against a scratch table duplicated from xrtg_routing, then drops it.
      </p>
      <div className='flex items-center gap-3 mb-4'>
        <MyButton onClick={runTests} disabled={running}>
          {running ? 'Running...' : 'Run Tests'}
        </MyButton>
        {results.length > 0 && (
          <span className={failCount === 0 ? 'text-green-700 text-xs' : 'text-red-700 text-xs font-semibold'}>
            {results.length} tests, {failCount} failed
          </span>
        )}
      </div>
      <table className='text-xs'>
        <thead>
          <tr className='text-left'>
            <th className='px-2'>Function</th>
            <th className='px-2'>Expected</th>
            <th className='px-2'>Actual</th>
            <th className='px-2'>Pass</th>
            <th className='px-2'>Detail</th>
          </tr>
        </thead>
        <tbody>
          {results.map((r, i) => (
            <tr key={i} className={`border-b border-gray-100 ${r.pass ? '' : 'bg-red-50'}`}>
              <td className='px-2'>{r.name}</td>
              <td className='px-2'>{r.expectedOk ? 'ok' : 'fail'}</td>
              <td className='px-2'>{r.actualOk ? 'ok' : 'fail'}</td>
              <td className='px-2'>{r.pass ? 'PASS' : 'FAIL'}</td>
              <td className='px-2'>{r.detail}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )

  //----------------------------------------------------------------------------------------------
  //  runTests — sequential run: a scratch table is duplicated from xrtg_routing, exercised by
  //  every write/read function, then dropped — so no permanent data is touched
  //----------------------------------------------------------------------------------------------
  async function runTests() {
    setRunning(true)
    const list: TestOutcome[] = []

    //
    //  table_duplicate — creates the scratch table every later test relies on
    //
    const dupOk = await table_duplicate({ table_from: SOURCE_TABLE, table_to: SCRATCH_TABLE, caller: functionName })
    record(list, 'table_duplicate (success)', true, dupOk)
    const dupFail = await table_duplicate({ table_from: BOGUS_TABLE, table_to: 'ttst_functiontest_scratch_fail', caller: functionName })
    record(list, 'table_duplicate (failure)', false, dupFail)

    if (dupOk.ok) {
      //
      //  table_write
      //
      const writeOk = await table_write({
        caller: functionName,
        table: SCRATCH_TABLE,
        columnValuePairs: [
          { column: 'rtg_table', value: 'func-test-write' },
          { column: 'rtg_dbkey', value: 'func-test' }
        ]
      })
      record(list, 'table_write (success)', true, writeOk)
      const writeFail = await table_write({
        caller: functionName,
        table: BOGUS_TABLE,
        columnValuePairs: [{ column: 'x', value: 1 }]
      })
      record(list, 'table_write (failure)', false, writeFail)

      const insertedId = writeOk.ok ? writeOk.data[0]?.rtg_rtgid : null

      //
      //  table_fetch
      //
      record(list, 'table_fetch (success)', true, await table_fetch({ caller: functionName, table: SCRATCH_TABLE }))
      record(list, 'table_fetch (failure)', false, await table_fetch({ caller: functionName, table: BOGUS_TABLE }))

      //
      //  table_fetch_join
      //
      record(list, 'table_fetch_join (success)', true, await table_fetch_join({ caller: functionName, table: SCRATCH_TABLE, joins: [] }))
      record(list, 'table_fetch_join (failure)', false, await table_fetch_join({ caller: functionName, table: BOGUS_TABLE, joins: [] }))

      //
      //  table_query
      //
      record(list, 'table_query (success)', true, await table_query({ caller: functionName, query: 'SELECT 1 as one' }))
      record(list, 'table_query (failure)', false, await table_query({ caller: functionName, query: `SELECT * FROM ${BOGUS_TABLE}` }))

      //
      //  table_update / table_upsert / table_delete — need the inserted row's id
      //
      if (insertedId) {
        const updateOk = await table_update({
          caller: functionName,
          table: SCRATCH_TABLE,
          columnValuePairs: [{ column: 'rtg_dbkey', value: 'func-test-updated' }],
          whereColumnValuePairs: [{ column: 'rtg_rtgid', value: insertedId }]
        })
        record(list, 'table_update (success)', true, updateOk)
      }
      const updateFail = await table_update({
        caller: functionName,
        table: BOGUS_TABLE,
        columnValuePairs: [{ column: 'x', value: 1 }],
        whereColumnValuePairs: [{ column: 'x', value: 1 }]
      })
      record(list, 'table_update (failure)', false, updateFail)

      if (insertedId) {
        const upsertOk = await table_upsert({
          caller: functionName,
          table: SCRATCH_TABLE,
          columnValuePairs: [
            { column: 'rtg_rtgid', value: insertedId },
            { column: 'rtg_table', value: 'func-test-write' },
            { column: 'rtg_dbkey', value: 'func-test-upserted' }
          ],
          conflictColumns: ['rtg_rtgid']
        })
        record(list, 'table_upsert (success)', true, upsertOk)
      }
      const upsertFail = await table_upsert({
        caller: functionName,
        table: BOGUS_TABLE,
        columnValuePairs: [{ column: 'x', value: 1 }],
        conflictColumns: ['x']
      })
      record(list, 'table_upsert (failure)', false, upsertFail)

      if (insertedId) {
        const deleteOk = await table_delete({
          caller: functionName,
          table: SCRATCH_TABLE,
          whereColumnValuePairs: [{ column: 'rtg_rtgid', value: insertedId }]
        })
        record(list, 'table_delete (success)', true, deleteOk)
      }
      const deleteFail = await table_delete({
        caller: functionName,
        table: BOGUS_TABLE,
        whereColumnValuePairs: [{ column: 'x', value: 1 }]
      })
      record(list, 'table_delete (failure)', false, deleteFail)

      //
      //  table_count
      //
      record(list, 'table_count (success)', true, await table_count({ caller: functionName, table: SCRATCH_TABLE }))
      record(list, 'table_count (failure)', false, await table_count({ caller: functionName, table: BOGUS_TABLE }))

      //
      //  table_check
      //
      record(
        list,
        'table_check (success)',
        true,
        await table_check([{ table: SCRATCH_TABLE, whereColumnValuePairs: [{ column: 'rtg_rtgid', value: -1 }] }], functionName)
      )
      record(
        list,
        'table_check (failure)',
        false,
        await table_check([{ table: BOGUS_TABLE, whereColumnValuePairs: [{ column: 'x', value: 1 }] }], functionName)
      )

      //
      //  table_seqGet / table_seqReset
      //
      record(list, 'table_seqGet (success)', true, await table_seqGet({ tableName: SCRATCH_TABLE, caller: functionName }))
      record(list, 'table_seqGet (failure)', false, await table_seqGet({ tableName: BOGUS_TABLE, caller: functionName }))
      record(list, 'table_seqReset (success)', true, await table_seqReset({ tableName: SCRATCH_TABLE, caller: functionName }))
      record(list, 'table_seqReset (failure)', false, await table_seqReset({ tableName: BOGUS_TABLE, caller: functionName }))

      //
      //  fetchFiltered / fetchTotalPages / fetchTotalRows
      //
      record(list, 'fetchFiltered (success)', true, await fetchFiltered({ caller: functionName, table: SCRATCH_TABLE }))
      record(list, 'fetchFiltered (failure)', false, await fetchFiltered({ caller: functionName, table: BOGUS_TABLE }))
      record(list, 'fetchTotalPages (success)', true, await fetchTotalPages({ caller: functionName, table: SCRATCH_TABLE }))
      record(list, 'fetchTotalPages (failure)', false, await fetchTotalPages({ caller: functionName, table: BOGUS_TABLE }))
      record(list, 'fetchTotalRows (success)', true, await fetchTotalRows({ caller: functionName, table: SCRATCH_TABLE }))
      record(list, 'fetchTotalRows (failure)', false, await fetchTotalRows({ caller: functionName, table: BOGUS_TABLE }))

      //
      //  table_copy_data
      //
      record(list, 'table_copy_data (success)', true, await table_copy_data({ table_from: SOURCE_TABLE, table_to: SCRATCH_TABLE, caller: functionName }))
      record(list, 'table_copy_data (failure)', false, await table_copy_data({ table_from: BOGUS_TABLE, table_to: SCRATCH_TABLE, caller: functionName }))

      //
      //  table_truncate
      //
      record(list, 'table_truncate (success)', true, await table_truncate(SCRATCH_TABLE, functionName))
      record(list, 'table_truncate (failure)', false, await table_truncate(BOGUS_TABLE, functionName))

      //
      //  table_drop — final cleanup of the scratch table
      //
      record(list, 'table_drop (success)', true, await table_drop(SCRATCH_TABLE, functionName))
    }
    record(list, 'table_drop (failure)', false, await table_drop(BOGUS_TABLE, functionName))

    setResults(list)
    setRunning(false)
  }

  //----------------------------------------------------------------------------------------------
  //  record — build one TestOutcome from a TableResult and the expected ok value
  //
  //  Params:
  //    list       — the results array to push onto
  //    name       — the test's display name
  //    expectedOk — whether this call was expected to succeed
  //    result     — the TableResult returned by the call under test
  //----------------------------------------------------------------------------------------------
  function record(
    list: TestOutcome[],
    name: string,
    expectedOk: boolean,
    result: { ok: boolean; error: string | null }
  ) {
    list.push({
      name,
      expectedOk,
      actualOk: result.ok,
      pass: result.ok === expectedOk,
      detail: result.error ?? 'OK'
    })
  }
}
