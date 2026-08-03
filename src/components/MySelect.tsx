'use client'

import { myMergeClasses } from './MyMergeClasses'
import { MySelect_dftClass, MySelect_labelDftClass, MySelect_containerDftClass } from '../constants'

type Props = React.SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string
  options?: string[]
  defaultClass?: string
  overrideClass?: string
  labelClass?: string
  containerClass?: string
}

//----------------------------------------------------------------------------------
//  MySelect — labelled select with optional string options or children
//----------------------------------------------------------------------------------
export default function MySelect({
  label,
  options = [],
  defaultClass = MySelect_dftClass,
  overrideClass = '',
  labelClass = MySelect_labelDftClass,
  containerClass = MySelect_containerDftClass,
  children,
  id,
  ...rest
}: Props) {
  const autoId = id ?? (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)
  const className = myMergeClasses(defaultClass, overrideClass)
  return (
    <div className={containerClass}>
      {label && <label htmlFor={autoId} className={labelClass}>{label}</label>}
      <select id={autoId} className={className} suppressHydrationWarning {...rest}>
        {options.length > 0
          ? options.map(opt => <option key={opt} value={opt}>{opt}</option>)
          : children}
      </select>
    </div>
  )
}
