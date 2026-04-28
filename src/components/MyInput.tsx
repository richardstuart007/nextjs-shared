import { myMergeClasses } from './MyMergeClasses'

interface Props extends React.InputHTMLAttributes<HTMLInputElement> {
  overrideClass?: string
}

export function MyInput({ overrideClass = '', ...rest }: Props) {
  //
  //  Default Class
  //
  const defaultClass = [
    'h-6 px-1 md:px-2 items-center',
    'text-xs font-normal',
    'border border-blue-500 rounded-md',
    'focus:border-1 focus:border-blue-500',
    'hover:border-1 hover:border-blue-500',
    'aria-disabled:cursor-not-allowed aria-disabled:opacity-50'
  ].join(' ')
  //
  // Use the mergeClasses function to combine the classes
  //
  const classValue = myMergeClasses(defaultClass, overrideClass)
  //
  //  Output
  //
  return <input {...rest} className={classValue} />
}
