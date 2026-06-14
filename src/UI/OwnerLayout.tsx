'use client'

import { useEffect, useState } from 'react'

export default function OwnerLayout({ children }: { children: React.ReactNode }) {
  const [backPath, setBackPath] = useState<string | null>(null)

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_APPENV_ISDEV !== 'true') {
      window.location.href = '/'
      return
    }
    setBackPath(sessionStorage.getItem('ownerFrom'))
  }, [])

  if (process.env.NEXT_PUBLIC_APPENV_ISDEV !== 'true') return null

  return (
    <div className='px-6 py-4 bg-green-100'>
      {backPath && (
        <div className='mb-2'>
          <a href={backPath} className='text-xs text-gray-500 hover:text-gray-700'>
            ← {backPath}
          </a>
        </div>
      )}
      {children}
    </div>
  )
}
