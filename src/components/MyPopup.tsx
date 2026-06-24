'use client'

import { ReactNode } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { MyButton } from './MyButton'
import { myMergeClasses } from './MyMergeClasses'

type Props = {
  isOpen: boolean
  onClose: () => void
  children: ReactNode
  defaultClass?: string
  overrideClass?: string
  overlayClass?: string
  closeButtonClass?: string
}

export const MyPopup_dftClass_Shared = [
  'relative',
  'w-full max-w-md max-h-[90vh]',
  'p-4 md:p-6',
  'rounded-lg',
  'bg-white',
  'shadow-lg',
  'overflow-y-auto',
].join(' ')

export const MyPopup_overlayDftClass_Shared      = 'fixed inset-0 flex justify-center items-center z-50'
export const MyPopup_closeButtonDftClass_Shared  = 'absolute top-3 right-3 text-2xl font-bold text-gray-500 hover:text-gray-800'

//----------------------------------------------------------------------------------
//  MyPopup — modal overlay panel with close button
//----------------------------------------------------------------------------------
export default function MyPopup({
  isOpen,
  onClose,
  children,
  defaultClass = MyPopup_dftClass_Shared,
  overrideClass = '',
  overlayClass = MyPopup_overlayDftClass_Shared,
  closeButtonClass = MyPopup_closeButtonDftClass_Shared,
}: Props) {
  if (!isOpen) return null

  const className = myMergeClasses(defaultClass, overrideClass)

  return (
    <div className={overlayClass}>
      <div className={className}>
        <MyButton onClick={onClose} overrideClass={closeButtonClass}>
          <XMarkIcon className='h-6 w-6' />
        </MyButton>
        <div className='mt-4'>{children}</div>
      </div>
    </div>
  )
}
