'use client'

import { Thread } from '@/types'
import Link from 'next/link'

interface ThreadListProps {
  threads: Thread[]
  projectId: string
}

export default function ThreadList({ threads, projectId }: ThreadListProps) {
  if (threads.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 mb-4">まだスレッドがありません</p>
        <p className="text-sm text-gray-400">
          新しいスレッドを作成して、プロジェクトについて話し合いましょう！
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {threads.map((thread) => (
        <Link
          key={thread.id}
          href={`/projects/${projectId}/threads/${thread.id}`}
          className="block"
        >
          <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{thread.title}</h3>
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>作成日: {new Date(thread.created_at).toLocaleDateString('ja-JP')}</span>
              <span className="text-blue-600 hover:text-blue-800">参加する →</span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
} 