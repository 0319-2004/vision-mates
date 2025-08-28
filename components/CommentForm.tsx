'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabaseBrowser'
import { useAuth } from '@/hooks/useAuth'
import AuthGuard from './AuthGuard'
import AuthButton from './AuthButton'
import toast from 'react-hot-toast'

interface CommentFormProps {
  projectId: string
  onCommentAdded?: () => void
}

export default function CommentForm({ projectId, onCommentAdded }: CommentFormProps) {
  const [comment, setComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { user } = useAuth()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!comment.trim() || !user) return

    setIsSubmitting(true)
    try {
      const { error } = await supabase
        .from('comments')
        .insert({
          project_id: projectId,
          user_id: user.id,
          content: comment.trim(),
        })

      if (error) throw error

      setComment('')
      toast.success('コメントを投稿しました！')
      onCommentAdded?.()
    } catch (error: any) {
      toast.error(error.message || 'コメントの投稿に失敗しました')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthGuard
      fallback={
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-600 mb-3">
            コメントを投稿するにはログインが必要です
          </p>
          <AuthButton />
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">
            コメント
          </label>
          <textarea
            id="comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="プロジェクトについてコメントを書いてください..."
            required
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">
            {user?.user_metadata?.full_name || user?.email} として投稿
          </span>
          <button
            type="submit"
            disabled={isSubmitting || !comment.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? '投稿中...' : 'コメントを投稿'}
          </button>
        </div>
      </form>
    </AuthGuard>
  )
} 