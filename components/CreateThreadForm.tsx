'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabaseBrowser'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

interface CreateThreadFormProps {
  projectId: string
}

export default function CreateThreadForm({ projectId }: CreateThreadFormProps) {
  const [title, setTitle] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!title.trim()) {
      toast.error('スレッドタイトルを入力してください')
      return
    }

    setIsSubmitting(true)
    
    try {
      // まずSupabaseの接続をテスト（認証状態をリセットしない）
      const { error: testError } = await supabase
        .from('threads')
        .select('id')
        .limit(1)

      if (testError) {
        console.log('Database connection failed, using demo mode:', testError)
        // デモモードでスレッド作成
        const demoThreadId = `demo-thread-${Date.now()}`
        toast.success('スレッドを作成しました！（デモモード）')
        setTitle('')
        router.push(`/projects/${projectId}/threads/${demoThreadId}`)
        return
      }

      // データベースが利用可能な場合のみ認証チェック
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        // デモモードでスレッド作成
        const demoThreadId = `demo-thread-${Date.now()}`
        toast.success('スレッドを作成しました！（デモモード）')
        setTitle('')
        router.push(`/projects/${projectId}/threads/${demoThreadId}`)
        return
      }

      const { data, error } = await supabase
        .from('threads')
        .insert({
          project_id: projectId,
          title: title.trim(),
          created_by: user.id
        })
        .select()
        .single()

      if (error) {
        console.log('Database operation failed, using demo mode:', error)
        // デモモードでスレッド作成
        const demoThreadId = `demo-thread-${Date.now()}`
        toast.success('スレッドを作成しました！（デモモード）')
        setTitle('')
        router.push(`/projects/${projectId}/threads/${demoThreadId}`)
        return
      }

      toast.success('スレッドを作成しました！')
      setTitle('')
      
      // 作成したスレッドに遷移
      router.push(`/projects/${projectId}/threads/${data.id}`)
    } catch (error) {
      console.log('Thread creation failed, using demo mode:', error)
      // デモモードでスレッド作成
      const demoThreadId = `demo-thread-${Date.now()}`
      toast.success('スレッドを作成しました！（デモモード）')
      setTitle('')
      router.push(`/projects/${projectId}/threads/${demoThreadId}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
          スレッドタイトル
        </label>
        <input
          type="text"
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="例：技術的な質問について"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          maxLength={100}
        />
      </div>
      
      <button
        type="submit"
        disabled={isSubmitting || !title.trim()}
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? '作成中...' : 'スレッドを作成'}
      </button>
    </form>
  )
} 