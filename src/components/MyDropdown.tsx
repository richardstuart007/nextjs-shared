'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { myMergeClasses } from './MyMergeClasses'
import { table_fetch, table_fetch_Props } from '../tables/tableGeneric/table_fetch'
import { write_logging } from '../tables/tableGeneric/write_logging'
import { MyInput } from './MyInput'

//
//  Define the options
//
type RowData<T extends string, U extends string> = Record<T | U, string | number>

type DropdownProps<T extends string, U extends string> = {
  selectedOption: string | number
  setSelectedOption: (value: string | number) => void
  searchEnabled?: boolean
  name: string
  label?: string
  tableData?: Array<RowData<T, U>>
  table?: string
  tableColumn?: string
  tableColumnValue?: string | number
  orderBy?: string
  optionLabel: string
  optionValue: string | number
  defaultClass?: string
  defaultClass_Label?: string
  defaultClass_Search?: string
  overrideClass_Label?: string
  overrideClass_Search?: string
  overrideClass_Dropdown?: string
  includeBlank?: boolean
}

const functionName = 'MyDropdown'
export const MyDropdown_dftClass_Shared = [
  'h-6 md:h-8',
  'py-[2px] px-1 md:px-2',
  'text-xs',
  'rounded-md',
  'border border-blue-500',
  'focus:border-1 focus:border-blue-500',
  'hover:border-blue-500',
  'transition-colors',
  'aria-disabled:cursor-not-allowed aria-disabled:opacity-50',
  'w-72',
].join(' ')
export const MyDropdown_labelDftClass_Shared = 'block text-gray-900 mb-1 text-xs w-72'
export const MyDropdown_searchDftClass_Shared = 'px-2 rounded-md border border-blue-500 py-[6px] text-xs w-72'

//----------------------------------------------------------------------------------
//  MyDropdown — searchable dropdown with optional database fetch
//----------------------------------------------------------------------------------
export default function MyDropdown<T extends string, U extends string>({
  selectedOption,
  setSelectedOption,
  searchEnabled = false,
  name,
  label,
  tableData,
  table,
  tableColumn,
  tableColumnValue,
  orderBy = '',
  optionLabel,
  optionValue,
  defaultClass = MyDropdown_dftClass_Shared,
  defaultClass_Label = MyDropdown_labelDftClass_Shared,
  defaultClass_Search = MyDropdown_searchDftClass_Shared,
  overrideClass_Label = '',
  overrideClass_Search = '',
  overrideClass_Dropdown = '',
  includeBlank = false
}: DropdownProps<T, U>) {
  //----------------------------------------------------------------------------------------------
  //  STATE DECLARATIONS
  //----------------------------------------------------------------------------------------------
  const [dropdownOptions, setDropdownOptions] = useState<
    { value: string | number; label: string }[]
  >([])
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [loading, setLoading] = useState(true)

  //----------------------------------------------------------------------------------------------
  //  Add the optional blank option
  //----------------------------------------------------------------------------------------------
  const updatedOptions = useMemo(() => {
    const result = includeBlank ? [{ value: '', label: '' }, ...dropdownOptions] : dropdownOptions
    return result
  }, [includeBlank, dropdownOptions])

  //----------------------------------------------------------------------------------------------
  //  Filter options based on search term
  //----------------------------------------------------------------------------------------------
  const filteredOptions = useMemo(() => {
    const result = updatedOptions.filter(option =>
      option.label.toLowerCase().includes(searchTerm.toLowerCase())
    )
    return result
  }, [updatedOptions, searchTerm])

  //----------------------------------------------------------------------------------------------
  //  Determine Classes
  //----------------------------------------------------------------------------------------------
  const className_Label = myMergeClasses(defaultClass_Label, overrideClass_Label)
  const className_Search = myMergeClasses(defaultClass_Search, overrideClass_Search)
  const className_Dropdown = myMergeClasses(defaultClass, overrideClass_Dropdown)

  //----------------------------------------------------------------------------------------------
  //  Filter Options - If there's only one option, set it as the selected option
  //----------------------------------------------------------------------------------------------
  useEffect(() => {
    if (filteredOptions.length === 1 && selectedOption !== filteredOptions[0].value) {
      const value = filteredOptions[0].value
      const valueUpdate = value !== '' && !isNaN(Number(value)) ? Number(value) : value
      setSelectedOption(valueUpdate)
    }
  }, [filteredOptions, selectedOption, setSelectedOption])

  //----------------------------------------------------------------------------------------------
  //  Fetch dropdown options
  //----------------------------------------------------------------------------------------------
  const fetchOptions = useCallback(async () => {
    async function determineRows(): Promise<Array<RowData<T, U>>> {
      //
      //  Passed data
      //
      if (tableData) {
        return tableData
      }
      //
      //  Get data
      //
      if (table) {
        const fetchParams = {
          caller: functionName,
          table,
          orderBy: orderBy || optionLabel,
          columns: optionLabel === optionValue ? [optionLabel] : [optionLabel, optionValue],
          distinct: true
        } as table_fetch_Props

        if (tableColumn && tableColumnValue) {
          fetchParams.whereColumnValuePairs = [{ column: tableColumn, value: tableColumnValue }]
        }
        const data = await table_fetch(fetchParams)
        return data
      }
      throw new Error('Either tableData or table must be provided')
    }

    try {
      //
      //  Ensure nothing is displayed whilst loading data
      //
      setLoading(true)
      //
      //  Get the data
      //
      const rows = await determineRows()
      //
      //  Load the options
      //
      const updOptions = rows.map(row => ({
        value: row[optionValue as keyof RowData<T, U>],
        label: row[optionLabel as keyof RowData<T, U>]?.toString() || ''
      }))
      //
      //  Set options
      //
      setDropdownOptions(updOptions)
      //
      //  Errors
      //
    } catch (error) {
      await write_logging({
        lg_functionname: functionName,
        lg_caller: functionName,
        lg_msg: 'Error fetching dropdown options: ' + (error as Error).message,
        lg_severity: 'E'
      })
    } finally {
      setLoading(false)
    }
  }, [optionValue, optionLabel, tableData, table, tableColumn, tableColumnValue, orderBy])

  //----------------------------------------------------------------------------------------------
  //  Fetch options on component mount and whenever dependencies change
  //----------------------------------------------------------------------------------------------
  useEffect(() => {
    fetchOptions()
  }, [fetchOptions])

  //----------------------------------------------------------------------------------------------
  //  Update the selected value if only one
  //----------------------------------------------------------------------------------------------
  useEffect(() => {
    if (dropdownOptions.length === 1) {
      const value = dropdownOptions[0].value
      const valueUpdate = value !== '' && !isNaN(Number(value)) ? Number(value) : value
      setSelectedOption(valueUpdate)
    }
  }, [dropdownOptions, setSelectedOption])

  //----------------------------------------------------------------------------------------------
  //  Loading
  //----------------------------------------------------------------------------------------------
  function renderLoadingState() {
    return <p className='font-medium'>Loading options...</p>
  }

  //----------------------------------------------------------------------------------------------
  //  No options
  //----------------------------------------------------------------------------------------------
  function renderEmptyState() {
    return <p className='font-medium'>No options available</p>
  }

  //----------------------------------------------------------------------------------------------
  //  One option
  //----------------------------------------------------------------------------------------------
  function renderSingleOption() {
    const singleOption = dropdownOptions[0]
    return (
      <div className='font-medium'>
        {label && (
          <label className={className_Label} htmlFor={name}>
            {label}
          </label>
        )}
        <p className={className_Dropdown}>{singleOption.label}</p>
      </div>
    )
  }

  //----------------------------------------------------------------------------------------------
  //  Select option
  //----------------------------------------------------------------------------------------------
  function renderDropdown() {
    return (
      <div className='font-medium'>
        {/*  ...................................................................................*/}
        {/* Label for the dropdown */}
        {/*  ...................................................................................*/}
        {label && (
          <label className={className_Label} htmlFor={name}>
            {label}
          </label>
        )}
        {/*  ...................................................................................*/}
        {/* Search Input */}
        {/*  ...................................................................................*/}
        {searchEnabled && (
          <MyInput
            overrideClass={className_Search}
            type='text'
            placeholder='Search...'
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        )}
        {/*  ...................................................................................*/}
        {/* Dropdown */}
        {/*  ...................................................................................*/}
        <div className='relative'>
          <select
            className={className_Dropdown}
            id={name}
            name={name}
            value={selectedOption}
            onChange={e => {
              const value = e.target.value
              const valueUpdate = value !== '' && !isNaN(Number(value)) ? Number(value) : value
              setSelectedOption(valueUpdate)
            }}
          >
            {filteredOptions.length > 0 ? (
              filteredOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))
            ) : (
              <option className={className_Dropdown} value=''>
                No options found
              </option>
            )}
          </select>
        </div>
      </div>
    )
  }

  //----------------------------------------------------------------------------------------------
  //  Return based on state
  //----------------------------------------------------------------------------------------------
  if (loading) return renderLoadingState()
  if (dropdownOptions.length === 0) return renderEmptyState()
  if (dropdownOptions.length === 1) return renderSingleOption()
  return renderDropdown()
}
