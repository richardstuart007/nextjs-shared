'use client'

import { myMergeClasses } from './MyMergeClasses'

type Props = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  defaultClass?: string
  overrideClass?: string
}

export const MyTextarea_dftClass_Shared = [
  'h-24',
  'px-1 md:px-2',
  'font-normal text-xs',
  'rounded-md',
  'border border-blue-500',
  'focus:border-1 focus:border-blue-500',
  'hover:border-1 hover:border-blue-500',
  'aria-disabled:cursor-not-allowed aria-disabled:opacity-50',
  'resize-y',
].join(' ')

//----------------------------------------------------------------------------------
//  MyTextarea — textarea with Tailwind class overrides
//----------------------------------------------------------------------------------
export function MyTextarea({ defaultClass = MyTextarea_dftClass_Shared, overrideClass = '', ...rest }: Props) {
  //
  // Use the mergeClasses function to combine the classes
  //
  const className = myMergeClasses(defaultClass, overrideClass)
  //
  //  Output
  //
  return <textarea {...rest} className={className} />
}
