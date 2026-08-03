'use client'

import MySelect from './MySelect'
import {
  MySelectRows_optionsDftShared,
  MySelectRows_dftClass,
  MySelectRows_staticTextClass,
  MySelect_labelDftClass,
  MySelect_containerDftClass
} from '../constants'

type Props = {
  value: number
  onChange: (value: number) => void
  options?: readonly number[]
  label?: string
  id?: string
  defaultClass?: string
  overrideClass?: string
  labelClass?: string
  containerClass?: string
}

//----------------------------------------------------------------------------------
//  MySelectRows — <select> dropdown of rows-per-page choices, for use alongside MyPagination.
//  Renders a plain static label instead of a dropdown when there's nothing to choose between
//  (0 or 1 options).
//----------------------------------------------------------------------------------
export default function MySelectRows({
  value,
  onChange,
  options = MySelectRows_optionsDftShared,
  label,
  id,
  defaultClass = MySelectRows_dftClass,
  overrideClass,
  labelClass = MySelect_labelDftClass,
  containerClass = MySelect_containerDftClass
}: Props) {
  if (options.length === 0) return null

  if (options.length === 1) {
    return (
      <div className={containerClass}>
        {label && <span className={labelClass}>{label}</span>}
        <span className={MySelectRows_staticTextClass}>{options[0]} rows</span>
      </div>
    )
  }

  return (
    <MySelect
      label={label}
      id={id}
      value={value}
      onChange={e => onChange(parseInt(e.target.value, 10))}
      defaultClass={defaultClass}
      overrideClass={overrideClass}
      labelClass={labelClass}
      containerClass={containerClass}
    >
      {options.map(n => (
        <option key={n} value={n}>
          {n} rows
        </option>
      ))}
    </MySelect>
  )
}
