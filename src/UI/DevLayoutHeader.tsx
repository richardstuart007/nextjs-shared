'use client'

import { usePathname } from 'next/navigation'

export function DevLayoutHeader() {
  const pathname = usePathname()

  if (process.env.NEXT_PUBLIC_APPENV_ISDEV !== 'true') return null

  const dbLocation = process.env.POSTGRES_DATABASE_LOCATION

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
        <a href='/owner/components' onClick={handleOwnerClick} className='text-gray-600 hover:text-gray-900'>
          Components
        </a>
      </div>
      {dbLocation && (
        <span className='rounded bg-yellow-200 px-2 py-0.5 text-xs font-bold text-yellow-800 opacity-70'>
          {dbLocation}
        </span>
      )}
    </header>
  )
}
