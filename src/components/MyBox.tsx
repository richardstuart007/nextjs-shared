'use client'

import { useState } from 'react'
import { ChevronDownIcon } from '@heroicons/react/24/outline'
import { myMergeClasses } from './MyMergeClasses'
import { MyBox_dftClass, MyBox_titleDftClass, MyBox_toggleButtonDftClass, MyBox_chevronDftClass } from '../constants'

type Props = {
  title?: string
  children: React.ReactNode
  className?: string
  defaultClass?: string
  titleClass?: string
  collapsible?: boolean
  defaultOpen?: boolean
  toggleButtonClass?: string
  chevronClass?: string
}

//----------------------------------------------------------------------------------
//  MyBox — bordered box with optional title and class overrides; optionally collapsible
//----------------------------------------------------------------------------------
export default function MyBox({
  title,
  children,
  className: overrideClass = '',
  defaultClass = MyBox_dftClass,
  titleClass = MyBox_titleDftClass,
  collapsible = false,
  defaultOpen = true,
  toggleButtonClass = MyBox_toggleButtonDftClass,
  chevronClass = MyBox_chevronDftClass,
}: Props) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const className = myMergeClasses(defaultClass, overrideClass)

  if (collapsible && title) {
    return (
      <div className={className}>
        <button type='button' onClick={() => setIsOpen(prev => !prev)} className={toggleButtonClass}>
          <h3 className={titleClass}>{title}</h3>
          <ChevronDownIcon className={`${chevronClass} ${isOpen ? 'rotate-0' : '-rotate-90'}`} />
        </button>
        {isOpen && children}
      </div>
    )
  }

  return (
    <div className={className}>
      {title && <h3 className={titleClass}>{title}</h3>}
      {children}
    </div>
  )
}
