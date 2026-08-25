'use client'

//==============================================================================================
//  1) DESCRIPTION
//    MySelectRows — <select> dropdown of rows-per-page choices, for use alongside MyPagination
//
//    Parameters:
//      value          — current rows-per-page value
//      onChange       — called with the newly-selected number
//      options        — rows-per-page choices; defaults to MySelectRows_optionsDftShared
//      label          — optional label text
//      id             — <select> id; auto-derived from label if omitted (see MySelect)
//      defaultClass   — <select> base classes; defaults to MySelectRows_dftClass
//      overrideClass  — caller classes merged over defaultClass
//      labelClass     — label classes; defaults to MySelect_labelDftClass
//      containerClass — wrapper classes; defaults to MySelect_containerDftClass
//
//  2) NOTES
//    Renders differently depending on how many options there are — there's no single "the
//    dropdown" rendering path:
//      0 options — renders nothing at all (returns null)
//      1 option  — renders a plain static text label ("{n} rows", MySelectRows_staticTextClass)
//                  instead of a <select>, since there's nothing to choose between
//      2+ options — renders the normal interactive <select>, wrapping MySelect
//==============================================================================================

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
