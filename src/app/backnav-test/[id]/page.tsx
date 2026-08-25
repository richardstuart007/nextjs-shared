'use client'

//==============================================================================================
//  1) DESCRIPTION
//    Page — dev-only detail route for OwnerBackNavDemo, verifying useBackNav restores the
//    originating tab via its Back link
//==============================================================================================

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useBackNav } from '../../../components/useBackNav'
import { MyBackHomeNav } from '../../../components/MyBackHomeNav'
import { BACKNAV_DEMO_KEY } from '../../../UI/OwnerBackNavDemo'

export default function Page() {
  const params = useParams<{ id: string }>()
  const backPath = useBackNav(BACKNAV_DEMO_KEY)
  const [isDev, setIsDev] = useState(false)

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_APPENV_ISDEV !== 'true') {
      window.location.href = '/'
      return
    }
    setIsDev(true)
  }, [])

  if (!isDev) return null

  return (
    <div className='px-6 py-4'>
      <MyBackHomeNav backPath={backPath} backLabel='Back Nav Demo' />
      <p className='text-sm text-gray-700 mt-3'>
        You clicked row <strong>{params.id}</strong>. Use the &quot;Back Nav Demo&quot; link above
        — it should return you to the same tab on /owner.
      </p>
    </div>
  )
}
