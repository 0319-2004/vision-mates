import { createClient } from '@/lib/supabaseServer'
import { redirect } from 'next/navigation'
import NextDynamic from 'next/dynamic'
export const dynamic = 'force-dynamic'
const MessagesInterface = NextDynamic(() => import('@/components/MessagesInterface'), { ssr: false })

export default async function MessagesPage() {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return (
      <div className="min-h-screen bg-retro-darkGray flex items-center justify-center">
        <div className="retro-card bg-black border-2 border-retro-red p-8 text-center">
          <h1 className="retro-title text-2xl text-retro-red mb-4">デモメッセージ</h1>
          <p className="retro-text-readable mb-6">ログインしていないため、デモメッセージを表示しています。</p>
          <div className="retro-card bg-retro-darkGray border-2 border-retro-cyan p-6 mb-6">
            <h2 className="retro-text-readable text-xl font-pixel mb-4">📱 メッセージルーム</h2>
            <div className="space-y-4">
              <div className="retro-card bg-black border-2 border-retro-green p-4">
                <h3 className="retro-text-readable text-lg font-pixel mb-2">AIチャットボット開発</h3>
                <p className="retro-text-readable-dark text-sm mb-2">最新のメッセージ: 進捗どうですか？</p>
                <p className="retro-text-readable-dark text-xs">2時間前</p>
              </div>
              <div className="retro-card bg-black border-2 border-retro-orange p-4">
                <h3 className="retro-text-readable text-lg font-pixel mb-2">エコフレンドリーなアプリ</h3>
                <p className="retro-text-readable-dark text-sm mb-2">最新のメッセージ: デザインのアイデアを共有しましょう</p>
                <p className="retro-text-readable-dark text-xs">5時間前</p>
              </div>
              <div className="retro-card bg-black border-2 border-retro-purple p-4">
                <h3 className="retro-text-readable text-lg font-pixel mb-2">オンライン学習プラットフォーム</h3>
                <p className="retro-text-readable-dark text-sm mb-2">最新のメッセージ: 機能追加の提案があります</p>
                <p className="retro-text-readable-dark text-xs">1日前</p>
              </div>
            </div>
          </div>
          <a href="/" className="retro-button retro-button-primary">
            ホームに戻る
          </a>
        </div>
      </div>
    )
  }

  // ユーザーが参加しているルームを取得（エラーハンドリング付き）
  let rooms: any[] = []
  try {
    const { data: roomsData } = await supabase
      .from('room_members')
      .select(`
        room_id,
        joined_at,
        rooms!inner(
          id,
          name,
          project_id,
          created_at,
          created_by
        )
      `)
      .eq('user_id', user.id)
      .order('joined_at', { ascending: false })

    // 型を修正
    rooms = roomsData?.map(room => ({
      room_id: room.room_id,
      joined_at: room.joined_at,
      rooms: Array.isArray(room.rooms) ? room.rooms[0] : room.rooms
    })) || []
  } catch (error) {
    console.log('Error fetching rooms:', error)
  }

  return (
    <div className="min-h-screen bg-retro-darkGray">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="retro-title text-3xl text-retro-cyan mb-8 text-center">メッセージ</h1>
        <MessagesInterface initialRooms={rooms} />
      </div>
    </div>
  )
}
