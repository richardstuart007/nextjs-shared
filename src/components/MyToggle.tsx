'use client'

import { myMergeClasses } from './MyMergeClasses'
import { MyToggle_dftClass, MyToggle_labelDftClass } from '../constants'

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  defaultClass?: string
  overrideClass?: string
  inputName: string
  inputValue: boolean
  onChange: React.ChangeEventHandler<HTMLInputElement>
  labelClass?: string
}

//----------------------------------------------------------------------------------------------
//  MyToggle — checkbox toggle switch with hidden form input
//----------------------------------------------------------------------------------------------
export function MyToggle({
  defaultClass = MyToggle_dftClass,
  overrideClass = '',
  inputName,
  inputValue,
  onChange,
  labelClass = MyToggle_labelDftClass,
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
