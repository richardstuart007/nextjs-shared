'use client'

import MySelect from './MySelect'
import { MySelectRows_optionsDftShared, MySelectRows_dftClass } from '../constants'

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
//  MySelectRows — <select> dropdown of rows-per-page choices, for use alongside MyPagination
//----------------------------------------------------------------------------------
export default function MySelectRows({
  value,
  onChange,
  options = MySelectRows_optionsDftShared,
  label,
  id,
  defaultClass = MySelectRows_dftClass,
  overrideClass,
  labelClass,
  containerClass
}: Props) {
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
