import type { Metadata } from 'next'
import { Jost, IBM_Plex_Mono } from 'next/font/google'
import './globals.css'

// Both --font-serif and --font-sans resolve to Jost 300 — the identity system uses one
// light sans throughout (display and body), so the two variable names stay distinct hooks
// for any future divergence but carry the same font today.
const jost = Jost({
  variable: '--font-serif',
  subsets: ['latin'],
  weight: ['300', '500'],
  style: ['normal'],
  display: 'swap',
})

const jostSans = Jost({
  variable: '--font-sans',
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  display: 'swap',
})

const plexMono = IBM_Plex_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
  weight: ['400', '500'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'I AM',
  description: 'Discover who you are becoming.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${jost.variable} ${jostSans.variable} ${plexMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col" style={{ fontFamily: 'var(--font-sans)', backgroundColor: 'var(--cream)' }}>
        {children}
      </body>
    </html>
  )
}
