'use client'

//==============================================================================================
//  1) DESCRIPTION
//    MyButton — styled button with Tailwind class overrides
//
//    Parameters:
//      children      — button contents
//      overrideClass — caller classes merged over MyButton_dftClass via myMergeClasses
//      ...rest       — all other standard <button> attributes, passed through
//==============================================================================================

import { myMergeClasses } from './MyMergeClasses'
import { MyButton_dftClass } from '../constants'

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  children: React.ReactNode
  overrideClass?: string
}

export function MyButton({ children, overrideClass = '', ...rest }: Props) {
  const className = myMergeClasses(MyButton_dftClass, overrideClass)
  //
  //  Output
  //
  return (
    <button {...rest} className={className}>
      {children}
    </button>
  )
}
