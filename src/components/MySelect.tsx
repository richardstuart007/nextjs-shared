'use client'

import { myMergeClasses } from './MyMergeClasses'

type Props = React.SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string
  options?: string[]
  defaultClass?: string
  overrideClass?: string
  labelClass?: string
  containerClass?: string
}

export const MySelect_dftClass_Shared = [
  'h-6 md:h-8 w-72',
  'py-1 px-1 md:px-2',
  'text-xs',
  'rounded-md',
  'border border-blue-500',
  'focus:border-1 focus:border-blue-500',
  'hover:border-blue-500',
  'transition-colors',
  'aria-disabled:cursor-not-allowed aria-disabled:opacity-50',
].join(' ')

export const MySelect_labelDftClass_Shared     = 'font-bold text-xs whitespace-nowrap'
export const MySelect_containerDftClass_Shared = 'flex items-center gap-2'

//----------------------------------------------------------------------------------
//  MySelect — labelled select with optional string options or children
//----------------------------------------------------------------------------------
export default function MySelect({
  label,
  options = [],
  defaultClass = MySelect_dftClass_Shared,
  overrideClass = '',
  labelClass = MySelect_labelDftClass_Shared,
  containerClass = MySelect_containerDftClass_Shared,
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
