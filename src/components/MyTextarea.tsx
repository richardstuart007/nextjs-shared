'use client'

//==============================================================================================
//  1) DESCRIPTION
//    MyTextarea — textarea with Tailwind class overrides
//
//    Parameters:
//      defaultClass  — base Tailwind classes; defaults to MyTextarea_dftClass
//      overrideClass — caller classes merged over defaultClass via myMergeClasses
//      ...rest       — all other standard <textarea> attributes, passed through
//==============================================================================================

import { myMergeClasses } from './MyMergeClasses'
import { MyTextarea_dftClass } from '../constants'

type Props = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  defaultClass?: string
  overrideClass?: string
}

export function MyTextarea({ defaultClass = MyTextarea_dftClass, overrideClass = '', ...rest }: Props) {
  //
  // Use the mergeClasses function to combine the classes
  //
  const className = myMergeClasses(defaultClass, overrideClass)
  //
  //  Output
  //
  return <textarea {...rest} className={className} />
}
