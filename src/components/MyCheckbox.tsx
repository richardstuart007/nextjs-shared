'use client'

import { useState, useMemo } from 'react'
import { myMergeClasses } from './MyMergeClasses'
import { MyInput } from './MyInput'
import { MyButton } from './MyButton'

//
//  Define the options
//
type CheckBoxProps = {
  selectedOptions: Array<string | number>
  setSelectedOptions: (value: Array<string | number>) => void
  options: Array<{ value: string | number; label: string }>
  searchEnabled?: boolean
  name: string
  label?: string
  defaultClass_Label?: string
  defaultClass_Search?: string
  defaultClass_Container?: string
  defaultClass_CheckboxItem?: string
  overrideClass_Label?: string
  overrideClass_Search?: string
  overrideClass_Container?: string
  overrideClass_CheckboxItem?: string
  showSelectedCount?: boolean
  maxSelections?: number
  minSelections?: number
  showResortButton?: boolean
  sortBy?: 'value' | 'label'
}

export const MyCheckbox_labelDftClass_Shared     = 'block text-gray-900 mb-1 text-xs w-72'
export const MyCheckbox_searchDftClass_Shared    = 'px-2 rounded-md border border-blue-500 py-[6px] text-xs w-72'
export const MyCheckbox_containerDftClass_Shared = 'border border-blue-500 rounded-md p-2 overflow-y-auto w-72'
export const MyCheckbox_itemDftClass_Shared      = 'flex items-center space-x-2 py-1'

export default function MyCheckBox({
  selectedOptions = [],
  setSelectedOptions,
  options = [],
  searchEnabled = false,
  name,
  label,
  defaultClass_Label = MyCheckbox_labelDftClass_Shared,
  defaultClass_Search = MyCheckbox_searchDftClass_Shared,
  defaultClass_Container = MyCheckbox_containerDftClass_Shared,
  defaultClass_CheckboxItem = MyCheckbox_itemDftClass_Shared,
  overrideClass_Label = '',
  overrideClass_Search = '',
  overrideClass_Container = '',
  overrideClass_CheckboxItem = '',
  showSelectedCount = true,
  maxSelections,
  minSelections,
  showResortButton = true,
  sortBy = 'label'
}: CheckBoxProps) {
  //----------------------------------------------------------------------------------------------
  //  STATE DECLARATIONS
  //----------------------------------------------------------------------------------------------
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [showSelectedFirst, setShowSelectedFirst] = useState<boolean>(false)
  const [error, setError] = useState<string>('')

  //----------------------------------------------------------------------------------------------
  //  Sort options based on sortBy prop
  //----------------------------------------------------------------------------------------------
  const sortedOptions = useMemo(() => {
    const result = [...options].sort((a, b) => {
      if (sortBy === 'value') {
        if (typeof a.value === 'number' && typeof b.value === 'number') {
          return a.value - b.value
        }
        return String(a.value).localeCompare(String(b.value))
      } else {
        return a.label.localeCompare(b.label)
      }
    })
    return result
  }, [options, sortBy])

  //----------------------------------------------------------------------------------------------
  //  className Labels
  //----------------------------------------------------------------------------------------------
  const className_Label = myMergeClasses(defaultClass_Label, overrideClass_Label)
  const className_Search = myMergeClasses(defaultClass_Search, overrideClass_Search)
  const className_Container = myMergeClasses(defaultClass_Container, overrideClass_Container)
  const className_CheckboxItem = myMergeClasses(defaultClass_CheckboxItem, overrideClass_CheckboxItem)
  const className_ResortButton = 'text-[10px] px-1 py-0 h-5 bg-green-500 hover:bg-green-600'

  //----------------------------------------------------------------------------------------------
  //  filteredOptions - Filters and optionally shows selected first
  //----------------------------------------------------------------------------------------------
  const filteredOptions = useMemo(
    () => {
      //
      //  Filter options based on search term
      //
      const filtered = sortedOptions.filter(option =>
        option.label.toLowerCase().includes(searchTerm.toLowerCase())
      )

      if (!showSelectedFirst) {
        return filtered
      }

      //
      //  Separate selected and unselected
      //
      const selected = filtered.filter(option => selectedOptions.includes(option.value))
      const unselected = filtered.filter(option => !selectedOptions.includes(option.value))

      //
      //  Sort both arrays by the same sortBy rule
      //
      function sortFn(
        a: { value: string | number; label: string },
        b: { value: string | number; label: string }
      ) {
        if (sortBy === 'value') {
          if (typeof a.value === 'number' && typeof b.value === 'number') {
            return a.value - b.value
          }
          return String(a.value).localeCompare(String(b.value))
        } else {
          return a.label.localeCompare(b.label)
        }
      }

      selected.sort(sortFn)
      unselected.sort(sortFn)

      //
      //  Return selected first, then unselected
      //
      const result = [...selected, ...unselected]
      return result
    },
    [sortedOptions, searchTerm, selectedOptions, showSelectedFirst, sortBy]
  )

  //----------------------------------------------------------------------------------------------
  //  sortSelected - Sorts selected options by their labels
  //----------------------------------------------------------------------------------------------
  function sortSelected(selected: Array<string | number>): Array<string | number> {
    //
    //  Create a map of value to label for quick lookup
    //
    const valueToLabel = new Map<string | number, string>()
    options.forEach(option => {
      valueToLabel.set(option.value, option.label)
    })

    const result = [...selected].sort((a, b) => {
      const labelA = valueToLabel.get(a) || String(a)
      const labelB = valueToLabel.get(b) || String(b)
      return labelA.localeCompare(labelB)
    })
    return result
  }

  //----------------------------------------------------------------------------------------------
  //  handleCheckboxChange - Handles checkbox selection with min/max validation
  //----------------------------------------------------------------------------------------------
  function handleCheckboxChange(value: string | number, checked: boolean) {
    //
    //  Clear previous errors
    //
    setError('')

    if (checked) {
      //
      //  Check max selection limit
      //
      if (maxSelections !== undefined && selectedOptions.length >= maxSelections) {
        setError(`Maximum ${maxSelections} selection${maxSelections !== 1 ? 's' : ''} allowed`)
        return
      }
      const newSelection = [...selectedOptions, value]
      setSelectedOptions(sortSelected(newSelection))
    }
    //
    //  Check min selection limit before removing
    //
    else {
      if (minSelections !== undefined && selectedOptions.length <= minSelections) {
        setError(`Minimum ${minSelections} selection${minSelections !== 1 ? 's' : ''} required`)
        return
      }
      //
      //  Save the changes
      //
      const newSelection = selectedOptions.filter(item => item !== value)
      setSelectedOptions(sortSelected(newSelection))
    }
  }

  //----------------------------------------------------------------------------------------------
  //  isSelected - Checks if a value is in the selectedOptions array
  //----------------------------------------------------------------------------------------------
  function isSelected(value: string | number): boolean {
    const result = selectedOptions.includes(value)
    return result
  }

  //----------------------------------------------------------------------------------------------
  //  renderHiddenInputs - Renders hidden inputs for form submission
  //----------------------------------------------------------------------------------------------
  function renderHiddenInputs() {
    const result = selectedOptions.map((value, index) => (
      <input key={`${name}_${index}`} type='hidden' name={`${name}[]`} value={value} />
    ))
    return result
  }

  //----------------------------------------------------------------------------------------------
  //  renderCheckboxes - Main render function for checkbox group
  //----------------------------------------------------------------------------------------------
  function renderCheckboxes() {
    return (
      <div className='font-medium'>
        {/* Label */}
        {label && (
          <label className={className_Label} htmlFor={name}>
            {label}
          </label>
        )}

        {/* Resort Button */}
        {showResortButton && (
          <div className='flex justify-start mb-2'>
            <MyButton
              overrideClass={className_ResortButton}
              onClick={e => {
                e.preventDefault()
                setShowSelectedFirst(!showSelectedFirst)
              }}
            >
              {showSelectedFirst ? 'Show Original Order' : 'Show Selected First'}
            </MyButton>
          </div>
        )}

        {/* Search Input */}
        {searchEnabled && (
          <MyInput
            overrideClass={className_Search}
            type='text'
            placeholder='Search...'
            value={searchTerm}
            onChange={e => {
              setSearchTerm(e.target.value)
            }}
          />
        )}

        {/* Hidden inputs for form submission */}
        {renderHiddenInputs()}

        {/* Checkbox Group */}
        <div className={className_Container}>
          {filteredOptions.length > 0 ? (
            filteredOptions.map(option => (
              <label key={option.value} className={className_CheckboxItem}>
                <input
                  type='checkbox'
                  value={option.value}
                  checked={isSelected(option.value)}
                  onChange={e => {
                    handleCheckboxChange(option.value, e.target.checked)
                  }}
                  className='h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500'
                />
                <span className='text-xs text-gray-900 cursor-pointer'>{option.label}</span>
              </label>
            ))
          ) : (
            <p className='text-xs text-gray-500'>No options found</p>
          )}
        </div>

        {/* Error message */}
        {error && <p className='text-xs text-red-600 mt-1'>{error}</p>}

        {/* Selected count */}
        {showSelectedCount && (
          <p className='text-xs text-gray-500 mt-1'>
            {selectedOptions.length} item{selectedOptions.length !== 1 ? 's' : ''} selected
            {minSelections !== undefined && ` (min: ${minSelections})`}
            {maxSelections !== undefined ? ` (max: ${maxSelections})` : ' (max: unlimited)'}
          </p>
        )}
      </div>
    )
  }

  //----------------------------------------------------------------------------------------------
  //  RETURN
  //----------------------------------------------------------------------------------------------
  if (options.length === 0) return <p className='font-medium text-xs'>No options available</p>
  const checkboxes = renderCheckboxes()
  return checkboxes
}
