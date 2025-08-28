'use client'

import { useState, useEffect } from 'react'
import { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabaseBrowser'
import { toast } from 'react-hot-toast'

interface ProfileEditFormProps {
  user: User
}

interface ProfileData {
  display_name?: string
  bio?: string
  avatar_url?: string
}

export default function ProfileEditForm({ user }: ProfileEditFormProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    if (isEditing) {
      loadProfile()
    }
  }, [isEditing])

  const loadProfile = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('display_name, bio, avatar_url')
        .eq('id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      if (data) {
        setDisplayName(data.display_name || '')
        setBio(data.bio || '')
      }
    } catch (error) {
      console.error('プロフィール読み込みエラー:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleSave = async () => {
    if (!displayName.trim()) {
      toast.error('表示名を入力してください')
      return
    }

    setIsSubmitting(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          display_name: displayName.trim(),
          bio: bio.trim(),
          updated_at: new Date().toISOString()
        })

      if (error) throw error

      toast.success('プロフィールを更新しました')
      setIsEditing(false)
      
      // ページをリロードして更新を反映
      window.location.reload()
    } catch (error) {
      toast.error('プロフィールの更新に失敗しました')
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    setDisplayName('')
    setBio('')
  }

  if (isEditing) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">プロフィール編集</h3>
        
        {isLoading ? (
          <div className="text-center py-4">
            <p className="text-gray-500">読み込み中...</p>
          </div>
        ) : (
          <>
            <div>
              <label htmlFor="displayName" className="block text-sm font-medium text-gray-700">
                表示名 *
              </label>
              <input
                type="text"
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="表示名を入力"
                maxLength={50}
              />
            </div>
            <div>
              <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
                自己紹介
              </label>
              <textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="自己紹介を入力（任意）"
                maxLength={200}
              />
              <p className="mt-1 text-xs text-gray-500">
                {bio.length}/200文字
              </p>
            </div>
            <div className="flex space-x-2 pt-2">
              <button
                onClick={handleSave}
                disabled={isSubmitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {isSubmitting ? '保存中...' : '保存'}
              </button>
              <button
                onClick={handleCancel}
                disabled={isSubmitting}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 disabled:opacity-50"
              >
                キャンセル
              </button>
            </div>
          </>
        )}
      </div>
    )
  }

  return (
    <button
      onClick={handleEdit}
      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
    >
      プロフィール編集
    </button>
  )
} 