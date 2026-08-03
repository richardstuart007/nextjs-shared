'use client'

import { MyHourGlass } from './MyHourGlass'
import { MyLoadingMessage_containerDftClass, MyLoadingMessage_messageDftClass } from '../constants'

type Props = {
  message1?: string
  message2?: string
  containerClass?: string
  messageClass?: string
}

//----------------------------------------------------------------------------------------------
//  MyLoadingMessage — hourglass spinner with two optional message lines
//----------------------------------------------------------------------------------------------
export function MyLoadingMessage({
  message1 = 'Please wait...',
  message2 = '',
  containerClass = MyLoadingMessage_containerDftClass,
  messageClass = MyLoadingMessage_messageDftClass,
}: Props) {
  return (
    <div className={containerClass}>
      <p className={messageClass}>{message1}</p>
      <MyHourGlass />
      <p className={messageClass}>{message2}</p>
    </div>
  )
}
