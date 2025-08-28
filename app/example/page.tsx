import ParticipationThermometer from '@/components/ParticipationThermometer'

export default function ExamplePage() {
  return (
    <div className="space-y-8">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          認証機能の使用例
        </h1>
        
        <div className="prose prose-sm text-gray-600 mb-6">
          <p>
            このページでは、Next.js 14 + Supabaseで実装したCookieベースのセッション管理の使用例を示しています。
          </p>
          <ul>
            <li>未ログイン: 閲覧可能、投稿不可</li>
            <li>ログイン: 投稿可能（コメント/進捗/参加温度）</li>
            <li>再訪問時にセッションが維持される</li>
          </ul>
        </div>
      </div>

      {/* 参加温度投票例 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          参加温度投票
        </h2>
        <ParticipationThermometer projectId="example-project-1" />
      </div>

      <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
        <h3 className="text-lg font-medium text-blue-900 mb-3">
          実装のポイント
        </h3>
        <ul className="space-y-2 text-sm text-blue-800">
          <li>• <code>@supabase/ssr</code>を使用したCookieベースのセッション管理</li>
          <li>• <code>middleware.ts</code>でセッションの自動リフレッシュ</li>
          <li>• <code>AuthGuard</code>コンポーネントで保護されたコンテンツの管理</li>
          <li>• <code>react-hot-toast</code>によるUX向上</li>
          <li>• Google OAuthによる簡単なログイン</li>
        </ul>
      </div>
    </div>
  )
} 