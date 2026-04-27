import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Link from 'next/link'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Booster Club Accounting',
  description: 'Financial management for booster club',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <nav className="bg-slate-800 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center">
                <Link href="/" className="text-xl font-bold">
                  Booster Club Accounting
                </Link>
              </div>
              <div className="flex space-x-4">
                <Link href="/" className="hover:bg-slate-700 px-3 py-2 rounded-md text-sm font-medium">
                  Overview
                </Link>
                <Link href="/ledger" className="hover:bg-slate-700 px-3 py-2 rounded-md text-sm font-medium">
                  Ledger
                </Link>
                <Link href="/vouchers" className="hover:bg-slate-700 px-3 py-2 rounded-md text-sm font-medium">
                  Vouchers
                </Link>
              </div>
            </div>
          </div>
        </nav>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
      </body>
    </html>
  )
}

