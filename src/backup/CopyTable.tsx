'use client'

import { useState } from 'react'
import { MyButton } from '../components/MyButton'
import { MyInput } from '../components/MyInput'
import { read_url, get_tables, copy_tables } from './copyTables'
import type { CopyLog } from './copyTables'

export default function CopyTable() {
  const [sourceEnvFile, setSourceEnvFile] = useState('')
  const [targetEnvFile, setTargetEnvFile] = useState('')
  const [availableTables, setAvailableTables] = useState<string[]>([])
  const [selectedTables, setSelectedTables] = useState<Set<string>>(new Set())
  const [logs, setLogs] = useState<CopyLog[]>([])
  const [message, setMessage] = useState('')
  const [running, setRunning] = useState(false)

  async function handleLoadTables() {
    setMessage('Loading tables...')
    setRunning(true)
    try {
      const url = await read_url(sourceEnvFile)
      if (!url) {
        setMessage('Could not read POSTGRES_URL from source env file')
        return
      }
      const tables = await get_tables({ url })
      setAvailableTables(tables)
      setSelectedTables(new Set(tables))
      setMessage(`Loaded ${tables.length} tables`)
    } catch (error) {
      setMessage(`Error: ${(error as Error).message}`)
    } finally {
      setRunning(false)
    }
  }

  async function handleCopy() {
    setMessage('Copying tables...')
    setRunning(true)
    setLogs([])
    try {
      const sourceUrl = await read_url(sourceEnvFile)
      const targetUrl = await read_url(targetEnvFile)
      if (!sourceUrl || !targetUrl) {
        setMessage('Could not read POSTGRES_URL from one or both env files')
        return
      }
      const result = await copy_tables({
        sourceUrl,
        targetUrl,
        tables: Array.from(selectedTables)
      })
      setLogs(result.logs)
      setMessage(result.success ? 'Copy completed successfully' : 'Copy completed with errors')
    } catch (error) {
      setMessage(`Error: ${(error as Error).message}`)
    } finally {
      setRunning(false)
    }
  }

  function toggleTable(table: string) {
    setSelectedTables(prev => {
      const next = new Set(prev)
      if (next.has(table)) next.delete(table)
      else next.add(table)
      return next
    })
  }

  function toggleAll() {
    if (selectedTables.size === availableTables.length) {
      setSelectedTables(new Set())
    } else {
      setSelectedTables(new Set(availableTables))
    }
  }

  return (
    <div className='mt-4 py-2 px-4 bg-gray-50 rounded-lg shadow-md max-w-3xl'>
      <h2 className='text-sm font-bold mb-4'>Cross-Database Table Copy (pg_dump / psql)</h2>

      <div className='flex items-center gap-2 mb-2'>
        <label className='text-xs w-32 text-right shrink-0'>Source .env file</label>
        <MyInput
          id='sourceEnvFile'
          name='sourceEnvFile'
          overrideClass='flex-1 text-xs'
          type='text'
          placeholder='/path/to/source/.env.local'
          value={sourceEnvFile}
          onChange={e => setSourceEnvFile(e.target.value)}
        />
        <MyButton
          onClick={handleLoadTables}
          overrideClass='h-6 px-2 py-2 shrink-0'
          disabled={!sourceEnvFile || running}
        >
          Load Tables
        </MyButton>
      </div>

      <div className='flex items-center gap-2 mb-4'>
        <label className='text-xs w-32 text-right shrink-0'>Target .env file</label>
        <MyInput
          id='targetEnvFile'
          name='targetEnvFile'
          overrideClass='flex-1 text-xs'
          type='text'
          placeholder='/path/to/target/.env.local'
          value={targetEnvFile}
          onChange={e => setTargetEnvFile(e.target.value)}
        />
      </div>

      {availableTables.length > 0 && (
        <div className='mb-4'>
          <div className='flex items-center gap-2 mb-2'>
            <span className='text-xs font-semibold'>Tables ({availableTables.length})</span>
            <MyButton
              onClick={toggleAll}
              overrideClass='h-6 px-2 py-2 bg-gray-400 hover:bg-gray-500'
            >
              {selectedTables.size === availableTables.length ? 'Deselect All' : 'Select All'}
            </MyButton>
            <MyButton
              onClick={handleCopy}
              overrideClass='h-6 px-2 py-2 bg-red-500 hover:bg-red-600'
              disabled={selectedTables.size === 0 || !targetEnvFile || running}
            >
              Copy {selectedTables.size} Tables
            </MyButton>
          </div>
          <div className='grid grid-cols-3 gap-1 max-h-48 overflow-y-auto border p-2 rounded bg-white'>
            {availableTables.map(table => (
              <label key={table} className='flex items-center gap-1 text-xs cursor-pointer'>
                <input
                  type='checkbox'
                  checked={selectedTables.has(table)}
                  onChange={() => toggleTable(table)}
                />
                {table}
              </label>
            ))}
          </div>
        </div>
      )}

      {message && (
        <p className='text-xs text-red-700 mb-2'>{message}</p>
      )}

      {logs.length > 0 && (
        <div className='mt-2'>
          <p className='text-xs font-semibold mb-1'>Copy Log</p>
          <div className='max-h-48 overflow-y-auto border rounded bg-white'>
            <table className='min-w-full text-xs'>
              <thead className='bg-gray-100'>
                <tr>
                  <th className='px-2 py-1 text-left'>Event</th>
                  <th className='px-2 py-1 text-left'>Detail</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log, i) => (
                  <tr key={i} className={log.event === 'ERROR' ? 'text-red-600' : ''}>
                    <td className='px-2 py-0.5'>{log.event}</td>
                    <td className='px-2 py-0.5'>{log.detail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
