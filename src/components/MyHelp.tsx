'use client'

import { useState } from 'react'

export type HelpItem = { heading: string; body: string }

export function MyHelp({
  items,
  text,
  title,
  label = '?',
}: {
  items?: HelpItem[]
  text?: string
  title?: string
  label?: string
}) {
  const [open, setOpen] = useState(false)
  return (
    <span className='inline-block'>
      <button
        onClick={() => setOpen(o => !o)}
        className='text-xs text-blue-600 hover:text-blue-800 border border-blue-300 rounded px-1.5 py-0.5 leading-none'
        aria-expanded={open}
        type='button'
      >
        {label}
      </button>
      {open && (
        <div className='absolute z-10 mt-1 p-3 bg-blue-50 border border-blue-200 rounded-md text-xs space-y-2 max-w-md shadow-md'>
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
