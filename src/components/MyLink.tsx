'use client'
import { myMergeClasses } from './MyMergeClasses'
import Link from 'next/link'

type LinkHref = {
  reference: string
  pathname: string
  segment?: string
  query?: { [key: string]: string }
}

type Props = {
  children: React.ReactNode
  defaultClass?: string
  overrideClass?: string
  href: LinkHref
  caller?: string
  [rest: string]: any
}

export const MyLink_dftClass_Shared = [
  'flex items-center justify-center',
  'h-6 md:h-8',
  'px-1 md:px-2',
  'font-normal text-xs text-white',
  'rounded-md',
  'bg-blue-500 hover:bg-blue-600',
  'transition-colors',
  'focus-visible:outline focus-visible:outline-blue-500',
  'aria-disabled:cursor-not-allowed aria-disabled:opacity-50',
].join(' ')

//----------------------------------------------------------------------------------------------
//  MyLink — styled Next.js Link with Tailwind class merging
//----------------------------------------------------------------------------------------------
export function MyLink({
  children,
  defaultClass = MyLink_dftClass_Shared,
  overrideClass = '',
  href,
  caller: _caller = '',
  ...rest
}: Props) {
  const className = myMergeClasses(defaultClass, overrideClass)
  //
  //  Build href string from pathname and optional query params
  //
  const queryParams = href.query ? `?${new URLSearchParams(href.query).toString()}` : ''
  const hrefValue = `${href.pathname}${queryParams}`

  return (
    <Link href={hrefValue} {...rest} className={className}>
      {children}
    </Link>
  )
}
