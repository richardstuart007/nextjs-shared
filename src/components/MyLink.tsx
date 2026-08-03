'use client'
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

//----------------------------------------------------------------------------------------------
//  MyLink — styled Next.js Link with Tailwind class merging
//----------------------------------------------------------------------------------------------
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
