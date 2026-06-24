//
//  Project-level default classes for the dev-app — simulates a consuming project's defaults.ts
//  To find the shared default to copy from: import { My{X}_dftClass_Shared } from '../../components/My{X}'
//

export const MyBox_dftClass_Project = 'rounded-lg border-4 border-yellow-400 p-2 md:p-3 mb-3'

export const MyInput_dftClass_Project = [
  'h-6 md:h-8',
  'px-1 md:px-2',
  'font-normal text-xs',
  'rounded-md',
  'border-4 border-pink-500',
  'focus:border-pink-600',
  'hover:border-pink-600',
  'aria-disabled:cursor-not-allowed aria-disabled:opacity-50',
].join(' ')
