'use client'

import { myMergeClasses } from './MyMergeClasses'

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  defaultClass?: string
  overrideClass?: string
  inputName: string
  inputValue: boolean
  onChange: React.ChangeEventHandler<HTMLInputElement>
  labelClass?: string
}

export const MyToggle_dftClass_Shared = [
  'relative',
  'w-11 h-6',
  'rounded-full',
  'bg-gray-400 dark:bg-gray-700',
  'peer peer-checked:after:translate-x-[1.25rem] peer-checked:after:border-white',
  'after:content-[""] after:absolute after:top-0.5 after:left-[2px]',
  'after:bg-white after:border-gray-300 after:border after:rounded-full',
  'after:h-5 after:w-5',
  'after:transition-transform dark:border-gray-600 peer-checked:bg-blue-600',
].join(' ')

export const MyToggle_labelDftClass_Shared = 'inline-flex items-center cursor-pointer'

//----------------------------------------------------------------------------------------------
//  MyToggle — checkbox toggle switch with hidden form input
//----------------------------------------------------------------------------------------------
export function MyToggle({
  defaultClass = MyToggle_dftClass_Shared,
  overrideClass = '',
  inputName,
  inputValue,
  onChange,
  labelClass = MyToggle_labelDftClass_Shared,
  ...rest
}: Props) {
  const className = myMergeClasses(defaultClass, overrideClass)
  const inputValue_string = `${inputValue}`
  const checkbox_name = `checkbox_${inputName}`
  return (
    <>
      <input id={inputName} type='hidden' name={inputName} value={inputValue_string} />
      <label className={labelClass}>
        <input
          type='checkbox'
          id={checkbox_name}
          className='sr-only peer'
          name={checkbox_name}
          checked={inputValue}
          onChange={e => onChange(e)}
          {...rest}
        />
        {/* prettier-ignore */}
        <div className={className}></div>
      </label>
    </>
  )
}
