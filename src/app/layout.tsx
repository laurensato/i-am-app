import type { Metadata } from 'next'
import { Gilda_Display, Outfit } from 'next/font/google'
import './globals.css'

const gilda = Gilda_Display({
  variable: '--font-serif',
  subsets: ['latin'],
  weight: '400',
  display: 'swap',
})

const outfit = Outfit({
  variable: '--font-sans',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'I AM',
  description: 'Discover who you are becoming.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${gilda.variable} ${outfit.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col" style={{ fontFamily: 'var(--font-sans)', backgroundColor: 'var(--cream)' }}>
        {children}
      </body>
    </html>
  )
}
