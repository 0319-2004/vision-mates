import { createClient } from '@/lib/supabaseServer'
import { Room } from '@/types'
import CreateRoomForm from '@/components/CreateRoomForm'
import RoomCard from '@/components/RoomCard'

export default async function RoomsPage() {
  const supabase = createClient()
  
  // ルーム一覧を取得
  const { data: rooms } = await supabase
    .from('rooms')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">共同作業スプリント</h1>
      </div>

      {/* ルーム作成フォーム */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">新しいルームを作成</h2>
        <CreateRoomForm />
      </div>

      {/* ルーム一覧 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">ルーム一覧</h2>
        
        {rooms && rooms.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {rooms.map((room: Room) => (
              <RoomCard key={room.id} room={room} />
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">
            まだルームがありません。新しいルームを作成してみましょう！
          </p>
        )}
      </div>
    </div>
  )
} 