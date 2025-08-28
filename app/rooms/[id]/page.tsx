import { createClient } from '@/lib/supabaseServer'
import { notFound } from 'next/navigation'
import { Room, FocusSession, Clap } from '@/types'
import FocusRoom from '@/components/FocusRoom'

interface PageProps {
  params: {
    id: string
  }
}

export default async function RoomPage({ params }: PageProps) {
  const supabase = createClient()
  
  // ルーム情報を取得
  const { data: room, error: roomError } = await supabase
    .from('rooms')
    .select('*')
    .eq('id', params.id)
    .single()

  if (roomError || !room) {
    notFound()
  }

  // 最新のセッションを取得
  const { data: currentSession } = await supabase
    .from('focus_sessions')
    .select('*')
    .eq('room_id', params.id)
    .is('ended_at', null)
    .order('started_at', { ascending: false })
    .limit(1)
    .single()

  // 最新のセッションの拍手を取得
  let claps: Clap[] = []
  if (currentSession) {
    const { data: clapsData } = await supabase
      .from('claps')
      .select('*')
      .eq('session_id', currentSession.id)
      .order('created_at', { ascending: false })
    
    claps = clapsData || []
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">{room.title}</h1>
        <p className="text-gray-600 mt-2">
          作成日: {new Date(room.created_at).toLocaleDateString('ja-JP')}
        </p>
      </div>

      <FocusRoom 
        room={room} 
        currentSession={currentSession || undefined}
        claps={claps}
      />
    </div>
  )
} 