import { ExclamationCircleIcon } from '@heroicons/react/24/solid'
import MyPopup from './MyPopup'
import { MyButton } from './MyButton'

export interface ConfirmDialogInt {
  isOpen: boolean
  title: string
  subTitle: string
  line1?: string
  line2?: string
  line3?: string
  line4?: string
  line5?: string
  line6?: string
  onConfirm: () => void | Promise<void>
}

interface ConfirmDialogProps {
  confirmDialog: ConfirmDialogInt
  setConfirmDialog: React.Dispatch<React.SetStateAction<ConfirmDialogInt>>
}

export function MyConfirmDialog({ confirmDialog, setConfirmDialog }: ConfirmDialogProps) {
  //
  //  Ignore the dialog if not open
  //
  if (!confirmDialog.isOpen) return null
  //
  // Build optionalLines: only include lines that were explicitly provided
  //
  const optionalLines = [
    confirmDialog.line1 !== undefined ? confirmDialog.line1 : null,
    confirmDialog.line2 !== undefined ? confirmDialog.line2 : null,
    confirmDialog.line3 !== undefined ? confirmDialog.line3 : null,
    confirmDialog.line4 !== undefined ? confirmDialog.line4 : null,
    confirmDialog.line5 !== undefined ? confirmDialog.line5 : null,
    confirmDialog.line6 !== undefined ? confirmDialog.line6 : null
  ].filter((line): line is string => line !== null) // remove nulls, assert type

  return (
    <MyPopup
      isOpen={confirmDialog.isOpen}
      onClose={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
    >
      <div className='text-center mb-4'>
        <div className='bg-secondary-light text-secondary-main rounded-full p-4 inline-block'>
          <ExclamationCircleIcon className='h-24 w-24 text-current' />
        </div>
        <h2 className='text-lg font-semibold mt-2'>{confirmDialog.title}</h2>
        <p className='text-sm text-red-600'>{confirmDialog.subTitle}</p>

        {/* Render optional lines 1–6 if they exist */}
        {optionalLines.map((line, index) => (
          <p key={index} className='text-sm text-green-600'>
            {line}
          </p>
        ))}
      </div>

      <div className='flex justify-center space-x-4'>
        <MyButton
          overrideClass='bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 focus:outline-none'
          onClick={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
        >
          No
        </MyButton>
        <MyButton
          overrideClass='bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 focus:outline-none'
          onClick={confirmDialog.onConfirm}
        >
          Yes
        </MyButton>
      </div>
    </MyPopup>
  )
}
