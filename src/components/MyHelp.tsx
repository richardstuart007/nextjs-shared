'use client'

//==============================================================================================
//  1) DESCRIPTION
//    MyHelp — toggleable help popover with optional title, plain text, or structured items
//
//    Parameters:
//      items                — structured heading+body entries; shown when text is not supplied
//      text                 — plain text body (supports newlines); takes priority over items
//      title                — optional popover heading
//      label                — trigger button label; defaults to '?'
//      showCloseButton      — shows the "×" close button in the panel header; defaults to true
//      closeOnOutsideClick  — closes the panel on an outside click; defaults to true
//      buttonClass          — trigger button classes; defaults to MyHelp_buttonDftClass
//      panelClass           — popover panel classes; defaults to MyHelp_panelDftClass
//      closeButtonClass     — popover close button classes; defaults to
//                             MyHelp_closeButtonDftClass
//
//  2) NOTES
//    The trigger button's own click handler always toggles the panel open/closed, independent
//    of showCloseButton/closeOnOutsideClick — even with both false, the panel is still
//    closeable by clicking the trigger again. Those two props only gate the two *other*
//    dismiss paths (the × button and an outside click).
//
//  3) CHANGE HISTORY
//    2026-08-25 — added showCloseButton/closeOnOutsideClick props (both default true,
//                 preserving the prior unconditional behavior for every existing caller)
//==============================================================================================

import { useState, useRef, useEffect } from 'react'
import { MyHelp_buttonDftClass, MyHelp_panelDftClass, MyHelp_closeButtonDftClass } from '../constants'

export type HelpItem = { heading: string; body: string }

type Props = {
  items?: HelpItem[]
  text?: string
  title?: string
  label?: string
  showCloseButton?: boolean
  closeOnOutsideClick?: boolean
  buttonClass?: string
  panelClass?: string
  closeButtonClass?: string
}

export function MyHelp({
  items,
  text,
  title,
  label = '?',
  showCloseButton = true,
  closeOnOutsideClick = true,
  buttonClass = MyHelp_buttonDftClass,
  panelClass = MyHelp_panelDftClass,
  closeButtonClass = MyHelp_closeButtonDftClass,
}: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (!closeOnOutsideClick) return
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [closeOnOutsideClick])

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
            {showCloseButton && (
              <button onClick={() => setOpen(false)} className={closeButtonClass} type='button' aria-label='Close'>
                ×
              </button>
            )}
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
