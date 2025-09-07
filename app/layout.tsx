import type { Metadata } from 'next'
import './globals.css'
import ToastProvider from '@/components/ToastProvider'
import dynamic from 'next/dynamic'
import { startAutoModeration } from '@/lib/moderation'
import { Press_Start_2P } from 'next/font/google'

const pressStart2P = Press_Start_2P({ subsets: ['latin'], weight: '400' })

const AuthButton = dynamic(() => import('@/components/AuthButton'), {
  ssr: false,
})

// Admin ナビリンクは未実装のため一旦除去

export const metadata: Metadata = {
  title: 'VisionMates - レトロゲーム風プロジェクト共有プラットフォーム',
  description: '8ビット風UIでプロジェクトを通じて志を同じくする仲間を見つけよう',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // 自動モデレーションシステムを開始
  if (typeof window !== 'undefined') {
    startAutoModeration()
  }

  return (
    <html lang="ja">
      <head></head>
      <body className={pressStart2P.className}>
        <div className="min-h-screen bg-retro-darkGray">
          {/* レトロゲーム風ヘッダー */}
          <header className="bg-black border-b-4 border-retro-lightGray shadow-retro">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-20">
                {/* ロゴ */}
                <div className="flex items-center">
                  <h1 className="font-pixel text-xl text-retro-yellow retro-glow">
                    VISION<span className="text-retro-cyan">MATES</span>
                  </h1>
                  <div className="ml-4 text-retro-green text-sm retro-blink">●</div>
                </div>
                
                {/* レトロ風ナビゲーション */}
                <nav className="flex space-x-2 items-center">
                  <a
                    href="/"
                    className="font-pixel text-xs text-retro-lightGray hover:text-retro-yellow hover:bg-retro-darkGray px-3 py-2 border border-transparent hover:border-retro-yellow transition-all duration-150"
                  >
                    HOME
                  </a>
                  <a
                    href="/discover"
                    className="font-pixel text-xs text-retro-lightGray hover:text-retro-cyan hover:bg-retro-darkGray px-3 py-2 border border-transparent hover:border-retro-cyan transition-all duration-150"
                  >
                    DISCOVER
                  </a>
                  <a
                    href="/rooms"
                    className="font-pixel text-xs text-retro-lightGray hover:text-retro-green hover:bg-retro-darkGray px-3 py-2 border border-transparent hover:border-retro-green transition-all duration-150"
                  >
                    CO-OP
                  </a>
                  <a
                    href="/seeds/new"
                    className="font-pixel text-xs text-retro-lightGray hover:text-retro-orange hover:bg-retro-darkGray px-3 py-2 border border-transparent hover:border-retro-orange transition-all duration-150"
                  >
                    +NEW
                  </a>
                  {/* AdminNavLink は未実装のため非表示 */}
                  <a
                    href="/profile"
                    className="font-pixel text-xs text-retro-lightGray hover:text-retro-purple hover:bg-retro-darkGray px-3 py-2 border border-transparent hover:border-retro-purple transition-all duration-150"
                  >
                    PROFILE
                  </a>
                  <a
                    href="/timeline"
                    className="font-pixel text-xs text-retro-lightGray hover:text-retro-green hover:bg-retro-darkGray px-3 py-2 border border-transparent hover:border-retro-green transition-all duration-150"
                  >
                    TIMELINE
                  </a>
                  <a
                    href="/messages"
                    className="font-pixel text-xs text-retro-lightGray hover:text-retro-orange hover:bg-retro-darkGray px-3 py-2 border border-transparent hover:border-retro-orange transition-all duration-150"
                  >
                    MESSAGES
                  </a>
                  <div className="ml-4">
                    <AuthButton />
                  </div>
                </nav>
              </div>
            </div>
            
            {/* レトロ風の装飾ライン */}
            <div className="h-1 bg-gradient-to-r from-retro-red via-retro-orange via-retro-yellow via-retro-green via-retro-cyan to-retro-purple"></div>
          </header>
          
          <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            {children}
          </main>
          
          {/* レトロ風フッター装飾 */}
          <div className="h-1 bg-gradient-to-r from-retro-purple via-retro-cyan via-retro-green via-retro-yellow via-retro-orange to-retro-red"></div>
        </div>
        <ToastProvider />
      </body>
    </html>
  )
}
