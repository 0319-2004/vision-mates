'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabaseBrowser'
import toast from 'react-hot-toast'

interface Room {
  room_id: string
  joined_at: string
  rooms: {
    id: string
    name: string
    project_id: string | null
    created_at: string
    created_by: string
  }
}

interface Message {
  id: string
  room_id: string
  user_id: string
  body: string
  created_at: string
  user?: {
    email: string
  }
}

interface MessagesInterfaceProps {
  initialRooms: Room[]
}

export default function MessagesInterface({ initialRooms }: MessagesInterfaceProps) {
  const [rooms, setRooms] = useState<Room[]>(initialRooms)
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [user, setUser] = useState<any>(null)

  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()
  }, [supabase.auth])

  const loadMessages = useCallback(async (roomId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          user:users(email)
        `)
        .eq('room_id', roomId)
        .order('created_at', { ascending: true })

      if (error) throw error
      setMessages(data || [])
    } catch (error) {
      console.error('Error loading messages:', error)
      toast.error('メッセージの読み込みに失敗しました')
    }
  }, [supabase])

  const subscribeToMessages = useCallback((roomId: string) => {
    const subscription = supabase
      .channel(`messages:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          const newMessage = payload.new as Message
          setMessages(prev => [...prev, newMessage])
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])

  useEffect(() => {
    if (selectedRoom) {
      loadMessages(selectedRoom.room_id)
      subscribeToMessages(selectedRoom.room_id)
    }
  }, [selectedRoom, loadMessages, subscribeToMessages])

  

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedRoom || !user) return

    setIsSubmitting(true)
    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          room_id: selectedRoom.room_id,
          user_id: user.id,
          body: newMessage.trim(),
        })

      if (error) throw error

      setNewMessage('')
    } catch (error) {
      console.error('Error sending message:', error)
      toast.error('メッセージの送信に失敗しました')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="retro-card bg-black border-2 border-retro-cyan p-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-96">
        {/* ルーム一覧 */}
        <div className="retro-card bg-retro-darkGray border-2 border-retro-lightGray p-4">
          <h2 className="retro-text-readable text-lg font-pixel mb-4" id="rooms-heading">ルーム一覧</h2>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {rooms.length === 0 ? (
              <p className="retro-text-readable-dark text-sm">参加しているルームがありません</p>
            ) : (
              rooms.map((room) => (
                <button
                  key={room.room_id}
                  onClick={() => setSelectedRoom(room)}
                  className={`w-full text-left p-3 rounded transition-colors ${
                    selectedRoom?.room_id === room.room_id
                      ? 'bg-retro-cyan text-black'
                      : 'bg-black text-retro-lightGray hover:bg-retro-darkGray'
                  }`}
                >
                  <div className="font-pixel text-sm">{room.rooms.name}</div>
                  {room.rooms.project_id && (
                    <div className="text-xs opacity-75">プロジェクト関連</div>
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        {/* メッセージエリア */}
        <div className="lg:col-span-2 flex flex-col">
          {selectedRoom ? (
            <>
              {/* ルームヘッダー */}
              <div className="retro-card bg-retro-darkGray border-2 border-retro-orange p-3 mb-4">
                <h3 className="retro-text-readable font-pixel">{selectedRoom.rooms.name}</h3>
                {selectedRoom.rooms.project_id && (
                  <p className="retro-text-readable-dark text-xs">プロジェクト関連ルーム</p>
                )}
              </div>

              {/* メッセージ一覧 */}
              <div className="flex-1 retro-card bg-retro-darkGray border-2 border-retro-lightGray p-4 mb-4 overflow-y-auto" role="log" aria-live="polite" aria-relevant="additions text" aria-labelledby="rooms-heading">
                <div className="space-y-3">
                  {messages.length === 0 ? (
                    <p className="retro-text-readable-dark text-sm text-center">メッセージがありません</p>
                  ) : (
                    messages.map((message) => (
                      <div
                        key={message.id}
                        className={`p-3 rounded ${
                          message.user_id === user?.id
                            ? 'bg-retro-cyan text-black ml-8'
                            : 'bg-black text-retro-lightGray mr-8'
                        }`}
                      >
                        <div className="text-xs opacity-75 mb-1">
                          {message.user?.email || '匿名ユーザー'}
                        </div>
                        <div className="font-pixel text-sm">{message.body}</div>
                        <div className="text-xs opacity-50 mt-1">
                          {new Date(message.created_at).toLocaleString('ja-JP')}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* メッセージ入力 */}
              <div className="flex gap-2">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="メッセージを入力..."
                  aria-label="メッセージを入力"
                  className="retro-textarea flex-1"
                  rows={2}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={isSubmitting || !newMessage.trim()}
                  className="retro-button retro-button-primary px-4 py-2 disabled:opacity-50"
                >
                  {isSubmitting ? '送信中...' : '送信'}
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className="retro-text-readable-dark text-center">
                ルームを選択してメッセージを開始してください
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
