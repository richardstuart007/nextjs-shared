import { myMergeClasses } from './MyMergeClasses'

interface Props extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  overrideClass?: string
}

export function MyTextarea({ overrideClass = '', ...rest }: Props) {
  //
  //  Default Class
  //
  const defaultClass = [
    'px-1 md:px-2 items-center',
    'text-xs font-normal',
    'border border-blue-500 rounded-md',
    'focus:border-1 focus:border-blue-500',
    'hover:border-1 hover:border-blue-500',
    'aria-disabled:cursor-not-allowed aria-disabled:opacity-50',
    'h-24', // Default height for textarea
    'resize-y' // Allow vertical resizing
  ].join(' ')

  //
  // Use the mergeClasses function to combine the classes
  //
  const classValue = myMergeClasses(defaultClass, overrideClass)
  //
  //  Output
  //
  return <textarea {...rest} className={classValue} />
}
