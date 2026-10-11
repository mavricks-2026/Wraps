import './globals.css'
import type { Metadata } from 'next'
import { Quicksand, Nunito_Sans } from 'next/font/google'
import { Providers } from '@/components/providers'
import { PromoBar } from '@/components/layout/PromoBar'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { CartDrawer } from '@/components/cart/CartDrawer'

const quicksand = Quicksand({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-quicksand',
  display: 'swap',
})

const nunito = Nunito_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-nunito',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'WrapUrs | Personalized Gifts, Handcrafted with Love',
    template: '%s · WrapUrs',
  },
  description:
    'Thoughtfully crafted keepsakes, frames, lamps and hampers — personalised with love and delivered across India.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${quicksand.variable} ${nunito.variable}`}>
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
        />
      </head>
      <body className="bg-canvas text-ink font-sans antialiased">
        <Providers>
          <PromoBar />
          <Navbar />
          <main className="min-h-[60vh]">{children}</main>
          <Footer />
          <CartDrawer />
        </Providers>
      </body>
    </html>
  )
}