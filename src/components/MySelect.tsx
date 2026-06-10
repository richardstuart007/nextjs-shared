'use client'

import { myMergeClasses } from './MyMergeClasses'

interface Props extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  options?: string[]
  overrideClass?: string
  labelClass?: string
}

export default function MySelect({ label, options = [], overrideClass = '', labelClass = 'font-bold text-xs whitespace-nowrap', children, id, ...rest }: Props) {
  const autoId = id ?? (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)
  const defaultClass = [
    'py-1 px-2',
    'text-sm',
    'w-72',
    'border border-blue-500 rounded-md',
    'focus:outline-none focus:ring-1 focus:ring-blue-500',
  ].join(' ')
  const classValue = myMergeClasses(defaultClass, overrideClass)
  return (
    <div className='flex items-center gap-2'>
      {label && <label htmlFor={autoId} className={labelClass}>{label}</label>}
      <select id={autoId} className={classValue} {...rest}>
        {options.length > 0
          ? options.map(opt => <option key={opt} value={opt}>{opt}</option>)
          : children}
      </select>
    </div>
  )
}
