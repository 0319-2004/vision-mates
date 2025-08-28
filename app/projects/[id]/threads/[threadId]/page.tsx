import { createClient } from '@/lib/supabaseServer'
import { notFound } from 'next/navigation'
import { Thread, Message } from '@/types'
import MessageList from '@/components/MessageList'
import MessageForm from '@/components/MessageForm'

interface PageProps {
  params: {
    id: string
    threadId: string
  }
}

export default async function ThreadPage({ params }: PageProps) {
  const supabase = createClient()
  
  // スレッド情報を取得
  const { data: thread, error: threadError } = await supabase
    .from('threads')
    .select('*')
    .eq('id', params.threadId)
    .single()

  if (threadError || !thread) {
    notFound()
  }

  // メッセージ一覧を取得
  const { data: messages } = await supabase
    .from('messages')
    .select(`
      *,
      user:users(email)
    `)
    .eq('thread_id', params.threadId)
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{thread.title}</h1>
          <p className="text-gray-600 mt-2">
            作成日: {new Date(thread.created_at).toLocaleDateString('ja-JP')}
          </p>
        </div>
        <a
          href={`/projects/${params.id}/threads`}
          className="text-blue-600 hover:text-blue-800 font-medium"
        >
          ← スレッド一覧に戻る
        </a>
      </div>

      {/* メッセージ一覧 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">メッセージ</h2>
        <MessageList messages={messages || []} />
      </div>

      {/* メッセージ投稿フォーム */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">メッセージを投稿</h2>
        <MessageForm threadId={params.threadId} />
      </div>
    </div>
  )
} 