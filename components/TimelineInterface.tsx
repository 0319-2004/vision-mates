'use client'

import { useState } from 'react'
import Link from 'next/link'

interface ProgressUpdate {
  id: string
  text: string
  created_at: string
  user?: {
    email: string
  }
  project?: {
    id: string
    title: string
  }
}

interface TimelineInterfaceProps {
  initialUpdates: ProgressUpdate[]
}

export default function TimelineInterface({ initialUpdates }: TimelineInterfaceProps) {
  const [updates] = useState<ProgressUpdate[]>(initialUpdates)

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) {
      return 'たった今'
    } else if (diffInHours < 24) {
      return `${diffInHours}時間前`
    } else if (diffInHours < 48) {
      return '昨日'
    } else {
      return date.toLocaleDateString('ja-JP')
    }
  }

  return (
    <div className="retro-card bg-black border-2 border-retro-green p-6">
      <h2 className="retro-text-readable text-xl font-pixel mb-6">📈 進捗タイムライン</h2>
      
      {updates.length === 0 ? (
        <div className="text-center py-12">
          <p className="retro-text-readable-dark mb-4">まだ進捗がありません</p>
          <p className="retro-text-readable-dark text-sm">
            プロジェクトに参加して進捗を投稿してみましょう！
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {updates.map((update) => (
            <div key={update.id} className="retro-card bg-retro-darkGray border-2 border-retro-lightGray p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="retro-text-readable text-sm font-pixel">
                      {update.user?.email || '匿名ユーザー'}
                    </span>
                    <span className="retro-text-readable-dark text-xs">
                      {formatDate(update.created_at)}
                    </span>
                  </div>
                  
                  {update.project && (
                    <Link 
                      href={`/projects/${update.project.id}`}
                      className="retro-text-readable-dark text-xs hover:text-retro-cyan transition-colors block mb-2"
                    >
                      📁 {update.project.title}
                    </Link>
                  )}
                  
                  <p className="retro-text-readable text-sm leading-relaxed">
                    {update.text}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
