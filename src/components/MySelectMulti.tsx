'use client'

import { useState, useRef, useEffect } from 'react'
import { myMergeClasses } from './MyMergeClasses'
import {
  MySelectMulti_dftClass,
  MySelectMulti_labelDftClass,
  MySelectMulti_containerDftClass,
  MySelectMulti_panelDftClass,
  MySelectMulti_selectedDividerClass
} from '../constants'

type Option = string | { value: string; label: string }

type Props = {
  label?: string
  options: Option[]
  selected: string[]
  onChange: (values: string[]) => void
  id?: string
  showReset?: boolean
  resetLabel?: string
  defaultClass?: string
  overrideClass?: string
  labelClass?: string
  containerClass?: string
  panelClass?: string
}

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
  showReset = false,
  resetLabel = 'All',
  defaultClass = MySelectMulti_dftClass,
  overrideClass = '',
  labelClass = MySelectMulti_labelDftClass,
  containerClass = MySelectMulti_containerDftClass,
  panelClass = MySelectMulti_panelDftClass,
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

  function resetSelection() {
    onChange([])
    setOpen(false)
  }

  const display = selected.length === 0 ? 'All' : `${selected.length} selected`
  const selectedItems = normalized.filter(opt => selected.includes(opt.value))
  const unselectedItems = normalized.filter(opt => !selected.includes(opt.value))

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
            {showReset && selected.length > 0 && (
              <button
                type='button'
                onClick={resetSelection}
                className='block w-full text-left px-1 py-0.5 mb-1 pb-1 border-b border-gray-200 italic font-semibold hover:bg-gray-50 text-xs whitespace-nowrap'
              >
                {resetLabel}
              </button>
            )}
            {selectedItems.map(opt => (
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
            {selectedItems.length > 0 && unselectedItems.length > 0 && (
              <div className={MySelectMulti_selectedDividerClass} />
            )}
            {unselectedItems.map(opt => (
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
