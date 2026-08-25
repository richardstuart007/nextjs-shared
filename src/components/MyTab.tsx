'use client'

//==============================================================================================
//  1) DESCRIPTION
//    MyTab — single tab button, two visual variants (underline / pill). Active state
//    and click handling are owned by the caller — same pattern as MyButton, not a
//    self-managing tab group.
//
//    Parameters:
//      children               — tab label content
//      active                 — whether this tab is the currently-selected one
//      variant                — 'underline' (default) or 'pill'
//      underlineActiveClass   — underline-variant active classes
//      underlineInactiveClass — underline-variant inactive classes
//      pillActiveClass        — pill-variant active classes
//      pillInactiveClass      — pill-variant inactive classes
//      overrideClass          — caller classes merged over the resolved variant/state class
//      ...rest                — all other standard <button> attributes, passed through
//==============================================================================================

import { myMergeClasses } from './MyMergeClasses'
import {
  MyTab_underlineActiveClass,
  MyTab_underlineInactiveClass,
  MyTab_pillActiveClass,
  MyTab_pillInactiveClass
} from '../constants'

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

export function MyTab({
  children,
  active = false,
  variant = 'underline',
  underlineActiveClass = MyTab_underlineActiveClass,
  underlineInactiveClass = MyTab_underlineInactiveClass,
  pillActiveClass = MyTab_pillActiveClass,
  pillInactiveClass = MyTab_pillInactiveClass,
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
