import { createClient } from '@/lib/supabaseServer'
import { redirect } from 'next/navigation'
import ReferralStats from '@/components/ReferralStats'

export default async function SettingsPage() {
  const supabase = createClient()
  
  // 認証チェック
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) {
    redirect('/auth')
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">設定</h1>
        <p className="text-gray-600">アカウント設定と統計情報を管理できます</p>
      </div>

      {/* 紹介統計 */}
      <ReferralStats />

      {/* アカウント情報 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">アカウント情報</h2>
        
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            {user.user_metadata?.avatar_url && (
              <img
                src={user.user_metadata.avatar_url}
                alt="プロフィール画像"
                className="w-16 h-16 rounded-full"
              />
            )}
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                {user.user_metadata?.full_name || '名前未設定'}
              </h3>
              <p className="text-gray-600">{user.email}</p>
              <p className="text-sm text-gray-500">
                登録日: {new Date(user.created_at).toLocaleDateString('ja-JP')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 招待・紹介について */}
      <div className="bg-blue-50 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-blue-900 mb-4">招待・紹介について</h2>
        <div className="space-y-3 text-blue-800">
          <p>• プロジェクトを共有して、新しい仲間を招待しましょう！</p>
          <p>• 紹介した人が新規登録すると、あなたの紹介数がカウントされます</p>
          <p>• 紹介数に応じて、ブロンズ・シルバー・ゴールドのバッジが付与されます</p>
          <p>• 1人につき1回のみカウントされ、自己紹介は無効です</p>
        </div>
      </div>
    </div>
  )
} 