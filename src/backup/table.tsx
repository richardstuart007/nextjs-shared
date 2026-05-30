'use client'

import { useState, useEffect } from 'react'
import { MyConfirmDialog, ConfirmDialogInt } from '../components/MyConfirmDialog'
import { fetchFiltered } from '../tables/tableGeneric/table_pages/fetchFiltered'
import { fetchTotalPages } from '../tables/tableGeneric/table_pages/fetchTotalPages'
import type { Filter } from '../tables/structures'
import { table_duplicate } from '../tables/tableGeneric/table_duplicate'
import { table_copy_data } from '../tables/tableGeneric/table_copy_data'
import { table_truncate } from '../tables/tableGeneric/table_truncate'
import { table_count } from '../tables/tableGeneric/table_count'
import { table_drop } from '../tables/tableGeneric/table_drop'
import MyPagination from '../components/MyPagination'
import { MyButton } from '../components/MyButton'
import { MyInput } from '../components/MyInput'
import { table_seqReset } from '../tables/tableGeneric/table_seq_reset'
import {
  table_write_toJSON,
  directory_list,
  table_write_fromJSON,
  file_count_json
} from './backupUtils'

const ROWS_PER_PAGE = 50

export default function Table({ tables }: { tables: string[] }) {
  //
  //  Constants
  //
  const schemaname = 'public'
  const backupStartChar = 'z'
  const dirPathPrefix = 'C:/backups/'
  //
  //  Base Data
  //
  const [currentPage, setcurrentPage] = useState(1)
  const [tabledata, settabledata] = useState<string[]>(tables)
  const [tabledata_count, settabledata_count] = useState<number[]>([])
  const [totalPages, setTotalPages] = useState<number>(0)
  //
  //  Backups
  //
  const [tabledata_Z, settabledata_Z] = useState<string[]>([])
  const [tabledata_count_Z, settabledata_count_Z] = useState<number[]>([])
  const [exists_Z, setexists_Z] = useState<boolean[]>([])
  const [prefix_Z, setprefix_Z] = useState<string>('1')
  //
  //  Downloads
  //
  const [dataDirectory, setDataDirectory] = useState('')
  const [exists_D, setexists_D] = useState<boolean[]>([])
  const [tabledata_count_D, settabledata_count_D] = useState<number[]>([])
  //
  //  Messages
  //
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogInt>({
    isOpen: false,
    title: '',
    subTitle: '',
    onConfirm: () => {}
  })
  const [message, setmessage] = useState<string>('')
  //...................................................................................
  //
  // Adjust currentPage if it exceeds totalPages
  //
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setcurrentPage(totalPages)
    }
  }, [currentPage, totalPages])
  //...................................................................................
  //
  //  Update Base — fires on page navigation or tab switch
  //  Pass activeTables explicitly to avoid stale closure reading the old tab's list
  //
  useEffect(() => {
    fetchTables({
      mode: 'base',
      setTableDataFn: settabledata,
      setTableDataCountFn: settabledata_count,
      setTotalPagesFn: setTotalPages,
      tables: tables
    })
  }, [currentPage])
  //----------------------------------------------------------------------------------------------
  //  Fetch tables & update counts/exist
  //----------------------------------------------------------------------------------------------
  async function fetchTables({
    mode,
    setTableDataFn,
    setTableDataCountFn,
    setTotalPagesFn,
    setExistsFn,
    tables
  }: {
    mode: 'base' | 'backup'
    setTableDataFn: (data: string[]) => void
    setTableDataCountFn: (data: number[]) => void
    setTotalPagesFn?: (data: number) => void
    setExistsFn?: (data: boolean[]) => void
    tables?: string[]
  }) {
    const functionName = `fetch${mode}`
    try {
      setmessage(`Starting.... ${functionName}`)

      // Use explicitly-passed list (avoids stale closure), fall back to state
      const baseList = tables ?? tabledata
      const tableList =
        mode === 'base'
          ? baseList
          : baseList.map(baseTable => `${backupStartChar}${prefix_Z}_${baseTable}`)

      // Construct filters
      const filtersToUpdate: Filter[] = [
        { column: 'schemaname', value: schemaname, operator: '=' },
        { column: 'tablename', operator: 'IN', value: tableList }
      ]

      // Remove empty filters
      const updatedFilters = filtersToUpdate.filter(filter => filter.value)

      // Fetch filtered data
      const offset = (currentPage - 1) * ROWS_PER_PAGE
      const [filtered, totalPages] =
        mode === 'base'
          ? await Promise.all([
              fetchFiltered({
                caller: functionName,
                table: 'pg_tables',
                filters: updatedFilters,
                orderBy: 'tablename',
                limit: ROWS_PER_PAGE,
                offset,
                skipCache: true
              }),
              fetchTotalPages({
                caller: functionName,
                table: 'pg_tables',
                filters: updatedFilters,
                items_per_page: ROWS_PER_PAGE,
                skipCache: true
              })
            ])
          : [
              await fetchFiltered({
                caller: functionName,
                table: 'pg_tables',
                filters: updatedFilters,
                orderBy: 'tablename',
                limit: ROWS_PER_PAGE,
                offset,
                skipCache: true
              }),
              undefined
            ]

      let tableData: string[]
      let rowCounts: number[]

      if (mode === 'base') {
        // Base mode: use alphabetically-sorted results from pg_tables
        tableData = filtered.map(row => row?.tablename).filter(Boolean)
        rowCounts = await Promise.all(
          tableData.map(async row => {
            if (!row) return 0
            const count = await table_count({ table: row, caller: functionName })
            return count || 0
          })
        )
      } else {
        // Backup mode: keep arrays aligned with tableList (= base table order with z_ prefix)
        // so that tabledata_Z[i] and tabledata_count_Z[i] always correspond to tabledata[i]
        const exists = tableList.map(table => filtered.some(row => row?.tablename === table))
        tableData = [...tableList]
        rowCounts = await Promise.all(
          tableList.map(async (tableName, i) => {
            if (!exists[i]) return 0
            const count = await table_count({ table: tableName, caller: functionName })
            return count || 0
          })
        )
        if (setExistsFn) setExistsFn(exists)
      }

      // Update state
      setTableDataFn(tableData)
      setTableDataCountFn(rowCounts)
      if (mode === 'base' && setTotalPagesFn && totalPages !== undefined) {
        setTotalPagesFn(totalPages)
      }

      setmessage(`Task ${functionName} completed`)
    } catch (error) {
      const errorMessage = `Error in ${functionName}`
      console.error(errorMessage, error)
      setmessage(errorMessage)
    }
  }
  //----------------------------------------------------------------------------------------------
  //  Fetch download file
  //----------------------------------------------------------------------------------------------
  async function fetchdirectory() {
    const functionName = 'fetchdirectory'
    try {
      setmessage(`Starting.... ${functionName}`)
      const dirPath = `${dirPathPrefix}${dataDirectory}`
      const dirTables = await directory_list(dirPath, functionName)
      const strippedDirTables = dirTables.map(table => table.replace('.json', ''))
      const exists = tabledata.map(table => strippedDirTables.includes(table))
      setexists_D(exists)
      const counts = await Promise.all(
        tabledata.map(async (table, i) => {
          if (!exists[i]) return 0
          return file_count_json(`${dirPath}/${table}.json`, functionName)
        })
      )
      settabledata_count_D(counts)
      setmessage(`Task ${functionName} completed`)
    } catch (error) {
      const errorMessage = `Error in ${functionName}`
      console.error(errorMessage, error)
      setmessage(errorMessage)
    }
  }
  //----------------------------------------------------------------------------------------------
  //  Perform the Duplicate
  //----------------------------------------------------------------------------------------------
  async function performDup(tablebase: string, tablebackup: string, many: boolean = false) {
    const functionName = 'performDup'
    try {
      if (!many) setConfirmDialog(prev => ({ ...prev, isOpen: false }))
      setmessage(`performDup from ${tablebase} to ${tablebackup}`)
      const index = tabledata.findIndex(row => row === tablebase)
      if (exists_Z[index]) return
      await table_duplicate({ table_from: tablebase, table_to: tablebackup, caller: functionName })
      if (!many) {
        updexists_Z(index, true)
        updcount_Z(index, 0)
      }
      if (!many) setmessage(`Task ${functionName} completed`)
    } catch (error) {
      const errorMessage = `Error in ${functionName}`
      console.error(errorMessage, error)
      setmessage(errorMessage)
    }
  }
  //----------------------------------------------------------------------------------------------
  //  Perform the Copy
  //----------------------------------------------------------------------------------------------
  async function performCopy(tablebase: string, tablebackup: string, many: boolean = false) {
    const functionName = 'performCopy'
    try {
      if (!many) setConfirmDialog(prev => ({ ...prev, isOpen: false }))
      setmessage(`Copy Data from (${tablebase}) to (${tablebackup})`)
      const index = tabledata_Z.findIndex(row => row === tablebackup)
      if (!exists_Z[index] || tabledata_count[index] === 0) return
      await table_copy_data({ table_from: tablebase, table_to: tablebackup, caller: functionName })
      if (!many) updcount_Z(index, tabledata_count[index])
      if (!many) setmessage(`Task ${functionName} completed`)
    } catch (error) {
      const errorMessage = `Error in ${functionName}`
      console.error(errorMessage, error)
      setmessage(errorMessage)
    }
  }
  //----------------------------------------------------------------------------------------------
  //  Perform the Clear
  //----------------------------------------------------------------------------------------------
  async function performClear(tablebackup: string, many: boolean = false) {
    const functionName = 'performClear'
    try {
      if (!many) setConfirmDialog(prev => ({ ...prev, isOpen: false }))
      setmessage(`CLEAR (${tablebackup})`)
      const index = tabledata_Z.findIndex(row => row === tablebackup)
      if (!exists_Z[index] || tabledata_count_Z[index] === 0) return
      await table_truncate(tablebackup, functionName)
      if (!many) updcount_Z(index, 0)
      if (!many) setmessage(`CLEAR (${tablebackup}) - completed`)
    } catch (error) {
      const errorMessage = `Error in ${functionName}`
      console.error(errorMessage, error)
      setmessage(errorMessage)
    }
  }
  //----------------------------------------------------------------------------------------------
  //  Perform the Drop
  //----------------------------------------------------------------------------------------------
  async function performDrop(tablebackup: string, many: boolean = false) {
    const functionName = 'performDrop'
    try {
      if (!many) setConfirmDialog(prev => ({ ...prev, isOpen: false }))
      setmessage(`DROP (${tablebackup})`)
      const index = tabledata_Z.findIndex(row => row === tablebackup)
      if (!exists_Z[index]) return
      await table_drop(tablebackup, functionName)
      if (!many) {
        updexists_Z(index, false)
        updcount_Z(index, 0)
      }
      if (!many) setmessage(`DROP (${tablebackup}) - completed`)
    } catch (error) {
      const errorMessage = `Error in ${functionName}`
      console.error(errorMessage, error)
      setmessage(errorMessage)
    }
  }
  //----------------------------------------------------------------------------------------------
  //  Perform the Down
  //----------------------------------------------------------------------------------------------
  async function performDown(tablebase: string, tabledown: string, many: boolean = false) {
    const functionName = 'performDown'
    try {
      if (!many) setConfirmDialog(prev => ({ ...prev, isOpen: false }))
      setmessage(`Download Data from (${tablebase}) to (${tabledown})`)
      const index = tabledata.findIndex(row => row === tablebase)
      if (tabledata_count[index] === 0) return
      const dirPath = `${dirPathPrefix}${dataDirectory}`
      await table_write_toJSON(
        { table: tablebase, dirPath: dirPath, file_out: tabledown },
        functionName
      )
      if (!many) updexists_D(index, true)
      if (!many) setmessage(`Task ${functionName} completed`)
    } catch (error) {
      const errorMessage = `Error in ${functionName}`
      console.error(errorMessage, error)
      setmessage(errorMessage)
    }
  }
  //----------------------------------------------------------------------------------------------
  //  Perform the Upload
  //----------------------------------------------------------------------------------------------
  async function performUpload(filePath: string, tablebackup: string, many: boolean = false) {
    const functionName = 'performUpload'
    try {
      if (!many) setConfirmDialog(prev => ({ ...prev, isOpen: false }))
      const index = tabledata_Z.findIndex(row => row === tablebackup)
      setmessage(`Upload Data from (${filePath}) to (${tablebackup})`)
      const count = await table_write_fromJSON(filePath, tablebackup)
      await table_seqReset({ tableName: tablebackup, caller: functionName })
      if (!many) updcount_Z(index, count)
      if (!many) setmessage(`Task ${functionName} completed`)
    } catch (error) {
      const errorMessage = `Error in ${functionName}`
      console.error(errorMessage, error)
      setmessage(errorMessage)
    }
  }
  //----------------------------------------------------------------------------------------------
  //  Perform the ToBase
  //----------------------------------------------------------------------------------------------
  async function performToBase(tablebackup: string, tablebase: string, many: boolean = false) {
    const functionName = 'performToBase'
    try {
      if (!many) setConfirmDialog(prev => ({ ...prev, isOpen: false }))
      setmessage(`Copy Data from (${tablebackup}) to (${tablebase})`)
      const index = tabledata_Z.findIndex(row => row === tablebackup)
      if (!exists_Z[index] || tabledata_count_Z[index] === 0) return
      await table_truncate(tablebase, functionName)
      await table_copy_data({ table_from: tablebackup, table_to: tablebase, caller: functionName })
      await table_seqReset({ tableName: tablebase, caller: functionName })
      if (!many) updcount(index, tabledata_count_Z[index])
      if (!many) setmessage(`Task ${functionName} completed`)
    } catch (error) {
      const errorMessage = `Error in ${functionName}`
      console.error(errorMessage, error)
      setmessage(errorMessage)
    }
  }
  //----------------------------------------------------------------------------------------------
  //  Perform the Seq Reset
  //----------------------------------------------------------------------------------------------
  async function performSeqReset(tablebase: string, many: boolean = false) {
    const functionName = 'performSeqReset'
    try {
      if (!many) setConfirmDialog(prev => ({ ...prev, isOpen: false }))
      setmessage(`Sequence Reset Data from (${tablebase})`)
      await table_seqReset({ tableName: tablebase, caller: functionName })
      if (!many) setmessage(`Task ${functionName} completed`)
    } catch (error) {
      const errorMessage = `Error in ${functionName}`
      console.error(errorMessage, error)
      setmessage(errorMessage)
    }
  }
  //----------------------------------------------------------------------------------------------
  //  Update count_Z
  //----------------------------------------------------------------------------------------------
  function updcount_Z(index: number, value: number) {
    settabledata_count_Z(prev => {
      const updatedCount = [...prev]
      updatedCount[index] = value
      return updatedCount
    })
  }
  //----------------------------------------------------------------------------------------------
  //  Update count
  //----------------------------------------------------------------------------------------------
  function updcount(index: number, value: number) {
    settabledata_count(prev => {
      const updatedCount = [...prev]
      updatedCount[index] = value
      return updatedCount
    })
  }
  //----------------------------------------------------------------------------------------------
  //  Update exists_Z
  //----------------------------------------------------------------------------------------------
  function updexists_Z(index: number, value: boolean) {
    setexists_Z(prev => {
      const updateexists = [...prev]
      updateexists[index] = value
      return updateexists
    })
  }
  //----------------------------------------------------------------------------------------------
  //  Update exists_D
  //----------------------------------------------------------------------------------------------
  function updexists_D(index: number, value: boolean) {
    setexists_D(prev => {
      const updateexists = [...prev]
      updateexists[index] = value
      return updateexists
    })
  }
  //----------------------------------------------------------------------------------------------
  //  Run against ALL values
  //----------------------------------------------------------------------------------------------
  interface Props_Click_ALL {
    routine: string
  }

  function handleRunClick_ALL({ routine }: Props_Click_ALL) {
    let title = ''
    let subTitle = ''
    const dirPath = `${dirPathPrefix}${dataDirectory}`
    switch (routine) {
      case 'DUP':
        title = 'DUPLICATE for ALL'
        subTitle = `Duplicate from BASE to BACKUP`
        break
      case 'CLEAR':
        title = 'CLEAR for ALL'
        subTitle = `Clear BACKUP`
        break
      case 'COPY':
        title = 'COPY for ALL'
        subTitle = `Copy from BASE to BACKUP`
        break
      case 'DROP':
        title = 'DROP for ALL'
        subTitle = `Drop BACKUP`
        break
      case 'TOBASE':
        title = 'COPY for ALL to ToBase'
        subTitle = `Copy from BACKUP to BASE`
        break
      case 'SEQRESET':
        title = 'RESET SEQUENCE for ALL'
        subTitle = `Reset Sequence on BASE`
        break
      case 'DOWN':
        title = 'DOWN for ALL'
        subTitle = `Down from BASE to ${dirPath}`
        break
      case 'UPLOAD':
        title = 'UPLOAD for ALL'
        subTitle = `Upload from directory ${dirPath} to BACKUP`
        break
      default:
        break
    }
    setConfirmDialog({
      isOpen: true,
      title: title,
      subTitle: subTitle,
      onConfirm: () => perform_Run_ALL({ routine })
    })
  }
  //----------------------------------------------------------------------------------------------
  //  Perform the Run ALL
  //----------------------------------------------------------------------------------------------
  interface Props_Run_all {
    routine: string
  }

  async function perform_Run_ALL({ routine }: Props_Run_all) {
    const functionName = 'perform_Run_ALL'
    setConfirmDialog(prev => ({ ...prev, isOpen: false }))
    try {
      const promises = tabledata.map((tablebase, index) => {
        const tablebase_count = tabledata_count[index]
        const tablebackup = `${backupStartChar}${prefix_Z}_${tablebase}`
        const tablebackup_exists = exists_Z[index]
        const tablebackup_count = tabledata_count_Z[index]
        return perform_Run1({
          routine,
          tablebase,
          tablebase_count,
          tablebackup,
          tablebackup_count,
          tablebackup_exists,
          many: true
        })
      })
      await Promise.all(promises)
      await Promise.all([
        fetchTables({
          mode: 'base',
          setTableDataFn: settabledata,
          setTableDataCountFn: settabledata_count,
          setTotalPagesFn: setTotalPages
        }),
        fetchTables({
          mode: 'backup',
          setTableDataFn: settabledata_Z,
          setTableDataCountFn: settabledata_count_Z,
          setExistsFn: setexists_Z
        }),
        ...(routine === 'DOWN' && dataDirectory ? [fetchdirectory()] : [])
      ])
      setmessage(`Task ${functionName} routine(${routine}) completed`)
    } catch (error) {
      const errorMessage = `Error in ${functionName} routine(${routine})`
      console.error(errorMessage, error)
      setmessage(errorMessage)
    }
  }
  //----------------------------------------------------------------------------------------------
  //  Perform click
  //----------------------------------------------------------------------------------------------
  interface Props_Click1 {
    routine: string
    tablebase: string
    index: number
  }

  function handleRunClick1({ routine, tablebase, index }: Props_Click1) {
    let title = ''
    let subTitle = ''
    let line1: string | undefined
    let line2: string | undefined
    let line3: string | undefined
    let line4: string | undefined
    const tablebase_count = tabledata_count[index]
    const tablebackup = `${backupStartChar}${prefix_Z}_${tablebase}`
    const tablebackup_exists = exists_Z[index]
    const tablebackup_count = tabledata_count_Z[index]
    const tabledown = `${tablebase}.json`
    const dirPath = `${dirPathPrefix}${dataDirectory}`

    switch (routine) {
      case 'DUP':
        title = 'DUPLICATE'
        subTitle = `Database to Backup`
        line1 = `FROM`
        line2 = `${tablebase}`
        line3 = `TO`
        line4 = `${tablebackup}`
        break
      case 'CLEAR':
        title = 'CLEAR'
        subTitle = `Backup`
        line1 = `${tablebackup}`
        break
      case 'COPY':
        title = 'COPY'
        subTitle = `Database to Backup`
        line1 = `FROM`
        line2 = `${tablebase}`
        line3 = `TO`
        line4 = `${tablebackup}`
        break
      case 'DROP':
        title = 'DROP'
        subTitle = `Backup`
        line1 = `${tablebackup}`
        break
      case 'TOBASE':
        title = 'TOBASE'
        subTitle = `Copy Backup to Database`
        line1 = `FROM`
        line2 = `${tablebackup}`
        line3 = `TO`
        line4 = `${tablebase}`
        break
      case 'SEQRESET':
        title = 'SEQRESET'
        subTitle = `Database`
        line1 = `${tablebase}`
        break
      case 'DOWN':
        title = 'DOWNLOAD'
        subTitle = `Download in JSON format from Database to Directory`
        line1 = `FROM`
        line2 = `${tablebase}`
        line3 = `TO`
        line4 = `${dirPath}/${tabledown}`
        break
      case 'UPLOAD':
        title = 'UPLOAD'
        subTitle = `Upload JSON from Directory to Backup`
        line1 = `FROM`
        line2 = `${dirPath}/${tabledown}`
        line3 = `TO`
        line4 = `${tablebackup}`
        break
      default:
        break
    }
    setConfirmDialog({
      isOpen: true,
      title: title,
      subTitle: subTitle,
      line1,
      line2,
      line3,
      line4,
      onConfirm: () =>
        perform_Run1({
          routine,
          tablebase,
          tablebase_count,
          tablebackup,
          tablebackup_count,
          tablebackup_exists
        })
    })
  }
  //----------------------------------------------------------------------------------------------
  //  Perform the Run 1
  //----------------------------------------------------------------------------------------------
  interface Props_run {
    routine: string
    tablebase: string
    tablebase_count: number
    tablebackup_exists: boolean
    tablebackup: string
    tablebackup_count: number
    many?: boolean
  }

  async function perform_Run1({
    routine,
    tablebase,
    tablebase_count,
    tablebackup_exists,
    tablebackup,
    tablebackup_count,
    many = false
  }: Props_run) {
    const functionName = 'perform_Run1'
    try {
      switch (routine) {
        case 'DUP':
          if (!tablebackup_exists) {
            return performDup(tablebase, tablebackup, many)
          }
          break
        case 'CLEAR':
          if (tablebackup_exists && tablebackup_count > 0) {
            return performClear(tablebackup, many)
          }
          break
        case 'COPY':
          if (tablebackup_exists && tablebase_count > 0) {
            if (tablebackup_count > 0) {
              await performClear(tablebackup, many)
            }
            return performCopy(tablebase, tablebackup, many)
          }
          break
        case 'DROP':
          if (tablebackup_exists) {
            return performDrop(tablebackup, many)
          }
          break
        case 'TOBASE':
          if (tablebackup_exists && tablebackup_count > 0) {
            return performToBase(tablebackup, tablebase, many)
          }
          break
        case 'SEQRESET':
          return performSeqReset(tablebase, many)
        case 'DOWN':
          if (tablebase_count > 0) {
            const tabledown = `${tablebase}.json`
            return performDown(tablebase, tabledown, many)
          }
          break
        case 'UPLOAD':
          if (tablebackup_exists) {
            if (tablebackup_count > 0) {
              await performClear(tablebackup, many)
            }
            const tableUpload = `${tablebase}.json`
            const filePath = `${dirPathPrefix}${dataDirectory}/${tableUpload}`
            return performUpload(filePath, tablebackup, many)
          }
          break
        default:
          return Promise.resolve()
      }
    } catch (error) {
      const errorMessage = `Error in ${functionName} routine(${routine})`
      console.error(errorMessage, error)
      setmessage(errorMessage)
    }
  }
  //----------------------------------------------------------------------------------------------
  // Render table header row 1
  //----------------------------------------------------------------------------------------------
  function render_tr1() {
    return (
      <tr>
        <th className='pb-2 px-2' colSpan={3}>
          <div className='font-bold rounded-md border border-blue-500 py-1 text-center'>
            Postgres Base Tables
          </div>
        </th>
        <th className='pb-2 px-2' colSpan={8}>
          <div className='font-bold rounded-md border border-blue-500 py-1 text-center'>
            Postgres Backup Tables
          </div>
        </th>
        <th className='pb-2 px-2' colSpan={4}>
          <div className='font-bold rounded-md border border-blue-500 py-1 text-center'>
            {`PC Folder (${dirPathPrefix}${dataDirectory})`}
          </div>
        </th>
        <th></th>
      </tr>
    )
  }
  //----------------------------------------------------------------------------------------------
  // Render table header row 2
  //----------------------------------------------------------------------------------------------
  function render_tr2() {
    return (
      <tr>
        <th scope='col' className='text-xs   px-2'>Table</th>
        <th scope='col' className='text-xs   px-2 text-right'>Records</th>
        <th scope='col' className='text-xs   px-2 text-center'>Reset</th>
        <th scope='col' className='text-xs   px-2'>Table</th>
        <th scope='col' className='text-xs   px-2 text-center'>Exists</th>
        <th scope='col' className='text-xs   px-2 text-right'>Records</th>
        <th scope='col' className='text-xs   px-2 text-center'>Drop</th>
        <th scope='col' className='text-xs   px-2 text-center'>Duplicate</th>
        <th scope='col' className='text-xs   px-2 text-center'>Clear</th>
        <th scope='col' className='text-xs   px-2 text-center'>Copy</th>
        <th scope='col' className='text-xs   px-2 text-center'>ToBase</th>
        <th scope='col' className='text-xs  px-2 text-center'>
          <MyInput
            id='dataDirectory'
            name='dataDirectory'
            overrideClass={`w-28 text-center`}
            type='text'
            value={dataDirectory}
            onChange={e => setDataDirectory(e.target.value)}
          />
        </th>
        <th scope='col' className='text-xs   px-2 text-center'>Exists</th>
        <th scope='col' className='text-xs   px-2 text-right'>Records</th>
        <th scope='col' className='text-xs   px-2 text-center'>Upload</th>
      </tr>
    )
  }
  //----------------------------------------------------------------------------------------------
  // Render table header row 3
  //----------------------------------------------------------------------------------------------
  function render_tr3() {
    return (
      <tr className=' align-bottom'>
        <th scope='col' className='text-xs  px-2'></th>
        <th scope='col' className='text-xs   px-2 text-right'>
          <div className='inline-flex justify-center items-center'>
            <MyButton
              onClick={() =>
                fetchTables({
                  mode: 'base',
                  setTableDataFn: settabledata,
                  setTableDataCountFn: settabledata_count,
                  setTotalPagesFn: setTotalPages
                })
              }
              overrideClass='h-6 px-2 py-2  bg-red-500 hover:bg-red-600'
            >
              Refresh
            </MyButton>
          </div>
        </th>
        <th scope='col' className='text-xs   px-2 text-center'>
          <div className='inline-flex justify-center items-center'>
            <MyButton
              onClick={() => handleRunClick_ALL({ routine: 'SEQRESET' })}
              overrideClass='h-6 px-2 py-2  bg-red-500 hover:bg-red-600'
            >
              SeqReset
            </MyButton>
          </div>
        </th>
        <th scope='col' className='text-xs  px-2 text-left'>
          <MyInput
            id='prefixZ'
            name='prefixZ'
            overrideClass={`w-20 `}
            type='text'
            value={prefix_Z}
            onChange={e => setprefix_Z(e.target.value)}
          />
        </th>
        <th scope='col' className='text-xs   px-2 text-center'>
          <div className='inline-flex justify-center items-center'>
            <MyButton
              onClick={() =>
                fetchTables({
                  mode: 'backup',
                  setTableDataFn: settabledata_Z,
                  setTableDataCountFn: settabledata_count_Z,
                  setExistsFn: setexists_Z
                })
              }
              overrideClass='h-6 px-2 py-2  bg-red-500 hover:bg-red-600'
            >
              Refresh
            </MyButton>
          </div>
        </th>
        <th scope='col' className='text-xs px-2'></th>
        <th scope='col' className='text-xs   px-2 text-center'>
          {tabledata_Z.length > 0 && (
            <div className='inline-flex justify-center items-center'>
              <MyButton
                onClick={() => handleRunClick_ALL({ routine: 'DROP' })}
                overrideClass='h-6 px-2 py-2  bg-red-500 hover:bg-red-600'
              >
                Drop ALL
              </MyButton>
            </div>
          )}
        </th>
        <th scope='col' className='text-xs   px-2 text-center'>
          {!exists_Z.some(value => value) && (
            <div className='inline-flex justify-center items-center'>
              <MyButton
                onClick={() => handleRunClick_ALL({ routine: 'DUP' })}
                overrideClass='h-6 px-2 py-2  bg-red-500 hover:bg-red-600'
              >
                Dup ALL
              </MyButton>
            </div>
          )}
        </th>
        <th scope='col' className='text-xs   px-2 text-center'>
          {tabledata_Z.length > 0 && (
            <div className='inline-flex justify-center items-center'>
              <MyButton
                onClick={() => handleRunClick_ALL({ routine: 'CLEAR' })}
                overrideClass='h-6 px-2 py-2  bg-red-500 hover:bg-red-600'
              >
                Clear ALL
              </MyButton>
            </div>
          )}
        </th>
        <th scope='col' className='text-xs   px-2 text-center'>
          {tabledata_Z.length > 0 && (
            <div className='inline-flex justify-center items-center'>
              <MyButton
                onClick={() => handleRunClick_ALL({ routine: 'COPY' })}
                overrideClass='h-6 px-2 py-2  bg-red-500 hover:bg-red-600'
              >
                Copy ALL
              </MyButton>
            </div>
          )}
        </th>
        <th scope='col' className='text-xs   px-2 text-center'>
          {tabledata.length > 0 && (
            <div className='inline-flex justify-center items-center'>
              <MyButton
                onClick={() => handleRunClick_ALL({ routine: 'TOBASE' })}
                overrideClass='h-6 px-2 py-2  bg-red-500 hover:bg-red-600'
              >
                ToBase
              </MyButton>
            </div>
          )}
        </th>
        <th scope='col' className='text-xs   px-2 text-center'>
          {tabledata.length > 0 && dataDirectory.length > 0 && (
            <div className='inline-flex justify-center items-center'>
              <MyButton
                onClick={() => handleRunClick_ALL({ routine: 'DOWN' })}
                overrideClass='h-6 px-2 py-2  bg-red-500 hover:bg-red-600'
              >
                Down ALL
              </MyButton>
            </div>
          )}
        </th>
        <th scope='col' className='text-xs   px-2 text-center'>
          {tabledata.length > 0 && dataDirectory.length > 0 && (
            <div className='inline-flex justify-center items-center'>
              <MyButton
                onClick={() => fetchdirectory()}
                overrideClass='h-6 px-2 py-2  bg-red-500 hover:bg-red-600'
              >
                Refresh
              </MyButton>
            </div>
          )}
        </th>
        <th scope='col' className='text-xs   px-2 text-center'>
          {exists_D.some(value => value) && (
            <div className='inline-flex justify-center items-center'>
              <MyButton
                onClick={() => handleRunClick_ALL({ routine: 'UPLOAD' })}
                overrideClass='h-6 px-2 py-2  bg-red-500 hover:bg-red-600'
              >
                Upload
              </MyButton>
            </div>
          )}
        </th>
      </tr>
    )
  }
  //----------------------------------------------------------------------------------------------
  // Render table body
  //----------------------------------------------------------------------------------------------
  function render_body() {
    return (
      <tbody className='bg-white '>
        {tabledata?.map((row_tabledata, index) => {
          const row_existsInZ = exists_Z[index] || false
          const row_existsInD = exists_D[index] || false
          const row_tabledata_count_D = tabledata_count_D[index] || 0
          const row_existsInB = tabledata_count[index] || false
          const row_tabledata_Z = tabledata_Z[index]
          const row_tabledata_count = tabledata_count[index]
          const row_tabledata_count_Z = tabledata_count_Z[index]
          return (
            <tr key={row_tabledata} className='w-full border-b'>
              <td className='text-xs px-2 pt-2'>{row_tabledata}</td>
              <td className='text-xs px-2 pt-2 text-right'>{row_tabledata_count}</td>
              <td className='text-xs px-2 py-1 text-center'>
                <div className='inline-flex justify-center items-center'>
                  <MyButton
                    onClick={() => handleRunClick1({ routine: 'SEQRESET', tablebase: row_tabledata, index })}
                    overrideClass='h-6 px-2 py-2 '
                  >
                    SeqReset
                  </MyButton>
                </div>
              </td>
              <td className='text-xs px-2 pt-2'>{row_tabledata_Z}</td>
              <td className='text-xs px-2 pt-2 text-center'>{row_existsInZ ? 'Y' : ''}</td>
              <td className='text-xs px-2 pt-2 text-right'>{row_tabledata_count_Z}</td>
              <td className='text-xs px-2 py-1 text-center'>
                {row_existsInZ && (
                  <div className='inline-flex justify-center items-center'>
                    <MyButton
                      onClick={() => handleRunClick1({ routine: 'DROP', tablebase: row_tabledata, index })}
                      overrideClass='h-6 px-2 py-2 '
                    >
                      Drop
                    </MyButton>
                  </div>
                )}
              </td>
              <td className='text-xs px-2 py-1 text-center'>
                {!row_existsInZ && (
                  <div className='inline-flex justify-center items-center'>
                    <MyButton
                      onClick={() => handleRunClick1({ routine: 'DUP', tablebase: row_tabledata, index })}
                      overrideClass='h-6 px-2 py-2 '
                    >
                      Duplicate
                    </MyButton>
                  </div>
                )}
              </td>
              <td className='text-xs px-2 py-1 text-center'>
                {row_existsInZ && (
                  <div className='inline-flex justify-center items-center'>
                    <MyButton
                      onClick={() => handleRunClick1({ routine: 'CLEAR', tablebase: row_tabledata, index })}
                      overrideClass='h-6 px-2 py-2 '
                    >
                      Clear
                    </MyButton>
                  </div>
                )}
              </td>
              <td className='text-xs px-2 py-1 text-center'>
                {row_existsInZ && (
                  <div className='inline-flex justify-center items-center'>
                    <MyButton
                      onClick={() => handleRunClick1({ routine: 'COPY', tablebase: row_tabledata, index })}
                      overrideClass='h-6 px-2 py-2 '
                    >
                      Copy
                    </MyButton>
                  </div>
                )}
              </td>
              <td className='text-xs px-2 py-1 text-center'>
                {row_existsInZ && row_tabledata_count_Z > 0 && (
                  <div className='inline-flex justify-center items-center'>
                    <MyButton
                      onClick={() => handleRunClick1({ routine: 'TOBASE', tablebase: row_tabledata, index })}
                      overrideClass='h-6 px-2 py-2 '
                    >
                      ToBase
                    </MyButton>
                  </div>
                )}
              </td>
              <td className='text-xs px-2 py-1 text-center'>
                {row_existsInB && dataDirectory.length > 0 && (
                  <div className='inline-flex justify-center items-center'>
                    <MyButton
                      onClick={() => handleRunClick1({ routine: 'DOWN', tablebase: row_tabledata, index })}
                      overrideClass='h-6 px-2 py-2 '
                    >
                      Down
                    </MyButton>
                  </div>
                )}
              </td>
              <td className='text-xs px-2 pt-2 text-center'>{row_existsInD ? 'Y' : ''}</td>
              <td className='text-xs px-2 pt-2 text-right'>{row_existsInD ? row_tabledata_count_D : ''}</td>
              <td className='text-xs px-2 py-1 text-center'>
                {row_existsInD && row_existsInZ && (
                  <div className='inline-flex justify-center items-center'>
                    <MyButton
                      onClick={() => handleRunClick1({ routine: 'UPLOAD', tablebase: row_tabledata, index })}
                      overrideClass='h-6 px-2 py-2 '
                    >
                      Upload
                    </MyButton>
                  </div>
                )}
              </td>
            </tr>
          )
        })}
      </tbody>
    )
  }
  //----------------------------------------------------------------------------------------------
  // Render pagination
  //----------------------------------------------------------------------------------------------
  function render_pagination() {
    return (
      <div className='mt-5 flex w-full justify-center'>
        <MyPagination
          totalPages={totalPages}
          statecurrentPage={currentPage}
          setStateCurrentPage={setcurrentPage}
        />
      </div>
    )
  }
  //----------------------------------------------------------------------------------------------
  // Data loaded
  //----------------------------------------------------------------------------------------------
  return (
    <>
      <div className='mt-4 py-2 px-2 bg-gray-50 rounded-lg shadow-md max-w-full'>
        <div className='overflow-y-auto max-h-[70vh]'>
          <table className='min-w-full text-gray-900 table-auto '>
            <thead className='sticky top-0 z-10 bg-gray-50 text-left font-normal text-xs '>
              {render_tr1()}
              {render_tr2()}
              {render_tr3()}
            </thead>
            {render_body()}
          </table>
        </div>
      </div>
      {render_pagination()}
      {message && (
        <div className='mt-5 flex w-full justify-center  text-red-700 text-xs'>
          <p>{message}</p>
        </div>
      )}
      <MyConfirmDialog confirmDialog={confirmDialog} setConfirmDialog={setConfirmDialog} />
    </>
  )
}
