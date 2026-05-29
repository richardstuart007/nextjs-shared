'use client'

import { useState } from 'react'
import BackupTable from './table'
import SchemaSync from './SchemaSync.tsx'
import CopyTable from './CopyTable.tsx'
import DataSync from './DataSync.tsx'
import DataSnapshot from './DataSnapshot.tsx'

type Tab = 'backup' | 'schema' | 'copy' | 'datasync' | 'snapshot'

const TABS: { id: Tab; label: string }[] = [
  { id: 'backup',   label: 'Backup' },
  { id: 'schema',   label: 'Schema Sync' },
  { id: 'copy',     label: 'Copy Tables' },
  { id: 'datasync', label: 'Data Sync' },
  { id: 'snapshot', label: 'Data Snapshot' },
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
    <div className='mt-4'>
      <div className='flex border-b border-gray-300'>
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

      <div>
        {activeTab === 'backup'   && <BackupTable  tables={tables} />}
        {activeTab === 'schema'   && <SchemaSync   baseDir={baseDir} title='Schema Sync' />}
        {activeTab === 'copy'     && <CopyTable    baseDir={baseDir} title='Copy Tables' />}
        {activeTab === 'datasync' && <DataSync     baseDir={baseDir} title='Data Sync' />}
        {activeTab === 'snapshot' && <DataSnapshot baseDir={baseDir} title='Data Snapshot' />}
      </div>
    </div>
  )
}
