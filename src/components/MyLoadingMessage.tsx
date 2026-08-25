'use client'

//==============================================================================================
//  1) DESCRIPTION
//    MyLoadingMessage — hourglass spinner with two optional message lines
//
//    Parameters:
//      message1       — first line, above the spinner; defaults to 'Please wait...'
//      message2       — second line, below the spinner; defaults to empty
//      containerClass — wrapper div classes; defaults to MyLoadingMessage_containerDftClass
//      messageClass   — classes applied to both message lines; defaults to
//                       MyLoadingMessage_messageDftClass
//==============================================================================================

import { MyHourGlass } from './MyHourGlass'
import { MyLoadingMessage_containerDftClass, MyLoadingMessage_messageDftClass } from '../constants'

type Props = {
  message1?: string
  message2?: string
  containerClass?: string
  messageClass?: string
}

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
