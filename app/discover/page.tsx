import { createClient } from '@/lib/supabaseServer'
import { notFound } from 'next/navigation'
import SwipeCard from '@/components/SwipeCard'

export default async function DiscoverPage() {
  const supabase = createClient()
  
  // ユーザーが関与していないプロジェクトをランダムに1件取得
  const { data: { user } } = await supabase.auth.getUser()
  
  let project = null
  if (user) {
    // ログインユーザーの場合：関与していないプロジェクトを取得
    const { data } = await supabase
      .from('projects')
      .select('*')
      .not('id', 'in', `(
        SELECT DISTINCT project_id FROM intents WHERE user_id = '${user.id}'
        UNION
        SELECT DISTINCT project_id FROM comments WHERE user_id = '${user.id}'
        UNION
        SELECT DISTINCT project_id FROM progress_updates WHERE user_id = '${user.id}'
        UNION
        SELECT DISTINCT project_id FROM discover_skips WHERE user_id = '${user.id}'
      )`)
      .order('random()')
      .limit(1)
      .single()
    
    project = data
  } else {
    // 未ログインの場合：ランダムに1件取得
    const { data } = await supabase
      .from('projects')
      .select('*')
      .order('random()')
      .limit(1)
      .single()
    
    project = data
  }

  if (!project) {
    return (
      <div className="max-w-md mx-auto mt-20 text-center">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">発見</h1>
          <p className="text-gray-600 mb-6">新しいプロジェクトが見つかりませんでした</p>
          <a
            href="/projects"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            プロジェクト一覧を見る
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto mt-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">発見</h1>
      <SwipeCard project={project} />
    </div>
  )
} 