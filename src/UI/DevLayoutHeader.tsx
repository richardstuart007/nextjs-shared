'use client'

import { usePathname } from 'next/navigation'

type ExtraLink = { href: string; label: string }

type Props = {
  dbLocation?: string
  extraLinks?: ExtraLink[]
}

export function DevLayoutHeader({ dbLocation, extraLinks = [] }: Props = {}) {
  const pathname = usePathname()

  if (process.env.NEXT_PUBLIC_APPENV_ISDEV !== 'true') return null

  //
  //  dbLocation defaults to the internal env read only when the prop is omitted,
  //  so nextjs-shared's own zero-prop usage keeps working unchanged — but a
  //  consuming project can pass its own server-computed value instead, since
  //  most projects' next.config doesn't expose POSTGRES_DATABASE_LOCATION to
  //  the client bundle the way this package's own next.config.mjs does.
  //
  const resolvedDbLocation = dbLocation ?? process.env.POSTGRES_DATABASE_LOCATION

  function handleOwnerClick() {
    if (!pathname.startsWith('/owner')) {
      sessionStorage.setItem('ownerFrom', pathname)
    }
  }

  return (
    <header className='flex items-center justify-between border-b border-gray-200 px-4 py-2 text-sm'>
      <div className='flex items-center gap-4'>
        <a href='/owner' onClick={handleOwnerClick} className='text-gray-600 hover:text-gray-900'>
          Owner
        </a>
        {extraLinks.map(link => (
          <a key={link.href} href={link.href} onClick={handleOwnerClick} className='text-gray-600 hover:text-gray-900'>
            {link.label}
          </a>
        ))}
      </div>
      {resolvedDbLocation && (
        <span className='rounded bg-yellow-200 px-2 py-0.5 text-xs font-bold text-yellow-800 opacity-70'>
          {resolvedDbLocation}
        </span>
      )}
    </header>
  )
}
