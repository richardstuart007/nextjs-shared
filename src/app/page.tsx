'use client'

import { MyLink } from '../components/MyLink'
import OwnerGenerateData from './owner/OwnerGenerateData'

const TEST_LINKS = [
  { label: 'Versions', pathname: '/test/versions' },
  { label: 'Components', pathname: '/test/components' },
  { label: 'Constants', pathname: '/test/constants' },
  { label: 'Back Nav Demo', pathname: '/test/back-nav-demo' },
  { label: 'Routing Test', pathname: '/test/routing-test' },
]

export default function Page() {
  if (process.env.NEXT_PUBLIC_APPENV_ISDEV !== 'true') {
    return (
      <div className='p-4'>
        <h1 className='text-base font-bold mb-4'>nextjs-shared · local test</h1>
      </div>
    )
  }

  return (
    <div className='p-4'>
      <h1 className='text-base font-bold mb-4'>nextjs-shared · local test</h1>
      <ul className='flex flex-col gap-1 text-sm'>
        {TEST_LINKS.map(link => (
          <li key={link.pathname}>
            <MyLink overrideClass='w-40' href={{ reference: link.label, pathname: link.pathname }}>
              {link.label}
            </MyLink>
          </li>
        ))}
      </ul>
      <OwnerGenerateData />
    </div>
  )
}
