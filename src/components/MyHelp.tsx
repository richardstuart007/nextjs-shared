'use client'

import { useState, useRef, useEffect } from 'react'
import { MyHelp_buttonDftClass, MyHelp_panelDftClass, MyHelp_closeButtonDftClass } from '../constants'

export type HelpItem = { heading: string; body: string }

type Props = {
  items?: HelpItem[]
  text?: string
  title?: string
  label?: string
  buttonClass?: string
  panelClass?: string
  closeButtonClass?: string
}

//----------------------------------------------------------------------------------------------
//  MyHelp — toggleable help popover with optional title, plain text, or structured items
//----------------------------------------------------------------------------------------------
export function MyHelp({
  items,
  text,
  title,
  label = '?',
  buttonClass = MyHelp_buttonDftClass,
  panelClass = MyHelp_panelDftClass,
  closeButtonClass = MyHelp_closeButtonDftClass,
}: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  return (
    <span ref={ref} className='inline-block'>
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
          <div className='flex justify-between items-start'>
            {title ? <p className='font-semibold text-blue-800'>{title}</p> : <span />}
            <button onClick={() => setOpen(false)} className={closeButtonClass} type='button' aria-label='Close'>
              ×
            </button>
          </div>
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
