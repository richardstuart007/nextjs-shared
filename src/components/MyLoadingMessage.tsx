'use client'

import { MyHourGlass } from './MyHourGlass'

type Props = {
  message1?: string
  message2?: string
  containerClass?: string
  messageClass?: string
}

export const MyLoadingMessage_containerDftClass_Shared = 'py-4 md:py-8 text-center'
export const MyLoadingMessage_messageDftClass_Shared   = 'text-xl font-bold text-red-600'

//----------------------------------------------------------------------------------------------
//  MyLoadingMessage — hourglass spinner with two optional message lines
//----------------------------------------------------------------------------------------------
export function MyLoadingMessage({
  message1 = 'Please wait...',
  message2 = '',
  containerClass = MyLoadingMessage_containerDftClass_Shared,
  messageClass = MyLoadingMessage_messageDftClass_Shared,
}: Props) {
  return (
    <div className={containerClass}>
      <p className={messageClass}>{message1}</p>
      <MyHourGlass />
      <p className={messageClass}>{message2}</p>
    </div>
  )
}
