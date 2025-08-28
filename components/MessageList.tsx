'use client'

import { Message } from '@/types'

interface MessageListProps {
  messages: Message[]
}

export default function MessageList({ messages }: MessageListProps) {
  if (messages.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">まだメッセージがありません</p>
        <p className="text-sm text-gray-400 mt-2">
          最初のメッセージを投稿してみましょう！
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {messages.map((message) => (
        <div key={message.id} className="border-b border-gray-100 pb-4 last:border-b-0">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">
              {message.user?.email || '匿名ユーザー'}
            </span>
            <span className="text-sm text-gray-400">
              {new Date(message.created_at).toLocaleString('ja-JP')}
            </span>
          </div>
          <div className="text-gray-700 whitespace-pre-wrap">{message.text}</div>
        </div>
      ))}
    </div>
  )
} 