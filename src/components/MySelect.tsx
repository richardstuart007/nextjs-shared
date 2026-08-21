'use client'

import { useEffect, useMemo, useState } from 'react'
import { myMergeClasses } from './MyMergeClasses'
import { MyInput } from './MyInput'
import {
  MySelect_dftClass,
  MySelect_labelDftClass,
  MySelect_containerDftClass,
  MySelect_searchDftClass
} from '../constants'

export type MySelectOption = string | { value: string; label: string }

type Props = React.SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string
  options?: MySelectOption[]
  searchEnabled?: boolean
  includeBlank?: boolean
  defaultClass?: string
  overrideClass?: string
  labelClass?: string
  containerClass?: string
  searchClass?: string
}

//----------------------------------------------------------------------------------
//  MySelect — labelled select with optional string options or children
//----------------------------------------------------------------------------------
export default function MySelect({
  label,
  options = [],
  searchEnabled = false,
  includeBlank = false,
  defaultClass = MySelect_dftClass,
  overrideClass = '',
  labelClass = MySelect_labelDftClass,
  containerClass = MySelect_containerDftClass,
  searchClass = MySelect_searchDftClass,
  children,
  id,
  value,
  onChange,
  ...rest
}: Props) {
  const [searchTerm, setSearchTerm] = useState<string>('')
  const autoId = id ?? (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)
  const className = myMergeClasses(defaultClass, overrideClass)

  //----------------------------------------------------------------------------------------------
  //  Normalize options to {value,label}, add the optional blank option, then filter by search term
  //----------------------------------------------------------------------------------------------
  const normalizedOptions = useMemo(() => options.map(normalizeOption), [options])

  const updatedOptions = useMemo(() => {
    const result = includeBlank
      ? [{ value: '', label: '' }, ...normalizedOptions]
      : normalizedOptions
    return result
  }, [includeBlank, normalizedOptions])

  const filteredOptions = useMemo(() => {
    const result = searchEnabled
      ? updatedOptions.filter(opt => opt.label.toLowerCase().includes(searchTerm.toLowerCase()))
      : updatedOptions
    return result
  }, [updatedOptions, searchEnabled, searchTerm])

  //----------------------------------------------------------------------------------------------
  //  Auto-select the sole remaining option once search narrows the list to one match
  //----------------------------------------------------------------------------------------------
  useEffect(() => {
    if (
      searchEnabled &&
      filteredOptions.length === 1 &&
      value !== filteredOptions[0].value &&
      onChange
    ) {
      const syntheticEvent = {
        target: { value: filteredOptions[0].value }
      } as React.ChangeEvent<HTMLSelectElement>
      onChange(syntheticEvent)
    }
  }, [searchEnabled, filteredOptions, value, onChange])

  return (
    <div className={containerClass}>
      {label && <label htmlFor={autoId} className={labelClass}>{label}</label>}
      <div className='flex flex-col gap-1'>
        {searchEnabled && options.length > 0 && (
          <MyInput
            overrideClass={searchClass}
            type='text'
            placeholder='Search...'
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        )}
        <select
          id={autoId}
          className={className}
          suppressHydrationWarning
          value={value}
          onChange={onChange}
          {...rest}
        >
          {options.length > 0
            ? filteredOptions.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))
            : children}
        </select>
      </div>
    </div>
  )
}

function normalizeOption(opt: MySelectOption): { value: string; label: string } {
  const result = typeof opt === 'string' ? { value: opt, label: opt } : opt
  return result
}
