import { MyHourGlass } from './MyHourGlass'
interface MyLoadingMessageProps {
  message1?: string
  message2?: string
}

export function MyLoadingMessage({
  message1 = 'Please wait...',
  message2 = ''
}: MyLoadingMessageProps) {
  return (
    <div className='py-8 text-center'>
      <p className='text-xl font-bold text-red-600'>{message1}</p>
      <MyHourGlass />
      <p className='text-xl font-bold text-red-600'>{message2}</p>
    </div>
  )
}
