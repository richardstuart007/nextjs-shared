'use client'

//==============================================================================================
//  1) DESCRIPTION
//    MyLink — styled Next.js Link with Tailwind class merging
//
//    Parameters:
//      children      — link contents
//      defaultClass  — base Tailwind classes; defaults to MyLink_dftClass
//      overrideClass — caller classes merged over defaultClass via myMergeClasses
//      href          — pathname + optional segment/query object, built into the final URL
//      caller        — accepted but unused (kept for call-site compatibility)
//      ...rest       — all other Next.js <Link> props, passed through
//==============================================================================================

import { myMergeClasses } from './MyMergeClasses'
import Link from 'next/link'
import { MyLink_dftClass } from '../constants'

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

export function MyLink({
  children,
  defaultClass = MyLink_dftClass,
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
