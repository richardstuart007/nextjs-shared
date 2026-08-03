'use client'

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

//----------------------------------------------------------------------------------
//  MyPopup — modal overlay panel with close button
//----------------------------------------------------------------------------------
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
