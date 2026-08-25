'use client'

//==============================================================================================
//  1) DESCRIPTION
//    MyPopup — modal overlay panel with close button
//
//    Parameters:
//      isOpen                — whether the popup renders at all
//      onClose               — called when the close button (or, if enabled, the
//                              backdrop) is clicked
//      children              — popup body content
//      closeOnBackdropClick  — when true, clicking the overlay outside the panel also
//                              calls onClose; defaults to false
//      defaultClass          — panel base classes; defaults to MyPopup_dftClass
//      overrideClass         — caller classes merged over defaultClass
//      overlayClass          — full-screen backdrop classes; defaults to
//                              MyPopup_overlayDftClass
//      closeButtonClass      — close button classes; defaults to
//                              MyPopup_closeButtonDftClass
//
//  2) NOTES
//    closeOnBackdropClick defaults false (not true) so every existing consumer —
//    including MyConfirmDialog, which renders MyPopup internally — keeps its current
//    behavior unchanged unless it explicitly opts in.
//==============================================================================================

import { ReactNode } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { MyButton } from './MyButton'
import { myMergeClasses } from './MyMergeClasses'
import { MyPopup_dftClass, MyPopup_overlayDftClass, MyPopup_closeButtonDftClass } from '../constants'

type Props = {
  isOpen: boolean
  onClose: () => void
  children: ReactNode
  closeOnBackdropClick?: boolean
  defaultClass?: string
  overrideClass?: string
  overlayClass?: string
  closeButtonClass?: string
}

export default function MyPopup({
  isOpen,
  onClose,
  children,
  closeOnBackdropClick = false,
  defaultClass = MyPopup_dftClass,
  overrideClass = '',
  overlayClass = MyPopup_overlayDftClass,
  closeButtonClass = MyPopup_closeButtonDftClass,
}: Props) {
  if (!isOpen) return null

  const className = myMergeClasses(defaultClass, overrideClass)

  return (
    <div className={overlayClass} onClick={closeOnBackdropClick ? onClose : undefined}>
      <div className={className} onClick={e => e.stopPropagation()}>
        <MyButton onClick={onClose} overrideClass={closeButtonClass}>
          <XMarkIcon className='h-6 w-6' />
        </MyButton>
        <div className='mt-4'>{children}</div>
      </div>
    </div>
  )
}
