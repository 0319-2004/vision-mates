'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabaseBrowser'
import toast from 'react-hot-toast'

interface ReactionButtonProps {
  targetType: 'update' | 'comment'
  targetId: string
  className?: string
}

export default function ReactionButton({ targetType, targetId, className = '' }: ReactionButtonProps) {
  const [reactionCount, setReactionCount] = useState(0)
  const [hasReacted, setHasReacted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [user, setUser] = useState<any>(null)

  const supabase = createClient()

  useEffect(() => {
    const loadReactionData = async () => {
      try {
        // 現在のユーザーを取得
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)

        if (!user) return

        // リアクション数を取得
        const { count } = await supabase
          .from('reactions')
          .select('*', { count: 'exact', head: true })
          .eq('target_type', targetType)
          .eq('target_id', targetId)

        setReactionCount(count || 0)

        // ユーザーがリアクションしているかチェック
        const { data: userReaction } = await supabase
          .from('reactions')
          .select('id')
          .eq('target_type', targetType)
          .eq('target_id', targetId)
          .eq('user_id', user.id)
          .single()

        setHasReacted(!!userReaction)
      } catch (error) {
        console.error('Error loading reaction data:', error)
      }
    }

    loadReactionData()
  }, [targetType, targetId, supabase])

  const handleReaction = async () => {
    if (!user) {
      toast.error('ログインが必要です')
      return
    }

    setIsLoading(true)

    try {
      if (hasReacted) {
        // リアクションを削除
        const { error } = await supabase
          .from('reactions')
          .delete()
          .eq('target_type', targetType)
          .eq('target_id', targetId)
          .eq('user_id', user.id)

        if (error) throw error

        setReactionCount(prev => Math.max(0, prev - 1))
        setHasReacted(false)
      } else {
        // リアクションを追加
        const { error } = await supabase
          .from('reactions')
          .insert({
            target_type: targetType,
            target_id: targetId,
            user_id: user.id,
            kind: 'clap'
          })

        if (error) throw error

        setReactionCount(prev => prev + 1)
        setHasReacted(true)
      }
    } catch (error) {
      console.error('Error toggling reaction:', error)
      toast.error('リアクションの更新に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <button
      onClick={handleReaction}
      disabled={isLoading}
      className={`retro-button text-xs px-2 py-1 transition-all duration-200 ${
        hasReacted 
          ? 'retro-button-primary' 
          : 'hover:bg-retro-cyan hover:text-black'
      } ${className}`}
      title={hasReacted ? 'リアクションを取り消す' : 'リアクションする'}
    >
      👏 {reactionCount}
    </button>
  )
}

