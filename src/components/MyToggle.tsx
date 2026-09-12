'use client'

//==============================================================================================
//  1) DESCRIPTION
//    MyToggle — checkbox toggle switch with hidden form input
//
//    Parameters:
//      overrideClass — caller classes merged over MyToggle_dftClass
//      inputName     — name of the hidden form input carrying the boolean value
//      inputValue    — current checked state
//      onChange      — checkbox change handler
//      labelClass    — wrapping <label> classes; defaults to MyToggle_labelDftClass
//      ...rest       — all other standard <input> attributes, passed through to the checkbox
//==============================================================================================

import { myMergeClasses } from './MyMergeClasses'
import { MyToggle_dftClass, MyToggle_labelDftClass } from '../constants'

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  overrideClass?: string
  inputName: string
  inputValue: boolean
  onChange: React.ChangeEventHandler<HTMLInputElement>
  labelClass?: string
}

export function MyToggle({
  overrideClass = '',
  inputName,
  inputValue,
  onChange,
  labelClass = MyToggle_labelDftClass,
  ...rest
}: Props) {
  const className = myMergeClasses(MyToggle_dftClass, overrideClass)
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
