'use client'

import { Fragment, Suspense, useState } from 'react'
import { MyTab } from '../components/MyTab'

type TabConfig = { label: string; content: React.ReactNode }

export default function OwnerPage({ tabs }: { tabs: TabConfig[] }) {
  const [activeTab, setActiveTab] = useState(tabs[0].label)

  return (
    <>
      <nav className='flex gap-6 pt-6 pb-0 border-b border-gray-200 text-sm'>
        {tabs.map(tab => (
          <MyTab
            key={tab.label}
            variant='underline'
            active={activeTab === tab.label}
            underlineActiveClass='pb-2 border-b-2 border-gray-900 text-gray-900 font-medium'
            underlineInactiveClass='pb-2 text-gray-500 hover:text-gray-700'
            onClick={() => setActiveTab(tab.label)}
          >
            {tab.label}
          </MyTab>
        ))}
      </nav>
      <Suspense>
        {tabs.map(tab => (
          <Fragment key={tab.label}>
            {activeTab === tab.label && tab.content}
          </Fragment>
        ))}
      </Suspense>
    </>
  )
}
