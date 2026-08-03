'use client'

import { myMergeClasses } from './MyMergeClasses'
import { MyButton_dftClass } from '../constants'

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  children: React.ReactNode
  defaultClass?: string
  overrideClass?: string
}

//----------------------------------------------------------------------------------
//  MyButton — styled button with Tailwind class overrides
//----------------------------------------------------------------------------------
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
