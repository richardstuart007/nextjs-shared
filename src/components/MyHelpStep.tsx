'use client'

import { useState } from 'react'

export type MyHelpStepProps = {
  title:      string
  input:      string[]
  processing: string
  output:     string[]
  consumers?: string[]
  label?:     string
  buttonClass?: string
  panelClass?: string
}

export const MyHelpStep_buttonDftClass_Shared = 'text-xs text-blue-600 hover:text-blue-800 border border-blue-300 rounded px-1.5 py-0.5 leading-none'
export const MyHelpStep_panelDftClass_Shared  = 'absolute z-20 mt-1 left-0 w-[min(2000px,90vw)] p-4 bg-blue-50 border border-blue-200 rounded-md shadow-xl text-xs'

//----------------------------------------------------------------------------------------------
//  MyHelpStep — toggleable step help panel showing input/processing/output/consumers
//----------------------------------------------------------------------------------------------
export function MyHelpStep({
  title,
  input,
  processing,
  output,
  consumers,
  label = 'Help',
  buttonClass = MyHelpStep_buttonDftClass_Shared,
  panelClass = MyHelpStep_panelDftClass_Shared,
}: MyHelpStepProps) {
  const [open, setOpen] = useState(false)

  return (
    <span className='inline-block'>
      <button
        onClick={() => setOpen(o => !o)}
        className={buttonClass}
        type='button'
      >
        {label}
      </button>

      {open && (
        <div className={panelClass}>

          <div className='flex justify-between items-center mb-3'>
            <p className='font-semibold text-blue-800 text-sm'>{title}</p>
            <button
              onClick={() => setOpen(false)}
              className='ml-4 text-gray-400 hover:text-gray-700 text-base leading-none font-bold'
              type='button'
            >
              ×
            </button>
          </div>

          <div className='bg-white border border-blue-100 rounded'>
            <table className='w-full text-xs border-collapse'>
              <tbody>
                <tr className='align-top'>
                  <td className='font-semibold text-gray-500 w-24 px-3 py-2 border-b border-gray-100 whitespace-nowrap'>Input</td>
                  <td className='text-gray-700 px-3 py-2 border-b border-gray-100'>
                    {input.map((s, i) => (
                      <div key={i} className={i > 0 ? 'mt-0.5' : ''}>{s}</div>
                    ))}
                  </td>
                </tr>
                <tr className='align-top'>
                  <td className='font-semibold text-gray-500 px-3 py-2 border-b border-gray-100 whitespace-nowrap'>Processing</td>
                  <td className='text-gray-700 px-3 py-2 border-b border-gray-100'>{processing}</td>
                </tr>
                <tr className='align-top'>
                  <td className={`font-semibold text-gray-500 px-3 py-2 whitespace-nowrap ${consumers ? 'border-b border-gray-100' : ''}`}>Output</td>
                  <td className={`text-gray-700 px-3 py-2 ${consumers ? 'border-b border-gray-100' : ''}`}>
                    {output.map((s, i) => (
                      <div key={i} className={i > 0 ? 'mt-0.5' : ''}>{s}</div>
                    ))}
                  </td>
                </tr>
                {consumers && (
                  <tr className='align-top'>
                    <td className='font-semibold text-gray-500 px-3 py-2 whitespace-nowrap'>Consumers</td>
                    <td className='text-gray-700 px-3 py-2'>
                      {consumers.map((s, i) => (
                        <div key={i} className={i > 0 ? 'mt-0.5' : ''}>{s}</div>
                      ))}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

        </div>
      )}
    </span>
  )
}
