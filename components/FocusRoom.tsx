'use client'

import { useState, useEffect, useRef } from 'react'
import { Room, FocusSession, Clap } from '@/types'
import { createClient } from '@/lib/supabaseBrowser'
import { RealtimeChannel } from '@supabase/supabase-js'
import toast from 'react-hot-toast'

interface FocusRoomProps {
  room: Room
  currentSession?: FocusSession
  claps: Clap[]
}

interface PresenceUser {
  userId: string
  name: string
}

export default function FocusRoom({ room, currentSession, claps: initialClaps }: FocusRoomProps) {
  const [session, setSession] = useState<FocusSession | undefined>(currentSession)
  const [claps, setClaps] = useState<Clap[]>(initialClaps)
  const [timeLeft, setTimeLeft] = useState<number>(0)
  const [isActive, setIsActive] = useState<boolean>(false)
  const [currentTask, setCurrentTask] = useState<string>('')
  const [presenceUsers, setPresenceUsers] = useState<PresenceUser[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [userName, setUserName] = useState('')
  
  const supabase = createClient()
  const channelRef = useRef<RealtimeChannel | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // ユーザー情報を取得
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserName(user.email?.split('@')[0] || 'ユーザー')
      }
    }
    getUser()
  }, [supabase.auth])

  // リアルタイム接続を設定
  useEffect(() => {
    const channel = supabase.channel(`room:${room.id}`)
    
    // Presence設定
    channel
      .on('presence', { event: 'sync' }, () => {
        const presence = channel.presenceState()
        const users: PresenceUser[] = Object.values(presence).flat().map((user: any) => ({
          userId: user.userId,
          name: user.name
        }))
        setPresenceUsers(users)
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('User joined:', newPresences)
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('User left:', leftPresences)
      })
      .on('broadcast', { event: 'session_started' }, ({ payload }) => {
        setSession(payload.session)
        setIsActive(true)
        setTimeLeft(25 * 60) // 25分
      })
      .on('broadcast', { event: 'session_ended' }, () => {
        setIsActive(false)
        setTimeLeft(0)
        if (timerRef.current) {
          clearInterval(timerRef.current)
        }
      })
      .on('broadcast', { event: 'clap_added' }, ({ payload }) => {
        setClaps(prev => [payload.clap, ...prev])
      })

    // Presenceに参加
    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({
          userId: (await supabase.auth.getUser()).data.user?.id || 'anonymous',
          name: userName
        })
      }
    })

    channelRef.current = channel

    return () => {
      channel.unsubscribe()
    }
  }, [room.id, supabase, userName])

  // タイマー管理
  useEffect(() => {
    if (session && isActive) {
      const startTime = new Date(session.started_at).getTime()
      const now = Date.now()
      const elapsed = Math.floor((now - startTime) / 1000)
      const remaining = Math.max(0, 25 * 60 - elapsed)
      
      setTimeLeft(remaining)

      if (remaining > 0) {
        timerRef.current = setInterval(() => {
          setTimeLeft(prev => {
            const newTime = prev - 1
            if (newTime <= 0) {
              setIsActive(false)
              if (timerRef.current) {
                clearInterval(timerRef.current)
              }
              return 0
            }
            return newTime
          })
        }, 1000)
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [session, isActive])

  const handleStartSession = async () => {
    try {
      setIsSubmitting(true)
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('ログインが必要です')
        return
      }

      const { data: newSession, error } = await supabase
        .from('focus_sessions')
        .insert({
          room_id: room.id,
          started_by: user.id
        })
        .select()
        .single()

      if (error) throw error

      setSession(newSession)
      setIsActive(true)
      setTimeLeft(25 * 60)

      // 他の参加者に通知
      channelRef.current?.send({
        type: 'broadcast',
        event: 'session_started',
        payload: { session: newSession }
      })

      toast.success('セッションを開始しました！')
    } catch (error) {
      toast.error('セッションの開始に失敗しました')
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEndSession = async () => {
    try {
      if (!session) return

      await supabase
        .from('focus_sessions')
        .update({ ended_at: new Date().toISOString() })
        .eq('id', session.id)

      setIsActive(false)
      setTimeLeft(0)
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }

      // 他の参加者に通知
      channelRef.current?.send({
        type: 'broadcast',
        event: 'session_ended'
      })

      toast.success('セッションを終了しました！')
    } catch (error) {
      toast.error('セッションの終了に失敗しました')
      console.error(error)
    }
  }

  const handleAddClap = async () => {
    try {
      if (!session) return

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('ログインが必要です')
        return
      }

      const { data: newClap, error } = await supabase
        .from('claps')
        .insert({
          session_id: session.id,
          user_id: user.id
        })
        .select()
        .single()

      if (error) throw error

      setClaps(prev => [newClap, ...prev])

      // 他の参加者に通知
      channelRef.current?.send({
        type: 'broadcast',
        event: 'clap_added',
        payload: { clap: newClap }
      })

      toast.success('👏 拍手を送りました！')
    } catch (error) {
      toast.error('拍手の送信に失敗しました')
      console.error(error)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const totalClaps = claps.reduce((sum, clap) => sum + clap.count, 0)

  return (
    <div className="space-y-6">
      {/* タイマー */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">ポモドーロタイマー</h2>
        
        <div className="text-center mb-6">
          <div className="text-6xl font-bold text-blue-600 mb-4">
            {formatTime(timeLeft)}
          </div>
          
          <div className="flex justify-center gap-4">
            {!isActive ? (
              <button
                onClick={handleStartSession}
                disabled={isSubmitting}
                className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50"
              >
                {isSubmitting ? '開始中...' : '開始'}
              </button>
            ) : (
              <button
                onClick={handleEndSession}
                className="px-6 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700"
              >
                終了
              </button>
            )}
          </div>
        </div>

        {/* 現在のタスク */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            今やること
          </label>
          <input
            type="text"
            value={currentTask}
            onChange={(e) => setCurrentTask(e.target.value)}
            placeholder="例：プロジェクトの設計書を作成"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* 参加者 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">参加者 ({presenceUsers.length})</h2>
        <div className="flex flex-wrap gap-2">
          {presenceUsers.map((user) => (
            <span
              key={user.userId}
              className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800"
            >
              👤 {user.name}
            </span>
          ))}
        </div>
      </div>

      {/* 拍手 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">拍手</h2>
          <button
            onClick={handleAddClap}
            className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600"
          >
            👏 拍手を送る
          </button>
        </div>
        
        <div className="text-center">
          <div className="text-3xl font-bold text-yellow-600 mb-2">
            {totalClaps} 👏
          </div>
          <p className="text-gray-600">みんなで頑張りましょう！</p>
        </div>
      </div>
    </div>
  )
} 