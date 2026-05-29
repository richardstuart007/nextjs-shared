'use client'

import { useState, useEffect } from 'react'
import { MyButton } from '../components/MyButton'
import { MyInput } from '../components/MyInput'
import MySelect from '../components/MySelect'
import { MyHelp } from '../components/MyHelp'
import type { HelpItem } from '../components/MyHelp'
import { list_env_files } from './copyTables'
import type { EnvFile } from './copyTables'
import { generateCreateSQL } from './schemaSync'
import type { TableDDL } from './schemaSync'

const HELP_ITEMS: HelpItem[] = [
  {
    heading: 'Create SQL',
    body: 'Runs pg_dump --schema-only against the selected database and returns full CREATE TABLE + index DDL per table. Use this to recreate a schema from scratch or as the authoritative DDL for new tables.',
  },
  {
    heading: 'Select a table',
    body: 'Click a table name on the left to see its CREATE TABLE statement and associated indexes on the right.',
  },
]

export default function CreateSQL({ baseDir = '' }: { baseDir?: string }) {
  const [directory, setDirectory]       = useState(baseDir)
  const [envFiles, setEnvFiles]         = useState<EnvFile[]>([])
  const [sourceEnv, setSourceEnv]       = useState('')
  const [tableDDLs, setTableDDLs]       = useState<TableDDL[]>([])
  const [selectedTable, setSelectedTable] = useState('')
  const [message, setMessage]           = useState('')
  const [running, setRunning]           = useState(false)

  function fullPath(filename: string) {
    return directory ? `${directory}/${filename}` : filename
  }

  useEffect(() => {
    if (!directory) return
    list_env_files(directory).then(files => {
      setEnvFiles(files)
      setSourceEnv(files[0]?.file ?? '')
      setTableDDLs([])
      setSelectedTable('')
      setMessage('')
    })
  }, [directory])

  const sourceLabel = envFiles.find(e => e.file === sourceEnv)?.location ?? ''

  async function handleGenerate() {
    if (!sourceEnv) return
    setRunning(true)
    setTableDDLs([])
    setSelectedTable('')
    setMessage('Generating CREATE SQL...')
    try {
      const ddls = await generateCreateSQL(fullPath(sourceEnv))
      setTableDDLs(ddls)
      setSelectedTable(ddls[0]?.table_name ?? '')
      setMessage(`${ddls.length} table${ddls.length !== 1 ? 's' : ''}`)
    } catch (error) {
      setMessage(`Error: ${(error as Error).message}`)
    } finally {
      setRunning(false)
    }
  }

  return (
    <div className='mt-4 py-2 px-4 bg-gray-50 rounded-lg shadow-md max-w-4xl space-y-4'>
      <div className='flex items-center gap-2'>
        <MyHelp items={HELP_ITEMS} title='Create SQL Help' label='Help' />
      </div>

      {/* Directory */}
      <div className='flex items-center gap-2'>
        <label className='text-xs w-20 text-right shrink-0'>Directory</label>
        <MyInput
          overrideClass='flex-1'
          type='text'
          value={directory}
          onChange={e => setDirectory(e.target.value)}
        />
      </div>

      {envFiles.length === 0 && directory && (
        <p className='text-xs text-red-700'>No .env.* files found in directory</p>
      )}

      {envFiles.length > 0 && (
        <>
          {/* Source env */}
          <div className='flex items-center gap-2'>
            <label className='text-xs w-20 text-right shrink-0'>Source</label>
            <MySelect value={sourceEnv} onChange={e => setSourceEnv((e.target as HTMLSelectElement).value)}>
              {envFiles.map(e => (
                <option key={e.file} value={e.file}>
                  {e.file}{e.location ? ` (${e.location})` : ''}
                </option>
              ))}
            </MySelect>
            {sourceLabel && (
              <span className='text-sm font-bold uppercase bg-blue-600 text-white px-3 py-1 rounded-md shadow'>
                {sourceLabel}
              </span>
            )}
          </div>

          <div className='ml-24'>
            <MyButton
              onClick={handleGenerate}
              overrideClass='h-6 px-2 py-2'
              disabled={!sourceEnv || running}
            >
              Generate from {sourceLabel || 'source'}
            </MyButton>
          </div>
        </>
      )}

      {message && (
        <p className={`text-xs ${message.startsWith('Error') ? 'text-red-700' : 'text-gray-600'}`}>
          {message}
        </p>
      )}

      {tableDDLs.length > 0 && (
        <div className='flex gap-2 border rounded bg-white overflow-hidden' style={{ height: '32rem' }}>
          {/* Left — table list */}
          <div className='w-48 shrink-0 border-r overflow-y-auto'>
            {tableDDLs.map(t => (
              <button
                key={t.table_name}
                onClick={() => setSelectedTable(t.table_name)}
                className={`w-full text-left px-2 py-1 text-xs font-mono truncate border-b border-gray-100 hover:bg-blue-50 ${
                  selectedTable === t.table_name ? 'bg-blue-100 font-semibold text-blue-800' : 'text-gray-700'
                }`}
              >
                {t.table_name}
              </button>
            ))}
          </div>
          {/* Right — SQL for selected table */}
          <div className='flex-1 overflow-auto p-2'>
            {selectedTable && (
              <pre className='text-xs font-mono whitespace-pre-wrap text-gray-800'>
                {tableDDLs.find(t => t.table_name === selectedTable)?.sql ?? ''}
              </pre>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
