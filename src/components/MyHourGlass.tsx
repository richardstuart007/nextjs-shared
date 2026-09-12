'use client'

//==============================================================================================
//  1) DESCRIPTION
//    MyHourGlass — animated hourglass emoji spinner
//
//    Parameters:
//      overrideClass — caller classes merged over MyHourGlass_dftClass via myMergeClasses
//==============================================================================================

import { myMergeClasses } from './MyMergeClasses'
import { MyHourGlass_dftClass } from '../constants'

type Props = {
  overrideClass?: string
}

export function MyHourGlass({ overrideClass = '' }: Props) {
  const className = myMergeClasses(MyHourGlass_dftClass, overrideClass)
  return <div className={className}>⏳</div>
}
