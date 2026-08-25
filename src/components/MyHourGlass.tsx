'use client'

//==============================================================================================
//  1) DESCRIPTION
//    MyHourGlass — animated hourglass emoji spinner
//
//    Parameters:
//      defaultClass  — base Tailwind classes; defaults to MyHourGlass_dftClass
//      overrideClass — caller classes merged over defaultClass via myMergeClasses
//==============================================================================================

import { myMergeClasses } from './MyMergeClasses'
import { MyHourGlass_dftClass } from '../constants'

type Props = {
  defaultClass?: string
  overrideClass?: string
}

export function MyHourGlass({ defaultClass = MyHourGlass_dftClass, overrideClass = '' }: Props) {
  const className = myMergeClasses(defaultClass, overrideClass)
  return <div className={className}>⏳</div>
}
