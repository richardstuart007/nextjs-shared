import { useState, useEffect, useCallback, useMemo } from 'react'
import { myMergeClasses } from './MyMergeClasses'
import { table_fetch, table_fetch_Props } from '../tables/tableGeneric/table_fetch'
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
  overrideClass_Label?: string
  overrideClass_Search?: string
  overrideClass_Dropdown?: string
  includeBlank?: boolean
}

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
  overrideClass_Label = 'w-72',
  overrideClass_Search = 'w-72',
  overrideClass_Dropdown = 'w-72',
  includeBlank = false
}: DropdownProps<T, U>) {
  const functionName = 'MyDropdown'
  //
  //  State
  //
  const [dropdownOptions, setDropdownOptions] = useState<
    { value: string | number; label: string }[]
  >([])
  //
  //  Add the optional blank option
  //
  const updatedOptions = useMemo(
    () => (includeBlank ? [{ value: '', label: '' }, ...dropdownOptions] : dropdownOptions),
    [includeBlank, dropdownOptions]
  )
  //
  // Filter options based on search term
  //
  const [searchTerm, setSearchTerm] = useState<string>('')
  const filteredOptions = useMemo(
    () =>
      updatedOptions.filter(option =>
        option.label.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [updatedOptions, searchTerm]
  )

  const [loading, setLoading] = useState(true)
  //---------------------------------------------------------------------
  //  Determine Classes
  //---------------------------------------------------------------------
  //
  //  Determine Class - Label
  //
  const className_Label = myMergeClasses('block text-gray-900 mb-1 text-xs', overrideClass_Label)
  //
  //  Determine Class - Search
  //
  const className_Search = myMergeClasses(
    'px-2 rounded-md border border-blue-500 py-[6px] text-xs',
    overrideClass_Search
  )
  //
  //  Determine Class - Dropdown
  //
  const className_Dropdown = myMergeClasses(
    'px-2 rounded-md border border-blue-500 py-[2px] text-xs',
    overrideClass_Dropdown
  )
  //---------------------------------------------------------------------
  //  Filter Options
  //---------------------------------------------------------------------
  //
  // If there's only one option, set it as the selected option
  //
  useEffect(() => {
    if (filteredOptions.length === 1 && selectedOption !== filteredOptions[0].value) {
      const value = filteredOptions[0].value
      const valueUpdate = isNaN(Number(value)) ? value : Number(value)
      setSelectedOption(valueUpdate)
    }
  }, [filteredOptions, selectedOption, setSelectedOption])
  //---------------------------------------------------------------------
  //  Fetch dropdown options
  //---------------------------------------------------------------------
  const fetchOptions = useCallback(
    async function () {
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
          const fetchParams: any = {
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
        console.error('Error fetching dropdown options:', error)
      } finally {
        setLoading(false)
      }
    },
    [optionValue, optionLabel, tableData, table, tableColumn, tableColumnValue, orderBy]
  )
  //---------------------------------------------------------------------
  //  Fetch options on component mount and whenever dependencies change
  //---------------------------------------------------------------------
  useEffect(() => {
    fetchOptions()
  }, [fetchOptions])
  //---------------------------------------------------------------------
  //  Update the selected value if only one
  //---------------------------------------------------------------------
  useEffect(() => {
    if (dropdownOptions.length === 1) {
      setSelectedOption(dropdownOptions[0].value)
    }
  }, [dropdownOptions, setSelectedOption])
  //---------------------------------------------------------------------
  //  Loading
  //---------------------------------------------------------------------
  function renderLoadingState() {
    return <p className='font-medium'>Loading options...</p>
  }
  //---------------------------------------------------------------------
  //  No options
  //---------------------------------------------------------------------
  function renderEmptyState() {
    return <p className='font-medium'>No options available</p>
  }
  //---------------------------------------------------------------------
  //  One option
  //---------------------------------------------------------------------
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
  //---------------------------------------------------------------------
  //  Select option
  //---------------------------------------------------------------------
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
              const valueUpdate = isNaN(Number(value)) ? value : Number(value)
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
  //---------------------------------------------------------------------
  //  Return based on state
  //---------------------------------------------------------------------
  if (loading) return renderLoadingState()
  if (dropdownOptions.length === 0) return renderEmptyState()
  if (dropdownOptions.length === 1) return renderSingleOption()
  return renderDropdown()
}
