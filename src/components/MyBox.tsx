'use client'

import { myMergeClasses } from './MyMergeClasses'
import { MyBox_dftClass, MyBox_titleDftClass } from '../constants'

type Props = {
  title?: string
  children: React.ReactNode
  className?: string
  defaultClass?: string
  titleClass?: string
}

//----------------------------------------------------------------------------------
//  MyBox — bordered box with optional title and class overrides
//----------------------------------------------------------------------------------
export default function MyBox({ title, children, className: overrideClass = '', defaultClass = MyBox_dftClass, titleClass = MyBox_titleDftClass }: Props) {
  const className = myMergeClasses(defaultClass, overrideClass)
  return (
    <div className={className}>
      {title && <h3 className={titleClass}>{title}</h3>}
      {children}
    </div>
  )
}
