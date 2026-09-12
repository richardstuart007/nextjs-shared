'use client'

//==============================================================================================
//  1) DESCRIPTION
//    MyBox — bordered box with optional title and class overrides; optionally collapsible
//
//    Parameters:
//      title             — optional heading; required (alongside collapsible) to show the
//                          collapse toggle
//      children          — box content
//      className         — box wrapper classes, merged over MyBox_dftClass
//      titleClass        — heading classes; defaults to MyBox_titleDftClass
//      collapsible       — when true (with a title present), renders a click-to-collapse
//                          toggle instead of a static heading; defaults to false
//      defaultOpen       — initial open state when collapsible; defaults to true
//      toggleButtonClass — collapse toggle button classes; defaults to
//                          MyBox_toggleButtonDftClass
//      chevronClass      — collapse chevron icon classes; defaults to MyBox_chevronDftClass
//==============================================================================================

import { useState } from 'react'
import { ChevronDownIcon } from '@heroicons/react/24/outline'
import { myMergeClasses } from './MyMergeClasses'
import { MyBox_dftClass, MyBox_titleDftClass, MyBox_toggleButtonDftClass, MyBox_chevronDftClass } from '../constants'

type Props = {
  title?: string
  children: React.ReactNode
  className?: string
  titleClass?: string
  collapsible?: boolean
  defaultOpen?: boolean
  toggleButtonClass?: string
  chevronClass?: string
}

export default function MyBox({
  title,
  children,
  className: overrideClass = '',
  titleClass = MyBox_titleDftClass,
  collapsible = false,
  defaultOpen = true,
  toggleButtonClass = MyBox_toggleButtonDftClass,
  chevronClass = MyBox_chevronDftClass,
}: Props) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const className = myMergeClasses(MyBox_dftClass, overrideClass)

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
