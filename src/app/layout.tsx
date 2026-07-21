import type { Metadata, Viewport } from 'next'
import { MascotRouteCompanion } from '@/components'
import './globals.css'

export const metadata: Metadata = {
  title: '수학 연습장',
  description: '초등 수학 개념 학습과 게임형 연습문제',
  icons: {
    icon: '/math_assist/favicon.ico',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body className="bg-gray-50 min-h-screen">
        <div className="max-w-4xl mx-auto px-4 py-6">
          {children}
        </div>
        <MascotRouteCompanion />
      </body>
    </html>
  )
}
