'use client'

import { myMergeClasses } from './MyMergeClasses'

type Props = {
  defaultClass?: string
  overrideClass?: string
}

export const MyHourGlass_dftClass_Shared = [
  'text-2xl md:text-4xl',
  'animate-flip',
].join(' ')

//----------------------------------------------------------------------------------------------
//  MyHourGlass — animated hourglass emoji spinner
//----------------------------------------------------------------------------------------------
export function MyHourGlass({ defaultClass = MyHourGlass_dftClass_Shared, overrideClass = '' }: Props) {
  const className = myMergeClasses(defaultClass, overrideClass)
  return <div className={className}>⏳</div>
}
