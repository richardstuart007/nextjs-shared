'use client'

//==============================================================================================
//  1) DESCRIPTION
//    DbKeySelect — dropdown of every configured database connection (env vars starting with
//    POSTGRES_URL_PREFIX). Shared by the Routing Maintenance tab's Add-row form and the Logging
//    tab's DbKey filter, so the option list is fetched and defined in exactly one place.
//
//    Parameters:
//      id, label, labelClass, overrideClass — standard MySelect passthrough props
//      includeBlank — prepends a blank option; defaults to false
//      value        — currently-selected db key
//      onChange     — called with the newly-selected db key
//==============================================================================================

import { useEffect, useState } from 'react'
import MySelect from '../components/MySelect'
import { action_getDbKeyOptions } from './OwnerDbRouting_actions'
import { POSTGRES_URL_PREFIX } from '../constants'

type Props = {
  id?: string
  label?: string
  labelClass?: string
  overrideClass?: string
  includeBlank?: boolean
  value: string
  onChange: (value: string) => void
}

export default function DbKeySelect({
  id,
  label,
  labelClass,
  overrideClass = 'w-40 text-xs',
  includeBlank = false,
  value,
  onChange
}: Props) {
  const [options, setOptions] = useState<string[]>([POSTGRES_URL_PREFIX])

  useEffect(() => {
    fetchOptions()
  }, [])

  return (
    <MySelect
      id={id}
      label={label}
      labelClass={labelClass}
      overrideClass={overrideClass}
      includeBlank={includeBlank}
      options={options}
      value={value}
      onChange={e => onChange(e.target.value)}
    />
  )

  //----------------------------------------------------------------------------------------------
  //  fetchOptions — load every configured database connection
  //----------------------------------------------------------------------------------------------
  async function fetchOptions() {
    const result = await action_getDbKeyOptions()
    setOptions(result)
  }
}
