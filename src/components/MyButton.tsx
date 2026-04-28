import { myMergeClasses } from './MyMergeClasses'

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
  overrideClass?: string
}

export function MyButton({ children, overrideClass = '', ...rest }: Props) {
  //
  //  Default Class
  //
  const defaultClass = [
    'flex items-center justify-center',
    'h-8',
    'px-2',
    'font-normal',
    'text-white',
    'text-xs',
    'rounded-md',
    'bg-blue-500 hover:bg-blue-600',
    'transition-colors',
    'focus-visible:outline focus-visible:outline-blue-500',
    'aria-disabled:cursor-not-allowed aria-disabled:opacity-50'
  ].join(' ')
  //
  // Use the mergeClasses function to combine the classes
  //
  const classValue = myMergeClasses(defaultClass, overrideClass)
  //
  //  Output
  //
  return (
    <button {...rest} className={classValue}>
      {children}
    </button>
  )
}
