'use client'

import { useState } from 'react'
import { MyButton } from '../components/MyButton'
import { MyInput } from '../components/MyInput'
import { read_url, read_location, get_tables, copy_tables } from './copyTables'
import type { CopyLog } from './copyTables'

export default function CopyTable({ baseDir = '' }: { baseDir?: string }) {
  const [directory, setDirectory] = useState(baseDir)
  const [sourceEnvFile, setSourceEnvFile] = useState('.env.locallocal')
  const [targetEnvFile, setTargetEnvFile] = useState('.env.localdev')
  const [sourceLocation, setSourceLocation] = useState('')
  const [targetLocation, setTargetLocation] = useState('')
  const [availableTables, setAvailableTables] = useState<string[]>([])
  const [selectedTables, setSelectedTables] = useState<Set<string>>(new Set())
  const [logs, setLogs] = useState<CopyLog[]>([])
  const [message, setMessage] = useState('')
  const [running, setRunning] = useState(false)

  function fullPath(filename: string) {
    return directory ? `${directory}/${filename}` : filename
  }

  async function refreshLocation(envFile: string, which: 'source' | 'target') {
    if (!envFile) {
      which === 'source' ? setSourceLocation('') : setTargetLocation('')
      return
    }
    const loc = await read_location(fullPath(envFile))
    which === 'source' ? setSourceLocation(loc) : setTargetLocation(loc)
  }

  async function handleLoadTables() {
    setMessage('Loading tables...')
    setRunning(true)
    try {
      const [url, srcLoc, tgtLoc] = await Promise.all([
        read_url(fullPath(sourceEnvFile)),
        read_location(fullPath(sourceEnvFile)),
        read_location(fullPath(targetEnvFile)),
      ])
      setSourceLocation(srcLoc)
      setTargetLocation(tgtLoc)
      if (!url) {
        setMessage('Could not read POSTGRES_URL from source env file')
        return
      }
      const tables = await get_tables({ url })
      setAvailableTables(tables)
      setSelectedTables(new Set())
      setMessage(`Loaded ${tables.length} tables`)
    } catch (error) {
      setMessage(`Error: ${(error as Error).message}`)
    } finally {
      setRunning(false)
    }
  }

  async function handleCopy() {
    if (!sourceLocation || !targetLocation) {
      setMessage('Cannot copy: location not set for one or both env files. Load Tables first.')
      return
    }
    setMessage('Copying tables...')
    setRunning(true)
    setLogs([])
    try {
      const [sourceUrl, targetUrl] = await Promise.all([
        read_url(fullPath(sourceEnvFile)),
        read_url(fullPath(targetEnvFile)),
      ])
      if (!sourceUrl || !targetUrl) {
        setMessage('Could not read POSTGRES_URL from one or both env files')
        return
      }
      const result = await copy_tables({
        sourceUrl,
        targetUrl,
        tables: Array.from(selectedTables),
        sourceLabel: sourceLocation,
        targetLabel: targetLocation,
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

      <div className='flex items-center gap-2 mb-4'>
        <label className='text-xs w-20 text-right shrink-0'>Directory</label>
        <MyInput
          id='directory'
          name='directory'
          overrideClass='flex-1 text-xs'
          type='text'
          placeholder='C:/Users/richa/github/next-bridgeschool'
          value={directory}
          onChange={e => setDirectory(e.target.value)}
        />
      </div>

      <div className='flex items-center gap-2 mb-2'>
        <label className='text-xs w-20 text-right shrink-0'>Source</label>
        <MyInput
          id='sourceEnvFile'
          name='sourceEnvFile'
          overrideClass='w-48 text-xs'
          type='text'
          placeholder='.env.locallocal'
          value={sourceEnvFile}
          onChange={e => setSourceEnvFile(e.target.value)}
          onBlur={e => refreshLocation(e.target.value, 'source')}
        />
        {sourceLocation && (
          <span className='text-xs font-semibold text-blue-700'>[{sourceLocation}]</span>
        )}
        <MyButton
          onClick={handleLoadTables}
          overrideClass='h-6 px-2 py-2 shrink-0'
          disabled={!sourceEnvFile || running}
        >
          Load Tables
        </MyButton>
      </div>

      <div className='flex items-center gap-2 mb-4'>
        <label className='text-xs w-20 text-right shrink-0'>Target</label>
        <MyInput
          id='targetEnvFile'
          name='targetEnvFile'
          overrideClass='w-48 text-xs'
          type='text'
          placeholder='.env.localdev'
          value={targetEnvFile}
          onChange={e => setTargetEnvFile(e.target.value)}
          onBlur={e => refreshLocation(e.target.value, 'target')}
        />
        {targetLocation && (
          <span className='text-xs font-semibold text-green-700'>[{targetLocation}]</span>
        )}
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
          <div className='flex items-center gap-3 mb-1'>
            <p className='text-xs font-semibold'>Copy Log</p>
            {sourceLocation && targetLocation && (
              <p className='text-xs text-gray-500'>{sourceLocation} → {targetLocation}</p>
            )}
          </div>
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
