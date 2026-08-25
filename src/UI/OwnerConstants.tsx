'use client'

//==============================================================================================
//  1) DESCRIPTION
//    OwnerConstants — Constants / .env sub-tabs for the nextjs-shared dev app
//
//    Parameters:
//      envValues — the tracked env var values (see ENV_VARS), keyed by name
//==============================================================================================

import { useState } from 'react'
import { MyTab } from '../components/MyTab'
import * as Constants from '../constants'

type EnvVarEntry = { name: string; description: string }

const ENV_VARS: EnvVarEntry[] = [
  { name: 'POSTGRES_URL', description: "Postgres connection string. If omitted, all write_logging calls fall back to console.log and DB operations will fail." },
  { name: 'NEXT_PUBLIC_APPENV_LOG_I', description: "Set to 'false' to suppress 'I' severity log entries" },
  { name: 'NEXT_PUBLIC_APPENV_LOG_D', description: "Set to 'false' to suppress 'D' (development) severity log entries" },
  { name: 'NEXT_PUBLIC_APPENV_ISDEV', description: "Set to 'true' to show a dev/environment badge in the UI" },
]

type Props = {
  envValues: Record<string, string | undefined>
}

export default function OwnerConstants({ envValues }: Props) {
  const [subTab, setSubTab] = useState<'constants' | 'env'>('constants')
  const constantGroups = groupConstants()
  const groupNames = Object.keys(constantGroups)
  const [activeGroup, setActiveGroup] = useState(groupNames[0])
  const activeEntries = constantGroups[activeGroup] ?? []

  return (
    <div className='p-4'>
      <div className='flex gap-2 mb-4'>
        <MyTab active={subTab === 'constants'} onClick={() => setSubTab('constants')}>Constants</MyTab>
        <MyTab active={subTab === 'env'} onClick={() => setSubTab('env')}>.env</MyTab>
      </div>

      {subTab === 'constants' && (
        <div>
          <div className='flex flex-wrap gap-1 mb-4'>
            {groupNames.map(group => (
              <MyTab
                key={group}
                variant='pill'
                active={activeGroup === group}
                onClick={() => setActiveGroup(group)}
              >
                {group}
              </MyTab>
            ))}
          </div>
          <table className='text-xs border-collapse'>
            <tbody>
              {activeEntries.map(entry => (
                <tr key={entry.name} className='align-top'>
                  <td className='font-mono text-gray-600 pr-4 py-0.5 whitespace-nowrap'>{entry.name}</td>
                  <td className='font-mono text-gray-900 py-0.5 break-all'>{entry.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {subTab === 'env' && (
        <table className='text-xs border-collapse'>
          <tbody>
            {ENV_VARS.map(envVar => (
              <tr key={envVar.name} className='align-top'>
                <td className='font-mono text-gray-600 pr-4 py-1 whitespace-nowrap'>{envVar.name}</td>
                <td className='font-mono text-gray-900 pr-4 py-1 break-all'>{envValues[envVar.name] ?? '(not set)'}</td>
                <td className='text-gray-500 py-1'>{envVar.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

//----------------------------------------------------------------------------------------------
//  groupConstants — groups every constants.ts export by its component-name prefix
//
//  Returns:
//    a map of group name (e.g. 'MyButton') to its {name,value} entries
//----------------------------------------------------------------------------------------------
function groupConstants(): Record<string, { name: string; value: string }[]> {
  const groups: Record<string, { name: string; value: string }[]> = {}
  for (const [name, value] of Object.entries(Constants)) {
    const group = name.split('_')[0]
    const displayValue = Array.isArray(value) ? JSON.stringify(value) : String(value)
    if (!groups[group]) groups[group] = []
    groups[group].push({ name, value: displayValue })
  }
  return groups
}
