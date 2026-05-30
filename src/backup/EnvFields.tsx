'use client'

import { MyInput } from '../components/MyInput'
import { MyHelp } from '../components/MyHelp'
import MySelect from '../components/MySelect'
import type { EnvFile } from './copyTables'

const LABEL_CLASS = 'text-xs w-20 text-right shrink-0'

// ─── Directory ────────────────────────────────────────────────────────────────

interface DirectoryProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  helpBody?: string
}

export function EnvDirectoryInput({ value, onChange, placeholder, helpBody }: DirectoryProps) {
  return (
    <div className='flex items-center gap-2'>
      <label className={LABEL_CLASS}>Directory</label>
      <MyInput
        overrideClass='w-72'
        type='text'
        value={value}
        placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
      />
      {helpBody && (
        <MyHelp items={[{ heading: 'Directory', body: helpBody }]} />
      )}
    </div>
  )
}

// ─── Source / Target select ───────────────────────────────────────────────────

interface EnvFileSelectProps {
  label: 'Source' | 'Target'
  value: string
  onChange: (value: string) => void
  envFiles: EnvFile[]
  helpBody?: string
  warning?: string
}

export function EnvFileSelect({ label, value, onChange, envFiles, helpBody, warning }: EnvFileSelectProps) {
  const location = envFiles.find(e => e.file === value)?.location ?? ''
  const isTarget = label === 'Target'
  const badgeClass = isTarget
    ? 'text-sm font-bold uppercase bg-red-600 text-white px-3 py-1 rounded-md shadow animate-pulse'
    : 'text-sm font-bold uppercase bg-blue-600 text-white px-3 py-1 rounded-md shadow'

  return (
    <div className='flex items-center gap-2'>
      <label className={LABEL_CLASS}>{label}</label>
      <MySelect value={value} onChange={e => onChange((e.target as HTMLSelectElement).value)}>
        {envFiles.map(e => (
          <option key={e.file} value={e.file}>
            {e.file}{e.location ? ` (${e.location})` : ''}
          </option>
        ))}
      </MySelect>
      {location && <span className={badgeClass}>{location}</span>}
      {warning && location && <span className='text-xs font-semibold text-red-700'>{warning}</span>}
      {helpBody && (
        <MyHelp items={[{ heading: label, body: helpBody }]} />
      )}
    </div>
  )
}
