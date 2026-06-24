'use client'

import { useState } from 'react'

export type HelpItem = { heading: string; body: string }

type Props = {
  items?: HelpItem[]
  text?: string
  title?: string
  label?: string
  buttonClass?: string
  panelClass?: string
}

export const MyHelp_buttonDftClass_Shared = 'text-xs text-blue-600 hover:text-blue-800 border border-blue-300 rounded px-1.5 py-0.5 leading-none'
export const MyHelp_panelDftClass_Shared  = 'absolute z-10 mt-1 p-3 bg-blue-50 border border-blue-200 rounded-md text-xs space-y-2 max-w-md shadow-md'

//----------------------------------------------------------------------------------------------
//  MyHelp — toggleable help popover with optional title, plain text, or structured items
//----------------------------------------------------------------------------------------------
export function MyHelp({
  items,
  text,
  title,
  label = '?',
  buttonClass = MyHelp_buttonDftClass_Shared,
  panelClass = MyHelp_panelDftClass_Shared,
}: Props) {
  const [open, setOpen] = useState(false)
  return (
    <span className='inline-block'>
      <button
        onClick={() => setOpen(o => !o)}
        className={buttonClass}
        aria-expanded={open}
        type='button'
      >
        {label}
      </button>
      {open && (
        <div className={panelClass}>
          {title && <p className='font-semibold text-blue-800'>{title}</p>}
          {text ? (
            <p className='text-gray-600 whitespace-pre-wrap'>{text}</p>
          ) : (
            items?.map((item, i) => (
              <div key={i}>
                <p className='font-semibold text-gray-700'>{item.heading}</p>
                <p className='text-gray-600'>{item.body}</p>
              </div>
            ))
          )}
        </div>
      )}
    </span>
  )
}
