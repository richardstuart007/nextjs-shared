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

type Props = React.SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string
  options?: string[]
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
  //  Add the optional blank option, then filter by the search term
  //----------------------------------------------------------------------------------------------
  const updatedOptions = useMemo(() => {
    const result = includeBlank ? ['', ...options] : options
    return result
  }, [includeBlank, options])

  const filteredOptions = useMemo(() => {
    const result = searchEnabled
      ? updatedOptions.filter(opt => opt.toLowerCase().includes(searchTerm.toLowerCase()))
      : updatedOptions
    return result
  }, [updatedOptions, searchEnabled, searchTerm])

  //----------------------------------------------------------------------------------------------
  //  Auto-select the sole remaining option once search narrows the list to one match
  //----------------------------------------------------------------------------------------------
  useEffect(() => {
    if (searchEnabled && filteredOptions.length === 1 && value !== filteredOptions[0] && onChange) {
      const syntheticEvent = {
        target: { value: filteredOptions[0] }
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
            ? filteredOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)
            : children}
        </select>
      </div>
    </div>
  )
}
