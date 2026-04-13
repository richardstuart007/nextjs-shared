import { myMergeClasses } from './myMergeClasses'

interface Props extends React.InputHTMLAttributes<HTMLInputElement> {
  overrideClass?: string
  inputName: string
  inputValue: boolean
  onChange: React.ChangeEventHandler<HTMLInputElement>
}

export function MyToggle({ overrideClass = '', inputName, inputValue, onChange, ...rest }: Props) {
  //
  //  Default Class
  //
  const defaultClass = [
    'relative',
    'w-11 h-6',
    'bg-gray-400 dark:bg-gray-700',
    'rounded-full',
    'peer peer-checked:after:translate-x-[1.25rem] peer-checked:after:border-white',
    'after:content-[""] after:absolute after:top-0.5 after:left-[2px]',
    'after:bg-white after:border-gray-300 after:border after:rounded-full',
    'after:h-5 after:w-5',
    'after:transition-transform dark:border-gray-600 peer-checked:bg-blue-600'
  ].join(' ')
  //
  // Use the mergeClasses function to combine the classes
  //
  const classValue = myMergeClasses(defaultClass, overrideClass)
  //
  //  Output
  //
  const inputValue_string = `${inputValue}`
  const checkbox_name = `checkbox_${inputName}`
  return (
    <>
      <input id={inputName} type='hidden' name={inputName} value={inputValue_string} />
      <label className='inline-flex items-center cursor-pointer'>
        <input
          type='checkbox'
          id={checkbox_name}
          className='sr-only peer'
          name={checkbox_name}
          checked={inputValue}
          onChange={e => onChange(e)}
          {...rest}
        />
        {/* prettier-ignore */}
        <div className={classValue}></div>
      </label>
    </>
  )
}
