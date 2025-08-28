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
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        toast.error('ログインが必要です')
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

      if (error) throw error

      toast.success('スレッドを作成しました！')
      setTitle('')
      
      // 作成したスレッドに遷移
      router.push(`/projects/${projectId}/threads/${data.id}`)
    } catch (error) {
      toast.error('スレッドの作成に失敗しました')
      console.error(error)
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