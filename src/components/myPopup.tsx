import { ReactNode } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { MyButton } from './myButton'

interface PopupProps {
  isOpen: boolean
  onClose: () => void
  children: ReactNode
  maxWidth?: string
}

export default function MyPopup({ isOpen, onClose, children, maxWidth = 'max-w-md' }: PopupProps) {
  if (!isOpen) return null

  return (
    <div className='fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50'>
      <div className={`relative bg-white p-6 rounded-lg shadow-lg w-full ${maxWidth}`}>
        <MyButton
          onClick={onClose}
          overrideClass='absolute top-3 right-3 text-2xl font-bold text-gray-500 hover:text-gray-800'
        >
          <XMarkIcon className='h-6 w-6' />
        </MyButton>
        <div className='mt-4'>{children}</div>
      </div>
    </div>
  )
}
