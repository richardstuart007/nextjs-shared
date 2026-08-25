'use client'

//==============================================================================================
//  1) DESCRIPTION
//    MyConfirmDialog — modal confirmation dialog with optional detail lines
//
//    Parameters:
//      confirmDialog      — dialog content/state (isOpen, title, subTitle, up to 6 optional
//                           detail lines, and the onConfirm callback for "Yes")
//      setConfirmDialog   — setter used internally to close the dialog on "No"/backdrop
//      iconContainerClass — warning-icon wrapper classes; defaults to
//                           MyConfirmDialog_iconContainerDftClass
//      titleClass         — title classes; defaults to MyConfirmDialog_titleDftClass
//      subTitleClass      — subtitle classes; defaults to MyConfirmDialog_subTitleDftClass
//      lineClass          — detail-line classes; defaults to MyConfirmDialog_lineDftClass
//      noButtonClass      — "No" button classes; defaults to MyConfirmDialog_noButtonDftClass
//      yesButtonClass     — "Yes" button classes; defaults to
//                           MyConfirmDialog_yesButtonDftClass
//==============================================================================================

import { ExclamationCircleIcon } from '@heroicons/react/24/solid'
import MyPopup from './MyPopup'
import { MyButton } from './MyButton'
import {
  MyConfirmDialog_iconContainerDftClass,
  MyConfirmDialog_titleDftClass,
  MyConfirmDialog_subTitleDftClass,
  MyConfirmDialog_lineDftClass,
  MyConfirmDialog_noButtonDftClass,
  MyConfirmDialog_yesButtonDftClass
} from '../constants'

export type ConfirmDialogInt = {
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

type Props = {
  confirmDialog: ConfirmDialogInt
  setConfirmDialog: React.Dispatch<React.SetStateAction<ConfirmDialogInt>>
  iconContainerClass?: string
  titleClass?: string
  subTitleClass?: string
  lineClass?: string
  noButtonClass?: string
  yesButtonClass?: string
}

export function MyConfirmDialog({
  confirmDialog,
  setConfirmDialog,
  iconContainerClass = MyConfirmDialog_iconContainerDftClass,
  titleClass = MyConfirmDialog_titleDftClass,
  subTitleClass = MyConfirmDialog_subTitleDftClass,
  lineClass = MyConfirmDialog_lineDftClass,
  noButtonClass = MyConfirmDialog_noButtonDftClass,
  yesButtonClass = MyConfirmDialog_yesButtonDftClass,
}: Props) {
  //
  //  Ignore the dialog if not open
  //
  if (!confirmDialog.isOpen) return null
  //
  //  Build optionalLines: only include lines that were explicitly provided;
  //  filter removes nulls and narrows type to string
  //
  const optionalLines = [
    confirmDialog.line1 ?? null,
    confirmDialog.line2 ?? null,
    confirmDialog.line3 ?? null,
    confirmDialog.line4 ?? null,
    confirmDialog.line5 ?? null,
    confirmDialog.line6 ?? null
  ].filter((line): line is string => line !== null)

  return (
    <MyPopup
      isOpen={confirmDialog.isOpen}
      onClose={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
    >
      <div className='text-center mb-4'>
        <div className={iconContainerClass}>
          <ExclamationCircleIcon className='h-24 w-24 text-current' />
        </div>
        <h2 className={titleClass}>{confirmDialog.title}</h2>
        <p className={subTitleClass}>{confirmDialog.subTitle}</p>
        {optionalLines.map((line, index) => (
          <p key={index} className={lineClass}>
            {line}
          </p>
        ))}
      </div>
      <div className='flex justify-center space-x-4'>
        <MyButton
          overrideClass={noButtonClass}
          onClick={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
        >
          No
        </MyButton>
        <MyButton
          overrideClass={yesButtonClass}
          onClick={confirmDialog.onConfirm}
        >
          Yes
        </MyButton>
      </div>
    </MyPopup>
  )
}
