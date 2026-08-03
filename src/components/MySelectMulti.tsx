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
  selectAllLabel?: string
  minSelected?: number
  maxSelected?: number
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
  selectAllLabel = 'All',
  minSelected,
  maxSelected,
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

  const allSelected = selected.length === normalized.length
  const canSelectAll = maxSelected === undefined || maxSelected >= normalized.length

  function toggle(value: string) {
    const isSelected = selected.includes(value)

    if (isSelected) {
      if (allSelected) {
        const candidate = [value]
        if (minSelected !== undefined && candidate.length < minSelected) return
        onChange(candidate)
        return
      }
      const candidate = selected.filter(v => v !== value)
      if (minSelected !== undefined && candidate.length < minSelected) return
      onChange(candidate)
      return
    }

    if (maxSelected !== undefined && selected.length + 1 > maxSelected) {
      if (minSelected !== undefined && minSelected === maxSelected) {
        onChange([...selected.slice(1), value])
      }
      return
    }
    onChange([...selected, value])
  }

  function selectAll() {
    if (!canSelectAll) return
    onChange(normalized.map(opt => opt.value))
  }

  const countLabel = maxSelected !== undefined ? `${selected.length}/${maxSelected} selected` : `${selected.length} selected`
  const display = allSelected ? selectAllLabel : countLabel
  let constraintTitle: string | undefined
  if (minSelected !== undefined && maxSelected !== undefined) {
    constraintTitle = minSelected === maxSelected ? `Select ${minSelected}` : `Select ${minSelected}-${maxSelected}`
  } else if (minSelected !== undefined) {
    constraintTitle = `Select at least ${minSelected}`
  } else if (maxSelected !== undefined) {
    constraintTitle = `Select up to ${maxSelected}`
  }
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
          title={constraintTitle}
          onClick={() => setOpen(o => !o)}
          className={className}
        >
          {display}
        </button>
        {open && (
          <div role='listbox' aria-multiselectable='true' className={panelClass}>
            {canSelectAll && (
              <label className='flex items-center gap-1 px-1 py-0.5 mb-1 pb-1 border-b border-gray-200 font-semibold hover:bg-gray-50 cursor-pointer text-xs whitespace-nowrap'>
                <input
                  type='checkbox'
                  checked={allSelected}
                  onChange={selectAll}
                  className='h-3 w-3'
                />
                {selectAllLabel}
              </label>
            )}
            {selectedItems.map(opt => (
              <label key={opt.value} className='flex items-center gap-1 px-1 py-0.5 hover:bg-gray-50 cursor-pointer text-xs whitespace-nowrap'>
                <input
                  type='checkbox'
                  checked={allSelected ? false : selected.includes(opt.value)}
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
                  checked={allSelected ? false : selected.includes(opt.value)}
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
