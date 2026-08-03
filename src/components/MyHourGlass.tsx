'use client'

import { myMergeClasses } from './MyMergeClasses'
import { MyHourGlass_dftClass } from '../constants'

type Props = {
  defaultClass?: string
  overrideClass?: string
}

//----------------------------------------------------------------------------------------------
//  MyHourGlass — animated hourglass emoji spinner
//----------------------------------------------------------------------------------------------
export function MyHourGlass({ defaultClass = MyHourGlass_dftClass, overrideClass = '' }: Props) {
  const className = myMergeClasses(defaultClass, overrideClass)
  return <div className={className}>⏳</div>
}
