import { createClient } from '@/lib/supabaseServer'
import { notFound } from 'next/navigation'
import { Project, Thread } from '@/types'
import ThreadList from '@/components/ThreadList'
import CreateThreadForm from '@/components/CreateThreadForm'

interface PageProps {
  params: {
    id: string
  }
}

export default async function ThreadsPage({ params }: PageProps) {
  const supabase = createClient()
  
  // プロジェクト情報を取得
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('*')
    .eq('id', params.id)
    .single()

  if (projectError || !project) {
    notFound()
  }

  // スレッド一覧を取得
  const { data: threads } = await supabase
    .from('threads')
    .select('*')
    .eq('project_id', params.id)
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">スレッド</h1>
          <p className="text-gray-600 mt-2">{project.title}</p>
        </div>
        <a
          href={`/projects/${params.id}`}
          className="text-blue-600 hover:text-blue-800 font-medium"
        >
          ← プロジェクト詳細に戻る
        </a>
      </div>

      {/* スレッド作成フォーム */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">新しいスレッドを作成</h2>
        <CreateThreadForm projectId={params.id} />
      </div>

      {/* スレッド一覧 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">スレッド一覧</h2>
        <ThreadList threads={threads || []} projectId={params.id} />
      </div>
    </div>
  )
} 