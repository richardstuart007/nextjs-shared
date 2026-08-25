'use client'

//==============================================================================================
//  1) DESCRIPTION
//    OwnerPage — tabbed page chrome; renders an underline tab bar and the active tab's content
//
//    Parameters:
//      tabs       — the tab list, each with a label and its rendered content
//      persistKey — when supplied, the active tab is saved to (and restored from)
//                   sessionStorage under this key, surviving navigation away and back
//==============================================================================================

import { Fragment, Suspense, useEffect, useRef, useState } from 'react'
import { MyTab } from '../components/MyTab'
import { SessionStorageKeyPrefixShared } from '../constants'

type TabConfig = { label: string; content: React.ReactNode }

export default function OwnerPage({ tabs, persistKey }: { tabs: TabConfig[]; persistKey?: string }) {
  const [activeTab, setActiveTab] = useState(tabs[0].label)
  const restoredRef = useRef(false)

  //
  //  Restore persisted active tab on mount, if persistKey provided
  //
  useEffect(() => {
    if (!persistKey) return
    const stored = sessionStorage.getItem(SessionStorageKeyPrefixShared + persistKey)
    if (stored && tabs.some(t => t.label === stored)) setActiveTab(stored)
  }, [persistKey])

  //
  //  Persist active tab on change (guarded until after restore, so the initial
  //  render's default tab doesn't clobber a previously-saved value)
  //
  useEffect(() => {
    if (!persistKey || !restoredRef.current) return
    sessionStorage.setItem(SessionStorageKeyPrefixShared + persistKey, activeTab)
  }, [persistKey, activeTab])

  //
  //  Mark restoration complete (declared after the save effect so the save
  //  is blocked on first render)
  //
  useEffect(() => {
    restoredRef.current = true
  }, [persistKey])

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
        <div className='pt-4'>
          {tabs.map(tab => (
            <Fragment key={tab.label}>
              {activeTab === tab.label && tab.content}
            </Fragment>
          ))}
        </div>
      </Suspense>
    </>
  )
}
