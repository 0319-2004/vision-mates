import { createClient } from '@/lib/supabaseServer'
import { redirect } from 'next/navigation'

export default async function ProfilePage() {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/')
  }

  // ユーザーの投稿数を取得
  const { count: postCount } = await supabase
    .from('progress_updates')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  // ユーザーの参加プロジェクト数を取得
  const { count: projectCount } = await supabase
    .from('intents')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  // ユーザーのコメント数を取得
  const { count: commentCount } = await supabase
    .from('comments')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              プロフィール
            </h1>
            <button className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-md">
              プロフィール編集
            </button>
          </div>
          
          <div className="flex items-center space-x-6 mb-8">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center shadow-lg">
              <span className="text-4xl font-bold text-blue-600">
                {user.email?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">{user.email}</h2>
              <p className="text-gray-600 mb-4">
                メンバー登録日: {new Date(user.created_at).toLocaleDateString('ja-JP')}
              </p>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">{postCount || 0}</div>
                  <div className="text-sm text-gray-600">投稿数</div>
                </div>
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">{projectCount || 0}</div>
                  <div className="text-sm text-gray-600">参加プロジェクト</div>
                </div>
                <div className="bg-purple-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-purple-600">{commentCount || 0}</div>
                  <div className="text-sm text-gray-600">コメント数</div>
                </div>
              </div>
            </div>
          </div>

          {/* 統計カード */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">📊 アクティビティ統計</h3>
              <p className="text-blue-700">
                あなたのVisionMatesでの活動を追跡しています。継続的な参加でより多くの統計が表示されます。
              </p>
            </div>
            <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-purple-900 mb-2">🎯 次の目標</h3>
              <p className="text-purple-700">
                プロジェクトに参加して、コメントや進捗を投稿してみましょう。コミュニティの成長に貢献できます。
              </p>
            </div>
          </div>

          {/* 最近の活動 */}
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">最近の活動</h3>
            <div className="bg-gray-50 rounded-lg p-6">
              <p className="text-gray-600 text-center">
                まだ活動がありません。プロジェクトに参加して活動を開始しましょう！
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 