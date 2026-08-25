'use client'

//==============================================================================================
//  1) DESCRIPTION
//    OwnerLayout — dev-only guard layout for /owner routes; redirects away entirely in
//    non-dev environments, and shows a Back link restored from sessionStorage (or a static
//    '/owner' Back link on any nested /owner/* route)
//
//    Parameters:
//      children — the page content to render inside the dev guard
//==============================================================================================

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { MyBackHomeNav } from '../components/MyBackHomeNav'
import { SessionStorageKeyPrefixShared } from '../constants'

export default function OwnerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [backPath, setBackPath] = useState<string | null>(null)

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_APPENV_ISDEV !== 'true') {
      window.location.href = '/'
      return
    }
    if (pathname === '/owner') {
      setBackPath(sessionStorage.getItem(SessionStorageKeyPrefixShared + 'ownerFrom'))
    } else {
      setBackPath('/owner')
    }
  }, [pathname])

  if (process.env.NEXT_PUBLIC_APPENV_ISDEV !== 'true') return null

  return (
    <div className='px-6 py-4 bg-green-100'>
      {backPath && (
        <div className='mb-2'>
          <MyBackHomeNav backPath={backPath} />
        </div>
      )}
      {children}
    </div>
  )
}
