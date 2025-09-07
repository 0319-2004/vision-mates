import { createClient } from '@/lib/supabaseServer'
import { redirect } from 'next/navigation'
import TimelineInterface from '@/components/TimelineInterface'

export default async function TimelinePage() {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return (
      <div className="min-h-screen bg-retro-darkGray flex items-center justify-center">
        <div className="retro-card bg-black border-2 border-retro-red p-8 text-center">
          <h1 className="retro-title text-2xl text-retro-red mb-4">デモタイムライン</h1>
          <p className="retro-text-readable mb-6">ログインしていないため、デモタイムラインを表示しています。</p>
          <div className="retro-card bg-retro-darkGray border-2 border-retro-cyan p-6 mb-6">
            <h2 className="retro-text-readable text-xl font-pixel mb-4">📅 進捗タイムライン</h2>
            <div className="space-y-4">
              <div className="retro-card bg-black border-2 border-retro-green p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="retro-text-readable text-lg font-pixel">AIチャットボット開発</h3>
                  <span className="retro-text-readable-dark text-xs">2時間前</span>
                </div>
                <p className="retro-text-readable-dark text-sm mb-2">ユーザー認証機能の実装が完了しました！</p>
                <p className="retro-text-readable-dark text-xs">投稿者: デモユーザー</p>
              </div>
              <div className="retro-card bg-black border-2 border-retro-orange p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="retro-text-readable text-lg font-pixel">エコフレンドリーなアプリ</h3>
                  <span className="retro-text-readable-dark text-xs">5時間前</span>
                </div>
                <p className="retro-text-readable-dark text-sm mb-2">UIデザインのワイヤーフレームを作成中です</p>
                <p className="retro-text-readable-dark text-xs">投稿者: デモユーザー</p>
              </div>
              <div className="retro-card bg-black border-2 border-retro-purple p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="retro-text-readable text-lg font-pixel">オンライン学習プラットフォーム</h3>
                  <span className="retro-text-readable-dark text-xs">1日前</span>
                </div>
                <p className="retro-text-readable-dark text-sm mb-2">データベース設計を完了しました</p>
                <p className="retro-text-readable-dark text-xs">投稿者: デモユーザー</p>
              </div>
              <div className="retro-card bg-black border-2 border-retro-yellow p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="retro-text-readable text-lg font-pixel">VisionMates</h3>
                  <span className="retro-text-readable-dark text-xs">2日前</span>
                </div>
                <p className="retro-text-readable-dark text-sm mb-2">プロジェクトの初期設定が完了しました</p>
                <p className="retro-text-readable-dark text-xs">投稿者: デモユーザー</p>
              </div>
            </div>
          </div>
          <a href="/" className="retro-button retro-button-primary">
            ホームに戻る
          </a>
        </div>
      </div>
    )
  }

  // すべての進捗更新を取得（デモ用、エラーハンドリング付き）
  let progressUpdates: any[] = []
  try {
    const { data } = await supabase
      .from('progress_updates')
      .select(`
        *,
        profiles!inner(display_name, avatar_url),
        projects!inner(title, id)
      `)
      .order('created_at', { ascending: false })
      .limit(50)
    progressUpdates = data || []
  } catch (error) {
    console.log('Error fetching progress updates:', error)
  }

  return (
    <div className="min-h-screen bg-retro-darkGray">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="retro-title text-3xl text-retro-cyan mb-8 text-center">タイムライン</h1>
        <TimelineInterface initialUpdates={progressUpdates} />
      </div>
    </div>
  )
}
