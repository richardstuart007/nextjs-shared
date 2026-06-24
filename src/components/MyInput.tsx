'use client'

import { myMergeClasses } from './MyMergeClasses'

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  defaultClass?: string
  overrideClass?: string
}

export const MyInput_dftClass_Shared = [
  'h-6 md:h-8',
  'px-1 md:px-2',
  'font-normal text-xs',
  'rounded-md',
  'border border-blue-500',
  'focus:border-1 focus:border-blue-500',
  'hover:border-1 hover:border-blue-500',
  'aria-disabled:cursor-not-allowed aria-disabled:opacity-50',
].join(' ')

//----------------------------------------------------------------------------------
//  MyInput — text input with Tailwind class overrides
//----------------------------------------------------------------------------------
export function MyInput({ defaultClass = MyInput_dftClass_Shared, overrideClass = '', ...rest }: Props) {
  //
  // Use the mergeClasses function to combine the classes
  //
  const className = myMergeClasses(defaultClass, overrideClass)
  //
  //  Output
  //
  return <input {...rest} className={className} suppressHydrationWarning />
}
