'use client'

import { useState } from 'react'
import { Project, Comment, ProgressUpdate, Intent, IntentLevel } from '@/types'
import { createClient } from '@/lib/supabaseBrowser'
import { commentSchema, progressUpdateSchema, intentSchema } from '@/lib/schemas'
import ShareButtons from './ShareButtons'
import ReactionButton from './ReactionButton'
import { checkFirstCommentBadge, checkFirstUpdateBadge, awardShareBadge } from '@/lib/badges'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'

interface ProjectDetailProps {
  project: Project
  comments: Comment[]
  progressUpdates: ProgressUpdate[]
  intents: Intent[]
}

export default function ProjectDetail({
  project,
  comments: initialComments,
  progressUpdates: initialProgressUpdates,
  intents: initialIntents,
}: ProjectDetailProps) {
  const [comments, setComments] = useState<Comment[]>(initialComments)
  const [progressUpdates, setProgressUpdates] = useState<ProgressUpdate[]>(initialProgressUpdates)
  const [intents, setIntents] = useState<Intent[]>(initialIntents)
  const [newComment, setNewComment] = useState('')
  const [newProgress, setNewProgress] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const supabase = createClient()
  const router = useRouter()

  const handleCreateThread = async () => {
    try {
      setIsSubmitting(true)
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('ログインが必要です')
        return
      }

      // ルームを作成
      const { data: room, error: roomError } = await supabase
        .from('rooms')
        .insert({
          name: `${project.title} - スレッド`,
          project_id: project.id,
          created_by: user.id,
        })
        .select()
        .single()

      if (roomError) throw roomError

      // 作成者をルームメンバーに追加
      const { error: memberError } = await supabase
        .from('room_members')
        .insert({
          room_id: room.id,
          user_id: user.id,
        })

      if (memberError) throw memberError

      toast.success('スレッドを作成しました！')
      router.push('/messages')
    } catch (error) {
      console.error('Error creating thread:', error)
      toast.error('スレッドの作成に失敗しました')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAddComment = async () => {
    try {
      setIsSubmitting(true)
      setError('')

      const validation = commentSchema.safeParse({ text: newComment })
      if (!validation.success) {
        setError(validation.error.errors[0].message)
        return
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('ログインが必要です')
        return
      }

      const { data, error } = await supabase
        .from('comments')
        .insert({
          project_id: project.id,
          user_id: user.id,
          text: newComment,
        })
        .select(`
          *,
          user:users(email)
        `)
        .single()

      if (error) throw error

      setComments([data, ...comments])
      setNewComment('')

      // バッジチェック
      const badgeAwarded = await checkFirstCommentBadge(user.id)
      if (badgeAwarded) {
        toast.success('🏆 初コメントバッジを獲得しました！')
      }
    } catch (err) {
      setError('コメントの投稿に失敗しました')
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAddProgress = async () => {
    try {
      setIsSubmitting(true)
      setError('')

      const validation = progressUpdateSchema.safeParse({ text: newProgress })
      if (!validation.success) {
        setError(validation.error.errors[0].message)
        return
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('ログインが必要です')
        return
      }

      const { data, error } = await supabase
        .from('progress_updates')
        .insert({
          project_id: project.id,
          user_id: user.id,
          text: newProgress,
        })
        .select(`
          *,
          user:users(email)
        `)
        .single()

      if (error) throw error

      setProgressUpdates([data, ...progressUpdates])
      setNewProgress('')

      // バッジチェック
      const badgeAwarded = await checkFirstUpdateBadge(user.id)
      if (badgeAwarded) {
        toast.success('🏆 初進捗バッジを獲得しました！')
      }
    } catch (err) {
      setError('進捗の投稿に失敗しました')
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleIntent = async (level: IntentLevel) => {
    try {
      setError('')

      const validation = intentSchema.safeParse({ level })
      if (!validation.success) {
        setError(validation.error.errors[0].message)
        return
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('ログインが必要です')
        return
      }

      // 既存の意向を削除
      await supabase
        .from('intents')
        .delete()
        .eq('project_id', project.id)
        .eq('user_id', user.id)

      // 新しい意向を追加
      const { data, error } = await supabase
        .from('intents')
        .insert({
          project_id: project.id,
          user_id: user.id,
          level,
        })
        .select()
        .single()

      if (error) throw error

      // 既存の意向を更新
      const updatedIntents = intents.filter(intent => intent.user_id !== user.id)
      setIntents([...updatedIntents, data])
    } catch (err) {
      setError('参加意向の更新に失敗しました')
      console.error(err)
    }
  }

  const getIntentCount = (level: IntentLevel) => {
    return intents.filter(intent => intent.level === level).length
  }

  const getUserIntent = () => {
    // この関数は非同期でユーザーを取得する必要があるため、
    // 現在の実装では常にnullを返す
    // 実際の使用時は、useEffectでユーザー状態を管理する必要がある
    return null
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* プロジェクト情報 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">{project.title}</h1>
        <p className="text-gray-600 mb-4">{project.purpose}</p>
        
        {project.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {project.tags.map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* 参加意向ボタン */}
        <div className="flex items-center space-x-4 mb-6">
          <span className="text-sm font-medium text-gray-700">参加意向:</span>
          <button
            onClick={() => handleIntent('watch')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              getUserIntent() === 'watch'
                ? 'bg-yellow-100 text-yellow-800 border-2 border-yellow-300'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            👀 見守る ({getIntentCount('watch')})
          </button>
          <button
            onClick={() => handleIntent('raise')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              getUserIntent() === 'raise'
                ? 'bg-orange-100 text-orange-800 border-2 border-orange-300'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            ✋ 手を挙げる ({getIntentCount('raise')})
          </button>
          <button
            onClick={() => handleIntent('commit')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              getUserIntent() === 'commit'
                ? 'bg-green-100 text-green-800 border-2 border-green-300'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            🚀 コミット ({getIntentCount('commit')})
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* 共有ボタン */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">このプロジェクトを共有</h3>
          <ShareButtons
            projectId={project.id}
            projectTitle={project.title}
            projectDescription={project.purpose}
          />
        </div>

        {/* スレッド作成 */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">プロジェクトスレッド</h3>
          <button
            onClick={handleCreateThread}
            disabled={isSubmitting}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? '作成中...' : 'スレッドを作成'}
          </button>
        </div>
      </div>

      {/* 進捗更新 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">進捗更新</h2>
        
        <div className="mb-4">
          <textarea
            value={newProgress}
            onChange={(e) => setNewProgress(e.target.value)}
            placeholder="進捗を入力してください..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={3}
          />
          <button
            onClick={handleAddProgress}
            disabled={isSubmitting || !newProgress.trim()}
            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? '投稿中...' : '進捗を投稿'}
          </button>
        </div>

        <div className="space-y-4">
          {progressUpdates.map((update) => (
            <div key={update.id} className="border-b border-gray-100 pb-4 last:border-b-0">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500">
                  {update.user?.email || '匿名ユーザー'}
                </span>
                <span className="text-sm text-gray-400">
                  {new Date(update.created_at).toLocaleString('ja-JP')}
                </span>
              </div>
              <p className="text-gray-700">{update.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* タブナビゲーション */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <a
              href={`/projects/${project.id}`}
              className="border-b-2 border-blue-500 py-4 px-1 text-sm font-medium text-blue-600"
            >
              進捗・コメント
            </a>
            <a
              href={`/projects/${project.id}/threads`}
              className="border-b-2 border-transparent py-4 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300"
            >
              スレッド
            </a>
          </nav>
        </div>

        <div className="p-6">
          {/* 進捗更新 */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">進捗更新</h2>
            
            <div className="mb-4">
              <textarea
                value={newProgress}
                onChange={(e) => setNewProgress(e.target.value)}
                placeholder="進捗を入力してください..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
              />
              <button
                onClick={handleAddProgress}
                disabled={isSubmitting || !newProgress.trim()}
                className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? '投稿中...' : '進捗を投稿'}
              </button>
            </div>

            <div className="space-y-4">
              {progressUpdates.map((update) => (
                <div key={update.id} className="border-b border-gray-100 pb-4 last:border-b-0">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-500">
                      {update.user?.email || '匿名ユーザー'}
                    </span>
                    <span className="text-sm text-gray-400">
                      {new Date(update.created_at).toLocaleString('ja-JP')}
                    </span>
                  </div>
                  <p className="text-gray-700 mb-2">{update.text}</p>
                  <div className="flex items-center gap-2">
                    <ReactionButton targetType="update" targetId={update.id} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* コメント */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">コメント</h2>
            
            <div className="mb-4">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="コメントを入力してください..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
              />
              <button
                onClick={handleAddComment}
                disabled={isSubmitting || !newComment.trim()}
                className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? '投稿中...' : 'コメントを投稿'}
              </button>
            </div>

            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="border-b border-gray-100 pb-4 last:border-b-0">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-500">
                      {comment.user?.email || '匿名ユーザー'}
                    </span>
                    <span className="text-sm text-gray-400">
                      {new Date(comment.created_at).toLocaleString('ja-JP')}
                    </span>
                  </div>
                  <p className="text-gray-700 mb-2">{comment.text}</p>
                  <div className="flex items-center gap-2">
                    <ReactionButton targetType="comment" targetId={comment.id} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 