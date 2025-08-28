'use client'

import { Room } from '@/types'
import Link from 'next/link'

interface RoomCardProps {
  room: Room
}

export default function RoomCard({ room }: RoomCardProps) {
  return (
    <Link href={`/rooms/${room.id}`}>
      <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{room.title}</h3>
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>作成日: {new Date(room.created_at).toLocaleDateString('ja-JP')}</span>
          <span className="text-blue-600 hover:text-blue-800">参加する →</span>
        </div>
      </div>
    </Link>
  )
} 