'use client'

import { useState, useRef, useEffect } from 'react'
import { myMergeClasses } from './MyMergeClasses'

type Option = string | { value: string; label: string }

type Props = {
  label?: string
  options: Option[]
  selected: string[]
  onChange: (values: string[]) => void
  id?: string
  defaultClass?: string
  overrideClass?: string
  labelClass?: string
  containerClass?: string
  panelClass?: string
}

export const MySelectMulti_dftClass_Shared = [
  'h-6 md:h-8 w-72',
  'py-1 px-1 md:px-2',
  'text-xs text-left',
  'rounded-md',
  'border border-blue-500',
  'hover:border-blue-600',
  'bg-white',
  'transition-colors',
].join(' ')

export const MySelectMulti_labelDftClass_Shared     = 'font-bold text-xs whitespace-nowrap'
export const MySelectMulti_containerDftClass_Shared = 'flex items-center gap-2'
export const MySelectMulti_panelDftClass_Shared     = 'absolute z-10 mt-1 top-full left-0 min-w-max bg-white border border-gray-200 rounded shadow-md p-1'

//----------------------------------------------------------------------------------
//  normalize — string | {value,label} -> {value,label}
//----------------------------------------------------------------------------------
function normalize(opt: Option): { value: string; label: string } {
  return typeof opt === 'string' ? { value: opt, label: opt } : opt
}

//----------------------------------------------------------------------------------
//  MySelectMulti — compact checkbox-dropdown multi-select
//----------------------------------------------------------------------------------
export default function MySelectMulti({
  label,
  options,
  selected,
  onChange,
  id,
  defaultClass = MySelectMulti_dftClass_Shared,
  overrideClass = '',
  labelClass = MySelectMulti_labelDftClass_Shared,
  containerClass = MySelectMulti_containerDftClass_Shared,
  panelClass = MySelectMulti_panelDftClass_Shared,
}: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const normalized = options.map(normalize)
  const autoId = id ?? (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)
  const className = myMergeClasses(defaultClass, overrideClass)

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  function toggle(value: string) {
    onChange(selected.includes(value) ? selected.filter(v => v !== value) : [...selected, value])
  }

  const display = selected.length === 0 ? 'All' : `${selected.length} selected`

  return (
    <div className={containerClass}>
      {label && <label htmlFor={autoId} className={labelClass}>{label}</label>}
      <div ref={ref} className='relative'>
        <button
          id={autoId}
          type='button'
          aria-haspopup='listbox'
          aria-expanded={open}
          onClick={() => setOpen(o => !o)}
          className={className}
        >
          {display}
        </button>
        {open && (
          <div role='listbox' aria-multiselectable='true' className={panelClass}>
            {normalized.map(opt => (
              <label key={opt.value} className='flex items-center gap-1 px-1 py-0.5 hover:bg-gray-50 cursor-pointer text-xs whitespace-nowrap'>
                <input
                  type='checkbox'
                  checked={selected.includes(opt.value)}
                  onChange={() => toggle(opt.value)}
                  className='h-3 w-3'
                />
                {opt.label}
              </label>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
