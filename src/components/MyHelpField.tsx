'use client'

import { useState } from 'react'
import { MyHelpField_triggerDftClass, MyHelpField_tooltipDftClass } from '../constants'

type Props = {
  text: string
  className?: string
  triggerClass?: string
  tooltipClass?: string
}

//----------------------------------------------------------------------------------------------
//  MyHelpField — hover tooltip triggered by a small ? circle
//----------------------------------------------------------------------------------------------
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
