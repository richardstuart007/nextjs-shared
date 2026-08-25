'use client'

//==============================================================================================
//  1) DESCRIPTION
//    MyHelpField — hover tooltip triggered by a small ? circle
//
//    Parameters:
//      text         — tooltip body text
//      className    — outer <span> wrapper classes; defaults to empty
//      triggerClass — the "?" trigger's classes; defaults to MyHelpField_triggerDftClass
//      tooltipClass — the tooltip popover's classes; defaults to MyHelpField_tooltipDftClass
//==============================================================================================

import { useState } from 'react'
import { MyHelpField_triggerDftClass, MyHelpField_tooltipDftClass } from '../constants'

type Props = {
  text: string
  className?: string
  triggerClass?: string
  tooltipClass?: string
}

export function MyHelpField({
  text,
  className = '',
  triggerClass = MyHelpField_triggerDftClass,
  tooltipClass = MyHelpField_tooltipDftClass,
}: Props) {
  const [show, setShow] = useState(false)
  return (
    <span className={className}>
      <span className='relative inline-flex items-center'>
        <span
          onMouseEnter={() => setShow(true)}
          onMouseLeave={() => setShow(false)}
          className={triggerClass}
        >
          ?
        </span>
        {show && (
          <div className={tooltipClass}>
            {text}
          </div>
        )}
      </span>
    </span>
  )
}
