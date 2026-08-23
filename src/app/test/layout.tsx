'use client'

import { useEffect } from 'react'
import { MyBackHomeNav } from '../../components/MyBackHomeNav'

export default function TestLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_APPENV_ISDEV !== 'true') {
      window.location.href = '/'
    }
  }, [])

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
