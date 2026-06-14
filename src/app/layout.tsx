import type { Metadata } from 'next'
import './globals.css'
import { DevLayoutHeader } from '../UI/DevLayoutHeader'

export const metadata: Metadata = {
  title: 'nextjs-shared test'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang='en' suppressHydrationWarning>
      <body>
        <DevLayoutHeader />
        {children}
      </body>
    </html>
  )
}
