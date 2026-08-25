'use client'

//==============================================================================================
//  1) DESCRIPTION
//    MyButton — styled button with Tailwind class overrides
//
//    Parameters:
//      children      — button contents
//      defaultClass  — base Tailwind classes; defaults to MyButton_dftClass
//      overrideClass — caller classes merged over defaultClass via myMergeClasses
//      ...rest       — all other standard <button> attributes, passed through
//==============================================================================================

import { myMergeClasses } from './MyMergeClasses'
import { MyButton_dftClass } from '../constants'

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  children: React.ReactNode
  defaultClass?: string
  overrideClass?: string
}

export function MyButton({ children, defaultClass = MyButton_dftClass, overrideClass = '', ...rest }: Props) {
  const className = myMergeClasses(defaultClass, overrideClass)
  //
  //  Output
  //
  return (
    <button {...rest} className={className}>
      {children}
    </button>
  )
}
