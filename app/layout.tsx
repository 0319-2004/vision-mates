import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import ToastProvider from '@/components/ToastProvider'
import dynamic from 'next/dynamic'

const AuthButton = dynamic(() => import('@/components/AuthButton'), {
  ssr: false,
})

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'VisionMates - ビジョンでつながる仲間募集プラットフォーム',
  description: 'プロジェクトを通じて志を同じくする仲間を見つけよう',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body className={inter.className}>
        <div className="min-h-screen bg-gray-50">
          <header className="bg-white shadow-sm border-b">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-16">
                <div className="flex items-center">
                  <h1 className="text-xl font-bold text-gray-900">
                    VisionMates
                  </h1>
                </div>
                <nav className="flex space-x-4 items-center">
                  <a
                    href="/"
                    className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    プロジェクト一覧
                  </a>
                  <a
                    href="/discover"
                    className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    発見
                  </a>
                  <a
                    href="/rooms"
                    className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    共同作業
                  </a>
                  <a
                    href="/seeds/new"
                    className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    企画作成
                  </a>
                  <a
                    href="/profile"
                    className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    プロフィール
                  </a>
                  <AuthButton />
                </nav>
              </div>
            </div>
          </header>
          <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            {children}
          </main>
        </div>
        <ToastProvider />
      </body>
    </html>
  )
} 