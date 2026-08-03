'use client'

import { myMergeClasses } from './MyMergeClasses'
import { MyInput_dftClass } from '../constants'

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  defaultClass?: string
  overrideClass?: string
}

//----------------------------------------------------------------------------------
//  MyInput — text input with Tailwind class overrides
//----------------------------------------------------------------------------------
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
