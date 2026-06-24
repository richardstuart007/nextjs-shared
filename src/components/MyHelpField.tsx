'use client'

import { useState } from 'react'

type Props = {
  text: string
  className?: string
  triggerClass?: string
  tooltipClass?: string
}

export const MyHelpField_triggerDftClass_Shared = 'rounded-full w-4 h-4 text-xs font-bold border border-gray-300 text-gray-400 hover:text-blue-600 hover:border-blue-400 flex items-center justify-center flex-shrink-0 cursor-default select-none'
export const MyHelpField_tooltipDftClass_Shared = 'absolute left-0 top-full mt-1 z-50 w-64 bg-blue-50 border border-blue-200 text-gray-700 text-xs rounded px-2 py-1.5 shadow-md pointer-events-none whitespace-normal'

//----------------------------------------------------------------------------------------------
//  MyHelpField — hover tooltip triggered by a small ? circle
//----------------------------------------------------------------------------------------------
export function MyHelpField({
  text,
  className = '',
  triggerClass = MyHelpField_triggerDftClass_Shared,
  tooltipClass = MyHelpField_tooltipDftClass_Shared,
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
