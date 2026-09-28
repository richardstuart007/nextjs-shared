'use client'

//==============================================================================================
//  1) DESCRIPTION
//    TestLayout — dev-only guard layout for /test/* routes, with a Home back-link
//
//    Parameters:
//      children — the page content to render inside the dev guard
//==============================================================================================

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { MyBackHomeNav } from '../../components/MyBackHomeNav'

export default function TestLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_APPENV_ISDEV !== 'true') {
      router.push('/')
    }
  }, [router])

  if (process.env.NEXT_PUBLIC_APPENV_ISDEV !== 'true') return null

  return (
    <div className='px-6 py-4 bg-green-100'>
      <div className='mb-2'>
        <MyBackHomeNav />
      </div>
      {children}
    </div>
  )
}
