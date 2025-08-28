'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabaseBrowser'
import { toast } from 'react-hot-toast'

interface ProjectCardProps {
  p: {
    id: string
    title: string
    purpose: string
    tags: string[]
    created_at: string
    watch_count?: number
    raise_count?: number
    commit_count?: number
    comment_count?: number
    update_count?: number
  }
  onChanged?: () => void
}

export default function ProjectCard({ p, onChanged }: ProjectCardProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [newUpdate, setNewUpdate] = useState('')
  const [showCommentForm, setShowCommentForm] = useState(false)
  const [showUpdateForm, setShowUpdateForm] = useState(false)
  
  const supabase = createClient()

  const handleIntent = async (level: 'watch' | 'raise' | 'commit') => {
    try {
      setIsSubmitting(true)
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('ログインが必要です')
        return
      }

      // 既存の意向を削除
      await supabase
        .from('intents')
        .delete()
        .eq('project_id', p.id)
        .eq('user_id', user.id)

      // 新しい意向を追加
      const { error } = await supabase
        .from('intents')
        .insert({
          project_id: p.id,
          user_id: user.id,
          level,
        })

      if (error) throw error

      toast.success('参加意向を更新しました')
      onChanged?.()
    } catch (error) {
      toast.error('参加意向の更新に失敗しました')
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAddComment = async () => {
    try {
      setIsSubmitting(true)
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('ログインが必要です')
        return
      }

      const { error } = await supabase
        .from('comments')
        .insert({
          project_id: p.id,
          user_id: user.id,
          text: newComment,
        })

      if (error) throw error

      toast.success('コメントを投稿しました')
      setNewComment('')
      setShowCommentForm(false)
      onChanged?.()
    } catch (error) {
      toast.error('コメントの投稿に失敗しました')
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAddUpdate = async () => {
    try {
      setIsSubmitting(true)
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('ログインが必要です')
        return
      }

      const { error } = await supabase
        .from('progress_updates')
        .insert({
          project_id: p.id,
          user_id: user.id,
          text: newUpdate,
        })

      if (error) throw error

      toast.success('進捗を投稿しました')
      setNewUpdate('')
      setShowUpdateForm(false)
      onChanged?.()
    } catch (error) {
      toast.error('進捗の投稿に失敗しました')
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden group">
      <div className="p-6">
        {/* ヘッダー */}
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
            {p.title}
          </h2>
          <Link
            href={`/projects/${p.id}`}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-medium rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
          >
            Open
          </Link>
        </div>
        
        {/* 説明 */}
        <p className="text-gray-600 mb-4 line-clamp-3 leading-relaxed">
          {p.purpose}
        </p>
        
        {/* タグ */}
        {p.tags && p.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {p.tags.map((tag: string, index: number) => (
              <span
                key={index}
                className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 border border-blue-200"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* 参加意向ボタン */}
        <div className="flex items-center space-x-2 mb-6">
          <button
            onClick={() => handleIntent('watch')}
            disabled={isSubmitting}
            className="flex-1 px-3 py-2 text-sm rounded-lg bg-gray-50 text-gray-700 hover:bg-yellow-50 hover:text-yellow-700 disabled:opacity-50 transition-all duration-200 border border-gray-200 hover:border-yellow-300"
          >
            👀 見守る
          </button>
          <button
            onClick={() => handleIntent('raise')}
            disabled={isSubmitting}
            className="flex-1 px-3 py-2 text-sm rounded-lg bg-gray-50 text-gray-700 hover:bg-orange-50 hover:text-orange-700 disabled:opacity-50 transition-all duration-200 border border-gray-200 hover:border-orange-300"
          >
            ✋ 手を挙げる
          </button>
          <button
            onClick={() => handleIntent('commit')}
            disabled={isSubmitting}
            className="flex-1 px-3 py-2 text-sm rounded-lg bg-gray-50 text-gray-700 hover:bg-green-50 hover:text-green-700 disabled:opacity-50 transition-all duration-200 border border-gray-200 hover:border-green-300"
          >
            🚀 コミット
          </button>
        </div>

        {/* コメント・進捗投稿フォーム */}
        <div className="space-y-3 mb-6">
          <div>
            <button
              onClick={() => setShowCommentForm(!showCommentForm)}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
            >
              💬 コメント投稿
            </button>
            {showCommentForm && (
              <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="コメントを入力..."
                  className="w-full px-3 py-2 border border-blue-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={2}
                />
                <div className="flex space-x-2 mt-2">
                  <button
                    onClick={handleAddComment}
                    disabled={isSubmitting || !newComment.trim()}
                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    投稿
                  </button>
                  <button
                    onClick={() => setShowCommentForm(false)}
                    className="px-3 py-1 bg-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-400 transition-colors"
                  >
                    キャンセル
                  </button>
                </div>
              </div>
            )}
          </div>

          <div>
            <button
              onClick={() => setShowUpdateForm(!showUpdateForm)}
              className="text-sm text-green-600 hover:text-green-700 font-medium transition-colors"
            >
              📝 進捗投稿
            </button>
            {showUpdateForm && (
              <div className="mt-2 p-3 bg-green-50 rounded-lg border border-green-200">
                <textarea
                  value={newUpdate}
                  onChange={(e) => setNewUpdate(e.target.value)}
                  placeholder="進捗を入力..."
                  className="w-full px-3 py-2 border border-green-300 rounded-md text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  rows={2}
                />
                <div className="flex space-x-2 mt-2">
                  <button
                    onClick={handleAddUpdate}
                    disabled={isSubmitting || !newUpdate.trim()}
                    className="px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
                  >
                    投稿
                  </button>
                  <button
                    onClick={() => setShowUpdateForm(false)}
                    className="px-3 py-1 bg-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-400 transition-colors"
                  >
                    キャンセル
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 指標カード */}
        <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-4">
              <span className="flex items-center space-x-1">
                <span>👀</span>
                <span className="font-medium">{p.watch_count || 0}</span>
              </span>
              <span className="flex items-center space-x-1">
                <span>✋</span>
                <span className="font-medium">{p.raise_count || 0}</span>
              </span>
              <span className="flex items-center space-x-1">
                <span>🚀</span>
                <span className="font-medium">{p.commit_count || 0}</span>
              </span>
              <span className="flex items-center space-x-1">
                <span>💬</span>
                <span className="font-medium">{p.comment_count || 0}</span>
              </span>
              <span className="flex items-center space-x-1">
                <span>📝</span>
                <span className="font-medium">{p.update_count || 0}</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 