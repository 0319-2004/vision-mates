'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabaseBrowser'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

export default function CreateRoomForm() {
  const [title, setTitle] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!title.trim()) {
      toast.error('ルーム名を入力してください')
      return
    }

    setIsSubmitting(true)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        // デモモードでルーム作成
        const demoRoomId = `demo-room-${Date.now()}`
        toast.success('ルームを作成しました！（デモモード）')
        setTitle('')
        router.push(`/rooms/${demoRoomId}`)
        return
      }

      const { data, error } = await supabase
        .from('rooms')
        .insert({
          title: title.trim(),
          owner_id: user.id
        })
        .select()
        .single()

      if (error) {
        console.log('Database operation failed, using demo mode:', error)
        // デモモードでルーム作成
        const demoRoomId = `demo-room-${Date.now()}`
        toast.success('ルームを作成しました！（デモモード）')
        setTitle('')
        router.push(`/rooms/${demoRoomId}`)
        return
      }

      toast.success('ルームを作成しました！')
      setTitle('')
      
      // 作成したルームに遷移
      router.push(`/rooms/${data.id}`)
    } catch (error) {
      console.log('Room creation failed, using demo mode:', error)
      // デモモードでルーム作成
      const demoRoomId = `demo-room-${Date.now()}`
      toast.success('ルームを作成しました！（デモモード）')
      setTitle('')
      router.push(`/rooms/${demoRoomId}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 retro-form-bg p-4 rounded-md">
      <div>
        <label htmlFor="title" className="retro-label">
          ルーム名
        </label>
        <input
          type="text"
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="例：プロジェクトAの集中作業"
          className="retro-input w-full"
          maxLength={100}
        />
      </div>
      
      <button
        type="submit"
        disabled={isSubmitting || !title.trim()}
        className="w-full retro-button retro-button-primary disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? '作成中...' : 'ルームを作成'}
      </button>
    </form>
  )
} 