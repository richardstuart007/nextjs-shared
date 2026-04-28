'use client'
import { myMergeClasses } from './MyMergeClasses'
import Link from 'next/link'

interface LinkHref {
  reference: string
  pathname: string
  segment?: string
  query?: { [key: string]: string }
}

interface Props {
  children: React.ReactNode
  overrideClass?: string
  href: LinkHref
  caller?: string
  [rest: string]: any
}

export function MyLink({
  children,
  overrideClass = '',
  href,
  caller: _caller = '',
  ...rest
}: Props) {
  //
  // Default Class
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
  //  Determine the path and query
  //
  const queryParams = href.query ? `?${new URLSearchParams(href.query).toString()}` : ''
  const hrefValue = `${href.pathname}${queryParams}`

  return (
    <Link href={hrefValue} {...rest} className={classValue}>
      {children}
    </Link>
  )
}
