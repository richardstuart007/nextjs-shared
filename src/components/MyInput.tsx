'use client'

//==============================================================================================
//  1) DESCRIPTION
//    MyInput — text input with Tailwind class overrides
//
//    Parameters:
//      defaultClass  — base Tailwind classes; defaults to MyInput_dftClass
//      overrideClass — caller classes merged over defaultClass via myMergeClasses
//      ...rest       — all other standard <input> attributes, passed through
//==============================================================================================

import { myMergeClasses } from './MyMergeClasses'
import { MyInput_dftClass } from '../constants'

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  defaultClass?: string
  overrideClass?: string
}

export function MyInput({ defaultClass = MyInput_dftClass, overrideClass = '', ...rest }: Props) {
  //
  // Use the mergeClasses function to combine the classes
  //
  const className = myMergeClasses(defaultClass, overrideClass)
  //
  //  Output
  //
  return <input {...rest} className={className} suppressHydrationWarning />
}
