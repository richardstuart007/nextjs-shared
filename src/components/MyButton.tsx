'use client'

import { myMergeClasses } from './MyMergeClasses'

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  children: React.ReactNode
  defaultClass?: string
  overrideClass?: string
}

//
//  Default class
//
export const MyButton_dftClass_Shared = [
  'flex items-center justify-center',
  'h-6 md:h-8',
  'px-1 md:px-2',
  'font-normal text-xs text-white',
  'rounded-md',
  'bg-blue-500 hover:bg-blue-600',
  'transition-colors',
  'cursor-pointer',
  'focus-visible:outline focus-visible:outline-blue-500',
  'aria-disabled:cursor-not-allowed aria-disabled:opacity-50',
].join(' ')

//----------------------------------------------------------------------------------
//  MyButton — styled button with Tailwind class overrides
//----------------------------------------------------------------------------------
export function MyButton({ children, defaultClass = MyButton_dftClass_Shared, overrideClass = '', ...rest }: Props) {
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
