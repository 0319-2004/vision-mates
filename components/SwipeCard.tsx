'use client'

import { useState } from 'react'
import { Project } from '@/types'
import { createClient } from '@/lib/supabaseBrowser'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

interface SwipeCardProps {
  project: Project
}

export default function SwipeCard({ project }: SwipeCardProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleWatch = async () => {
    setIsLoading(true)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setShowLoginPrompt(true)
        return
      }

      // watch意向を追加
      await supabase
        .from('intents')
        .upsert({
          project_id: project.id,
          user_id: user.id,
          level: 'watch'
        })

      toast.success('👀 気になるに追加しました！')
      
      // ページをリロードして次のカードを表示
      router.refresh()
    } catch (error) {
      toast.error('エラーが発生しました')
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSkip = async () => {
    setIsLoading(true)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        // スキップ記録を追加
        await supabase
          .from('discover_skips')
          .insert({
            user_id: user.id,
            project_id: project.id
          })
      }

      // ページをリロードして次のカードを表示
      router.refresh()
    } catch (error) {
      toast.error('エラーが発生しました')
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative">
      {/* プロジェクトカード */}
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 mb-4">
        <h2 className="text-xl font-bold text-gray-900 mb-3">{project.title}</h2>
        <p className="text-gray-600 mb-4">{project.purpose}</p>
        
        {project.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {project.tags.map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-500">
            {new Date(project.created_at).toLocaleDateString('ja-JP')}
          </span>
          <a
            href={`/projects/${project.id}`}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            詳細を見る →
          </a>
        </div>
      </div>

      {/* アクションボタン */}
      <div className="flex gap-4">
        <button
          onClick={handleSkip}
          disabled={isLoading}
          aria-label="このプロジェクトをスキップする"
          title="スキップ"
          className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
        >
          スキップ
        </button>
        <button
          onClick={handleWatch}
          disabled={isLoading}
          aria-label="このプロジェクトを気になるに追加する"
          title="気になる"
          className="flex-1 px-6 py-3 bg-yellow-500 text-white rounded-lg font-medium hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
        >
          👀 気になる
        </button>
      </div>

      {/* ログイン促しモーダル */}
      {showLoginPrompt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" role="dialog" aria-modal="true" aria-labelledby="login-prompt-title">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
            <h3 id="login-prompt-title" className="text-lg font-semibold text-gray-900 mb-4">
              ログインが必要です
            </h3>
            <p className="text-gray-600 mb-6">
              プロジェクトに興味を示すにはログインしてください
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLoginPrompt(false)}
                aria-label="ログインせずに閉じる"
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
              >
                キャンセル
              </button>
              <a
                href="/auth/login"
                aria-label="ログインページへ移動"
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
              >
                ログイン
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 