'use client'

import { myMergeClasses } from './MyMergeClasses'

type Props = {
  title?: string
  children: React.ReactNode
  className?: string
  defaultClass?: string
  titleClass?: string
}

export const MyBox_titleDftClass_Shared = 'text-xs font-bold mb-2'

//----------------------------------------------------------------------------------
//  MyBox — bordered box with optional title and class overrides
//----------------------------------------------------------------------------------
export const MyBox_dftClass_Shared = [
  'rounded-lg',
  'border border-gray-300',
  'p-2 md:p-3',
  'mb-3',
].join(' ')

export default function MyBox({ title, children, className: overrideClass = '', defaultClass = MyBox_dftClass_Shared, titleClass = MyBox_titleDftClass_Shared }: Props) {
  const className = myMergeClasses(defaultClass, overrideClass)
  return (
    <div className={className}>
      {title && <h3 className={titleClass}>{title}</h3>}
      {children}
    </div>
  )
}
