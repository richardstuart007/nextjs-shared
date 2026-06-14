'use client'

import { useState } from 'react'
import { action_generateLogs, action_generateCache } from './actions'

export default function Page() {
  const [logMsg, setLogMsg] = useState('')
  const [cacheMsg, setCacheMsg] = useState('')

  async function handleGenerateLogs() {
    setLogMsg('Writing...')
    const result = await action_generateLogs()
    setLogMsg(result)
  }

  async function handleGenerateCache() {
    setCacheMsg('Generating...')
    const result = await action_generateCache()
    setCacheMsg(result)
  }

  return (
    <div className='p-4'>
      <h1 className='text-base font-bold mb-4'>nextjs-shared · local test</h1>

      <div className='flex gap-6 mb-4'>
        <div className='flex items-center gap-2'>
          <button
            onClick={handleGenerateLogs}
            className='px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600'
          >
            Generate Logs
          </button>
          {logMsg && <span className='text-xs text-gray-600'>{logMsg}</span>}
        </div>
        <div className='flex items-center gap-2'>
          <button
            onClick={handleGenerateCache}
            className='px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600'
          >
            Generate Cache
          </button>
          {cacheMsg && <span className='text-xs text-gray-600'>{cacheMsg}</span>}
        </div>
      </div>

    </div>
  )
}
