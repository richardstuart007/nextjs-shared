'use client'

import { useState } from 'react'
import BackupTable from './table'
import SchemaSync from './SchemaSync'
import CopyTable from './CopyTable'
import CreateSQL from './CreateSQL'

type Tab = 'backup' | 'schema' | 'copy' | 'createsql'

const TABS: { id: Tab; label: string }[] = [
  { id: 'backup',    label: 'Backup' },
  { id: 'schema',    label: 'Schema Sync' },
  { id: 'copy',      label: 'Copy Tables' },
  { id: 'createsql', label: 'Create SQL' },
]

export default function DatabaseTools({
  tables = [],
  baseDir = '',
}: {
  tables?: string[]
  baseDir?: string
}) {
  const [activeTab, setActiveTab] = useState<Tab>('backup')

  return (
    <div className='flex flex-col w-full'>
      <div className='flex border-b border-gray-300 shrink-0'>
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-xs font-medium transition-colors ${
              activeTab === tab.id
                ? 'border-b-2 border-blue-600 text-blue-700 bg-white'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className='pt-3'>
        {activeTab === 'backup'   && <BackupTable  tables={tables} />}
        {activeTab === 'schema'   && <SchemaSync   baseDir={baseDir} title='Schema Sync' />}
        {activeTab === 'copy'     && <CopyTable    baseDir={baseDir} title='Copy Tables' />}
{activeTab === 'createsql' && <CreateSQL   baseDir={baseDir} />}
      </div>
    </div>
  )
}
