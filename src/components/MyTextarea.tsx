'use client'

//==============================================================================================
//  1) DESCRIPTION
//    MyTextarea — textarea with Tailwind class overrides
//
//    Parameters:
//      overrideClass — caller classes merged over MyTextarea_dftClass via myMergeClasses
//      ...rest       — all other standard <textarea> attributes, passed through
//==============================================================================================

import { myMergeClasses } from './MyMergeClasses'
import { MyTextarea_dftClass } from '../constants'

type Props = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  overrideClass?: string
}

export function MyTextarea({ overrideClass = '', ...rest }: Props) {
  //
  // Use the mergeClasses function to combine the classes
  //
  const className = myMergeClasses(MyTextarea_dftClass, overrideClass)
  //
  //  Output
  //
  return <textarea {...rest} className={className} />
}
