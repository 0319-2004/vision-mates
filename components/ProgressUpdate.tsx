'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabaseBrowser'
import { useAuth } from '@/hooks/useAuth'
import AuthGuard from './AuthGuard'
import AuthButton from './AuthButton'
import toast from 'react-hot-toast'

interface ProgressUpdateProps {
  projectId: string
  onProgressUpdated?: () => void
}

export default function ProgressUpdate({ projectId, onProgressUpdated }: ProgressUpdateProps) {
  const [progress, setProgress] = useState('')
  const [percentage, setPercentage] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { user } = useAuth()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!progress.trim() || !user) return

    setIsSubmitting(true)
    try {
      const { error } = await supabase
        .from('progress_updates')
        .insert({
          project_id: projectId,
          user_id: user.id,
          content: progress.trim(),
          percentage: percentage,
        })

      if (error) throw error

      setProgress('')
      setPercentage(0)
      toast.success('進捗を更新しました！')
      onProgressUpdated?.()
    } catch (error: any) {
      toast.error(error.message || '進捗の更新に失敗しました')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthGuard
      fallback={
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-600 mb-3">
            進捗を更新するにはログインが必要です
          </p>
          <AuthButton />
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="progress" className="block text-sm font-medium text-gray-700 mb-2">
            進捗状況
          </label>
          <textarea
            id="progress"
            value={progress}
            onChange={(e) => setProgress(e.target.value)}
            placeholder="今日の進捗を報告してください..."
            required
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
        </div>

        <div>
          <label htmlFor="percentage" className="block text-sm font-medium text-gray-700 mb-2">
            完了率: {percentage}%
          </label>
          <input
            id="percentage"
            type="range"
            min="0"
            max="100"
            value={percentage}
            onChange={(e) => setPercentage(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">
            {user?.user_metadata?.full_name || user?.email} として更新
          </span>
          <button
            type="submit"
            disabled={isSubmitting || !progress.trim()}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? '更新中...' : '進捗を更新'}
          </button>
        </div>
      </form>
    </AuthGuard>
  )
} 