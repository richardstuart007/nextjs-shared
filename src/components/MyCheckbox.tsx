// src/ui/components/myCheckbox.tsx
import { useState, useMemo } from 'react'
import { myMergeClasses } from './myMergeClasses'
import { MyInput } from './myInput'
import { MyButton } from './myButton'

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
  overrideClass_Label?: string
  overrideClass_Search?: string
  overrideClass_Container?: string
  overrideClass_CheckboxItem?: string
  showSelectedCount?: boolean
  maxSelections?: number
  minSelections?: number
  showResortButton?: boolean
  sortBy?: 'value' | 'label' // Add sortBy prop
}

export default function MyCheckBox({
  selectedOptions = [],
  setSelectedOptions,
  options = [],
  searchEnabled = false,
  name,
  label,
  overrideClass_Label = 'w-72',
  overrideClass_Search = 'w-72',
  overrideClass_Container = 'w-72',
  overrideClass_CheckboxItem = '',
  showSelectedCount = true,
  maxSelections,
  minSelections,
  showResortButton = true,
  sortBy = 'label'
}: CheckBoxProps) {
  //---------------------------------------------------------------------
  //  STATE DECLARATIONS
  //---------------------------------------------------------------------
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [showSelectedFirst, setShowSelectedFirst] = useState<boolean>(false)
  const [error, setError] = useState<string>('')

  //---------------------------------------------------------------------
  //  Sort options based on sortBy prop
  //---------------------------------------------------------------------
  const sortedOptions = useMemo(() => {
    return [...options].sort((a, b) => {
      if (sortBy === 'value') {
        if (typeof a.value === 'number' && typeof b.value === 'number') {
          return a.value - b.value
        }
        return String(a.value).localeCompare(String(b.value))
      } else {
        return a.label.localeCompare(b.label)
      }
    })
  }, [options, sortBy])

  //---------------------------------------------------------------------
  //  className Labels
  //---------------------------------------------------------------------
  const className_Label = myMergeClasses('block text-gray-900 mb-1 text-xs', overrideClass_Label)
  const className_Search = myMergeClasses(
    'px-2 rounded-md border border-blue-500 py-[6px] text-xs',
    overrideClass_Search
  )
  const className_Container = myMergeClasses(
    'border border-blue-500 rounded-md p-2 overflow-y-auto',
    overrideClass_Container
  )
  const className_CheckboxItem = myMergeClasses(
    'flex items-center space-x-2 py-1',
    overrideClass_CheckboxItem
  )
  const className_ResortButton = myMergeClasses(
    'text-[10px] px-1 py-0 h-5 bg-green-500 hover:bg-green-600',
    ''
  )

  //---------------------------------------------------------------------
  //  filteredOptions - Filters and optionally shows selected first
  //---------------------------------------------------------------------
  const filteredOptions = useMemo(
    function () {
      // Filter options based on search term
      const filtered = sortedOptions.filter(function (option) {
        return option.label.toLowerCase().includes(searchTerm.toLowerCase())
      })

      if (!showSelectedFirst) {
        return filtered
      }

      // Separate selected and unselected
      const selected = filtered.filter(function (option) {
        return selectedOptions.includes(option.value)
      })
      const unselected = filtered.filter(function (option) {
        return !selectedOptions.includes(option.value)
      })

      // Sort both arrays by the same sortBy rule
      const sortFn = function (
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

      // Return selected first, then unselected
      return [...selected, ...unselected]
    },
    [sortedOptions, searchTerm, selectedOptions, showSelectedFirst, sortBy]
  )

  //---------------------------------------------------------------------
  //  sortSelected - Sorts selected options by their labels
  //---------------------------------------------------------------------
  function sortSelected(selected: Array<string | number>): Array<string | number> {
    // Create a map of value to label for quick lookup
    const valueToLabel = new Map<string | number, string>()
    options.forEach(function (option) {
      valueToLabel.set(option.value, option.label)
    })

    return [...selected].sort(function (a, b) {
      const labelA = valueToLabel.get(a) || String(a)
      const labelB = valueToLabel.get(b) || String(b)
      return labelA.localeCompare(labelB)
    })
  }

  //---------------------------------------------------------------------
  //  handleCheckboxChange - Handles checkbox selection with min/max validation
  //---------------------------------------------------------------------
  function handleCheckboxChange(value: string | number, checked: boolean) {
    setError('') // Clear previous errors

    if (checked) {
      //
      // Check max selection limit
      //
      if (maxSelections !== undefined && selectedOptions.length >= maxSelections) {
        setError(`Maximum ${maxSelections} selection${maxSelections !== 1 ? 's' : ''} allowed`)
        return
      }
      const newSelection = [...selectedOptions, value]
      setSelectedOptions(sortSelected(newSelection))
    }
    //
    // Check min selection limit before removing
    //
    else {
      if (minSelections !== undefined && selectedOptions.length <= minSelections) {
        setError(`Minimum ${minSelections} selection${minSelections !== 1 ? 's' : ''} required`)
        return
      }
      //
      //  Save the changes
      //
      const newSelection = selectedOptions.filter(function (item) {
        return item !== value
      })
      setSelectedOptions(sortSelected(newSelection))
    }
  }

  //---------------------------------------------------------------------
  //  isSelected - Checks if a value is in the selectedOptions array
  //---------------------------------------------------------------------
  function isSelected(value: string | number): boolean {
    return selectedOptions.includes(value)
  }

  //---------------------------------------------------------------------
  //  renderHiddenInputs - Renders hidden inputs for form submission
  //---------------------------------------------------------------------
  function renderHiddenInputs() {
    return selectedOptions.map(function (value, index) {
      return <input key={`${name}_${index}`} type='hidden' name={`${name}[]`} value={value} />
    })
  }

  //---------------------------------------------------------------------
  //  renderCheckboxes - Main render function for checkbox group
  //---------------------------------------------------------------------
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
              onClick={function (e) {
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
            onChange={function (e) {
              setSearchTerm(e.target.value)
            }}
          />
        )}

        {/* Hidden inputs for form submission */}
        {renderHiddenInputs()}

        {/* Checkbox Group */}
        <div className={className_Container}>
          {filteredOptions.length > 0 ? (
            filteredOptions.map(function (option) {
              return (
                <label key={option.value} className={className_CheckboxItem}>
                  <input
                    type='checkbox'
                    value={option.value}
                    checked={isSelected(option.value)}
                    onChange={function (e) {
                      handleCheckboxChange(option.value, e.target.checked)
                    }}
                    className='h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500'
                  />
                  <span className='text-xs text-gray-900 cursor-pointer'>{option.label}</span>
                </label>
              )
            })
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

  //---------------------------------------------------------------------
  //  RETURN
  //---------------------------------------------------------------------
  if (options.length === 0) return <p className='font-medium text-xs'>No options available</p>
  return renderCheckboxes()
}
