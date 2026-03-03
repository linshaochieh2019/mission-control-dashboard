import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Mission Control Panel',
  description: 'Mission control dashboard MVP',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
