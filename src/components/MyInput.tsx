'use client'

//==============================================================================================
//  1) DESCRIPTION
//    MyInput — text input with Tailwind class overrides
//
//    Parameters:
//      overrideClass — caller classes merged over MyInput_dftClass via myMergeClasses
//      ...rest       — all other standard <input> attributes, passed through
//==============================================================================================

import { myMergeClasses } from './MyMergeClasses'
import { MyInput_dftClass } from '../constants'

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  overrideClass?: string
}

export function MyInput({ overrideClass = '', ...rest }: Props) {
  //
  // Use the mergeClasses function to combine the classes
  //
  const className = myMergeClasses(MyInput_dftClass, overrideClass)
  //
  //  Output
  //
  return <input {...rest} className={className} suppressHydrationWarning />
}
