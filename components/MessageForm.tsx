'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabaseBrowser'
import toast from 'react-hot-toast'

interface MessageFormProps {
  threadId: string
}

export default function MessageForm({ threadId }: MessageFormProps) {
  const [text, setText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!text.trim()) {
      toast.error('メッセージを入力してください')
      return
    }

    setIsSubmitting(true)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        toast.error('ログインが必要です')
        return
      }

      const { error } = await supabase
        .from('messages')
        .insert({
          thread_id: threadId,
          user_id: user.id,
          text: text.trim()
        })

      if (error) throw error

      toast.success('メッセージを投稿しました！')
      setText('')
      
      // ページをリロードしてメッセージを更新
      window.location.reload()
    } catch (error) {
      toast.error('メッセージの投稿に失敗しました')
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="text" className="block text-sm font-medium text-gray-700 mb-2">
          メッセージ
        </label>
        <textarea
          id="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="メッセージを入力してください..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows={4}
        />
      </div>
      
      <button
        type="submit"
        disabled={isSubmitting || !text.trim()}
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? '投稿中...' : 'メッセージを投稿'}
      </button>
    </form>
  )
} 