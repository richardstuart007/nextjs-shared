'use client'

import { myMergeClasses } from './MyMergeClasses'

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  children: React.ReactNode
  active?: boolean
  variant?: 'underline' | 'pill'
  underlineActiveClass?: string
  underlineInactiveClass?: string
  pillActiveClass?: string
  pillInactiveClass?: string
  overrideClass?: string
}

//
//  Default classes — one per variant/active combination
//
export const MyTab_underlineActiveClass_Shared   = 'px-3 py-1.5 text-sm font-medium border-b-2 -mb-px border-blue-600 text-blue-700'
export const MyTab_underlineInactiveClass_Shared = 'px-3 py-1.5 text-sm font-medium border-b-2 -mb-px border-transparent text-gray-500 hover:text-gray-700'
export const MyTab_pillActiveClass_Shared        = 'px-3 py-1 text-xs rounded border bg-blue-600 text-white border-blue-600'
export const MyTab_pillInactiveClass_Shared      = 'px-3 py-1 text-xs rounded border bg-white text-gray-600 border-gray-300 hover:bg-gray-50'

//----------------------------------------------------------------------------------
//  MyTab — single tab button, two visual variants (underline / pill). Active state
//  and click handling are owned by the caller — same pattern as MyButton, not a
//  self-managing tab group.
//----------------------------------------------------------------------------------
export function MyTab({
  children,
  active = false,
  variant = 'underline',
  underlineActiveClass = MyTab_underlineActiveClass_Shared,
  underlineInactiveClass = MyTab_underlineInactiveClass_Shared,
  pillActiveClass = MyTab_pillActiveClass_Shared,
  pillInactiveClass = MyTab_pillInactiveClass_Shared,
  overrideClass = '',
  ...rest
}: Props) {
  const defaultClass = variant === 'pill'
    ? (active ? pillActiveClass : pillInactiveClass)
    : (active ? underlineActiveClass : underlineInactiveClass)
  const className = myMergeClasses(defaultClass, overrideClass)

  return (
    <button type='button' className={className} {...rest}>
      {children}
    </button>
  )
}
