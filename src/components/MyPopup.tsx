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
//      overrideClass         — caller classes merged over MyPopup_dftClass
//      overlayClass          — full-screen backdrop classes; defaults to
//                              MyPopup_overlayDftClass
//      closeButtonClass      — close button classes; defaults to
//                              MyPopup_closeButtonDftClass
//      closeIconClass        — close icon (XMarkIcon) classes; defaults to
//                              MyPopup_closeIconDftClass
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
import {
  MyPopup_dftClass,
  MyPopup_overlayDftClass,
  MyPopup_closeButtonDftClass,
  MyPopup_closeIconDftClass
} from '../constants'

type Props = {
  isOpen: boolean
  onClose: () => void
  children: ReactNode
  closeOnBackdropClick?: boolean
  overrideClass?: string
  overlayClass?: string
  closeButtonClass?: string
  closeIconClass?: string
}

export default function MyPopup({
  isOpen,
  onClose,
  children,
  closeOnBackdropClick = false,
  overrideClass = '',
  overlayClass = MyPopup_overlayDftClass,
  closeButtonClass = MyPopup_closeButtonDftClass,
  closeIconClass = MyPopup_closeIconDftClass,
}: Props) {
  if (!isOpen) return null

  const className = myMergeClasses(MyPopup_dftClass, overrideClass)
  const overlayOnClick = closeOnBackdropClick ? onClose : undefined

  return (
    <div className={overlayClass} onClick={overlayOnClick}>
      <div className={className} onClick={e => e.stopPropagation()}>
        <MyButton onClick={onClose} overrideClass={closeButtonClass}>
          <XMarkIcon className={closeIconClass} />
        </MyButton>
        <div className='mt-4'>{children}</div>
      </div>
    </div>
  )
}
