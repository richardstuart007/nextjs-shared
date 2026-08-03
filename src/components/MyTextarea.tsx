'use client'

import { myMergeClasses } from './MyMergeClasses'
import { MyTextarea_dftClass } from '../constants'

type Props = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  defaultClass?: string
  overrideClass?: string
}

//----------------------------------------------------------------------------------
//  MyTextarea — textarea with Tailwind class overrides
//----------------------------------------------------------------------------------
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
