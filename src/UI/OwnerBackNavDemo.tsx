'use client'

import { useRouter } from 'next/navigation'
import { saveBackNav } from '../components/useBackNav'
import { MyButton } from '../components/MyButton'

const demoRows = [
  { id: 1, name: 'Row One' },
  { id: 2, name: 'Row Two' },
  { id: 3, name: 'Row Three' },
]

export const BACKNAV_DEMO_KEY = 'backnav-demo'

//----------------------------------------------------------------------------------
//  OwnerBackNavDemo — demonstrates useBackNav + OwnerPage's persistKey: click a row,
//  land on a detail route, click Back, and confirm this tab is still active on return
//----------------------------------------------------------------------------------
export default function OwnerBackNavDemo() {
  const router = useRouter()

  function openRow(id: number) {
    saveBackNav(BACKNAV_DEMO_KEY)
    router.push(`/backnav-test/${id}`)
  }

  return (
    <div className='p-4 space-y-3'>
      <p className='text-sm text-gray-600'>
        Click a row, then use the Back link on the detail page — you should land back on this tab.
      </p>
      <div className='flex flex-col gap-2 max-w-sm'>
        {demoRows.map(row => (
          <MyButton key={row.id} onClick={() => openRow(row.id)} overrideClass='justify-start'>
            {row.name}
          </MyButton>
        ))}
      </div>
    </div>
  )
}
