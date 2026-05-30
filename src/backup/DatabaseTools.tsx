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
    <div className='flex flex-col mt-4' style={{ height: 'calc(100vh - 4rem)' }}>
      <div className='flex border-b border-gray-300 shrink-0'>
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2 text-xs font-medium transition-colors text-center whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-b-2 border-blue-600 text-blue-700 bg-white'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className='flex-1 overflow-y-auto min-h-0'>
        {activeTab === 'backup'   && <BackupTable  tables={tables} />}
        {activeTab === 'schema'   && <SchemaSync   baseDir={baseDir} title='Schema Sync' />}
        {activeTab === 'copy'     && <CopyTable    baseDir={baseDir} title='Copy Tables' />}
{activeTab === 'createsql' && <CreateSQL   baseDir={baseDir} />}
      </div>
    </div>
  )
}
