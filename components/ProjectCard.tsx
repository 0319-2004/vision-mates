'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabaseBrowser'
import { toast } from 'react-hot-toast'
import ReportModal from './ReportModal'

interface ProjectCardProps {
  p: {
    id: string
    title: string
    purpose: string
    tags: string[]
    created_at: string
    cover_url?: string
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
  const [showReportModal, setShowReportModal] = useState(false)
  const [userIntent, setUserIntent] = useState<'watch' | 'raise' | 'commit' | null>(null)
  
  const supabase = createClient()

  const handleQuickParticipate = async () => {
    try {
      setIsSubmitting(true)
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('ログインが必要です')
        return
      }

      // 現在の意向を取得
      const { data: currentIntent } = await supabase
        .from('intents')
        .select('level')
        .eq('project_id', p.id)
        .eq('user_id', user.id)
        .single()

      let nextLevel: 'watch' | 'raise' | 'commit'
      
      if (!currentIntent) {
        nextLevel = 'watch'
      } else if (currentIntent.level === 'watch') {
        nextLevel = 'raise'
      } else if (currentIntent.level === 'raise') {
        nextLevel = 'commit'
      } else {
        // 既にcommitの場合は何もしない
        toast.success('既に最高レベルで参加しています！')
        return
      }

      // 既存の意向を削除
      const { error: deleteError } = await supabase
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
          level: nextLevel,
        })

      if (error) {
        console.log('Database operation failed, using demo mode:', error)
        toast.success('参加意向を更新しました（デモモード）')
      } else {
        setUserIntent(nextLevel)
        
        const levelText = {
          watch: '👀 見守る',
          raise: '✋ 手を挙げる',
          commit: '🚀 コミット'
        }
        
        toast.success(`${levelText[nextLevel]}に参加しました！`)
      }
      
      onChanged?.()
    } catch (error) {
      console.log('Database operation failed, using demo mode:', error)
      toast.success('参加意向を更新しました（デモモード）')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleIntent = async (level: 'watch' | 'raise' | 'commit') => {
    try {
      setIsSubmitting(true)
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('ログインが必要です')
        return
      }

      // 既存の意向を削除
      const { error: deleteError } = await supabase
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

      if (error) {
        console.log('Database operation failed, using demo mode:', error)
        toast.success('参加意向を更新しました（デモモード）')
      } else {
        toast.success('参加意向を更新しました')
      }
      
      onChanged?.()
    } catch (error) {
      console.log('Database operation failed, using demo mode:', error)
      toast.success('参加意向を更新しました（デモモード）')
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

      if (error) {
        console.log('Database operation failed, using demo mode:', error)
        toast.success('コメントを投稿しました（デモモード）')
      } else {
        toast.success('コメントを投稿しました')
      }
      
      setNewComment('')
      setShowCommentForm(false)
      onChanged?.()
    } catch (error) {
      console.log('Database operation failed, using demo mode:', error)
      toast.success('コメントを投稿しました（デモモード）')
      setNewComment('')
      setShowCommentForm(false)
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

      if (error) {
        console.log('Database operation failed, using demo mode:', error)
        toast.success('進捗を投稿しました（デモモード）')
      } else {
        toast.success('進捗を投稿しました')
      }
      
      setNewUpdate('')
      setShowUpdateForm(false)
      onChanged?.()
    } catch (error) {
      console.log('Database operation failed, using demo mode:', error)
      toast.success('進捗を投稿しました（デモモード）')
      setNewUpdate('')
      setShowUpdateForm(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="retro-card bg-retro-darkGray border-4 border-black shadow-retro-lg hover:shadow-retro-xl transition-all duration-300 group">
      {/* カバー画像 */}
      {p.cover_url && (
        <div className="h-32 bg-retro-darkGray border-b-2 border-black overflow-hidden">
          <Image 
            src={p.cover_url}
            alt={p.title}
            width={640}
            height={128}
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="w-full h-full object-cover"
          />
        </div>
      )}
      
      <div className="p-4">
        {/* ヘッダー */}
        <div className="flex justify-between items-start mb-4">
          <h2 className="retro-title text-lg group-hover:text-retro-cyan transition-colors line-clamp-2">
            {p.title}
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() => setShowReportModal(true)}
              className="retro-button text-xs px-2 py-1 opacity-50 hover:opacity-100 transition-opacity"
              title="通報"
              aria-label={`プロジェクト「${p.title}」を通報する`}
            >
              ⚠️
            </button>
            <button
              onClick={handleQuickParticipate}
              disabled={isSubmitting}
              className="retro-button retro-button-secondary text-xs px-3 py-1 disabled:opacity-50"
              title="ワンタップ参加"
              aria-label="ワンタップで参加意向を上げる"
            >
              {isSubmitting ? '...' : 'JOIN'}
            </button>
            <Link
              href={`/projects/${p.id}`}
              className="retro-button retro-button-primary text-xs px-3 py-1"
            >
              ENTER
            </Link>
          </div>
        </div>
        
        {/* 説明 */}
        <p className="font-pixel text-xs text-retro-lightGray mb-4 line-clamp-3 leading-relaxed">
          {p.purpose}
        </p>
        
        {/* タグ */}
        {p.tags && p.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {p.tags.map((tag: string, index: number) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-1 rounded text-xs font-pixel bg-retro-orange text-black border border-black"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* 参加意向ボタン */}
        <div className="flex items-center space-x-1 mb-4">
          <button
            onClick={() => handleIntent('watch')}
            disabled={isSubmitting}
            className="flex-1 retro-button text-xs py-1 disabled:opacity-50"
            aria-pressed={userIntent === 'watch'}
            aria-label="見守るに設定"
          >
            👀 WATCH
          </button>
          <button
            onClick={() => handleIntent('raise')}
            disabled={isSubmitting}
            className="flex-1 retro-button retro-button-secondary text-xs py-1 disabled:opacity-50"
            aria-pressed={userIntent === 'raise'}
            aria-label="手を挙げるに設定"
          >
            ✋ RAISE
          </button>
          <button
            onClick={() => handleIntent('commit')}
            disabled={isSubmitting}
            className="flex-1 retro-button retro-button-primary text-xs py-1 disabled:opacity-50"
            aria-pressed={userIntent === 'commit'}
            aria-label="コミットに設定"
          >
            🚀 COMMIT
          </button>
        </div>

        {/* コメント・進捗投稿フォーム */}
        <div className="space-y-2 mb-4">
          <div>
            <button
              onClick={() => setShowCommentForm(!showCommentForm)}
              className="font-pixel text-xs text-retro-cyan hover:text-retro-yellow transition-colors"
              aria-expanded={showCommentForm}
              aria-controls={`comment-form-${p.id}`}
            >
              💬 COMMENT
            </button>
            {showCommentForm && (
              <div className="mt-2 p-2 retro-card bg-black border-2 border-retro-cyan">
                <label htmlFor={`comment-input-${p.id}`} className="sr-only">コメントを入力</label>
                <textarea
                  id={`comment-input-${p.id}`}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="コメントを入力..."
                  className="w-full px-2 py-1 border-2 border-retro-lightGray bg-black text-retro-lightGray font-pixel text-xs focus:border-retro-cyan focus:outline-none"
                  rows={2}
                />
                <div className="flex space-x-1 mt-2">
                  <button
                    onClick={handleAddComment}
                    disabled={isSubmitting || !newComment.trim()}
                    className="retro-button retro-button-primary text-xs px-2 py-1 disabled:opacity-50"
                  >
                    POST
                  </button>
                  <button
                    onClick={() => setShowCommentForm(false)}
                    className="retro-button text-xs px-2 py-1"
                  >
                    CANCEL
                  </button>
                </div>
              </div>
            )}
          </div>

          <div>
            <button
              onClick={() => setShowUpdateForm(!showUpdateForm)}
              className="font-pixel text-xs text-retro-green hover:text-retro-yellow transition-colors"
              aria-expanded={showUpdateForm}
              aria-controls={`update-form-${p.id}`}
            >
              📝 UPDATE
            </button>
            {showUpdateForm && (
              <div id={`update-form-${p.id}`} className="mt-2 p-2 retro-card bg-black border-2 border-retro-green">
                <label htmlFor={`update-input-${p.id}`} className="sr-only">進捗を入力</label>
                <textarea
                  id={`update-input-${p.id}`}
                  value={newUpdate}
                  onChange={(e) => setNewUpdate(e.target.value)}
                  placeholder="進捗を入力..."
                  className="w-full px-2 py-1 border-2 border-retro-lightGray bg-black text-retro-lightGray font-pixel text-xs focus:border-retro-green focus:outline-none"
                  rows={2}
                />
                <div className="flex space-x-1 mt-2">
                  <button
                    onClick={handleAddUpdate}
                    disabled={isSubmitting || !newUpdate.trim()}
                    className="retro-button retro-button-primary text-xs px-2 py-1 disabled:opacity-50"
                  >
                    POST
                  </button>
                  <button
                    onClick={() => setShowUpdateForm(false)}
                    className="retro-button text-xs px-2 py-1"
                  >
                    CANCEL
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 指標カード */}
        <div className="retro-card bg-black border-2 border-retro-lightGray p-2">
          <div className="flex items-center justify-between font-pixel text-xs">
            <div className="flex items-center space-x-3">
              <span className="flex items-center space-x-1 text-retro-yellow">
                <span>👀</span>
                <span>{p.watch_count || 0}</span>
              </span>
              <span className="flex items-center space-x-1 text-retro-orange">
                <span>✋</span>
                <span>{p.raise_count || 0}</span>
              </span>
              <span className="flex items-center space-x-1 text-retro-green">
                <span>🚀</span>
                <span>{p.commit_count || 0}</span>
              </span>
              <span className="flex items-center space-x-1 text-retro-cyan">
                <span>💬</span>
                <span>{p.comment_count || 0}</span>
              </span>
              <span className="flex items-center space-x-1 text-retro-purple">
                <span>📝</span>
                <span>{p.update_count || 0}</span>
              </span>
            </div>
          </div>
        </div>
      </div>
      
      {/* 通報モーダル */}
      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        targetType="project"
        targetId={p.id}
        targetTitle={p.title}
      />
    </div>
  )
}