import Image from 'next/image'
import { createClient } from '@/lib/supabaseServer'
import { redirect } from 'next/navigation'
import ProfileEditForm from '@/components/ProfileEditForm'

export default async function ProfilePage() {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return (
      <div className="min-h-screen bg-retro-darkGray flex items-center justify-center">
        <div className="retro-card bg-black border-2 border-retro-red p-8 text-center">
          <h1 className="retro-title text-2xl text-retro-red mb-4">デモプロフィール</h1>
          <p className="retro-text-readable mb-6">ログインしていないため、デモプロフィールを表示しています。</p>
          <div className="retro-card bg-retro-darkGray border-2 border-retro-cyan p-6 mb-6">
            <div className="flex justify-between items-center mb-8">
              <h1 className="retro-title text-3xl text-retro-cyan">デモユーザー</h1>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="retro-card bg-retro-darkGray border-2 border-retro-green p-4 text-center">
                <div className="retro-text-readable text-2xl font-pixel mb-2">5</div>
                <div className="retro-text-readable-dark text-sm">投稿数</div>
              </div>
              <div className="retro-card bg-retro-darkGray border-2 border-retro-orange p-4 text-center">
                <div className="retro-text-readable text-2xl font-pixel mb-2">3</div>
                <div className="retro-text-readable-dark text-sm">参加プロジェクト</div>
              </div>
              <div className="retro-card bg-retro-darkGray border-2 border-retro-purple p-4 text-center">
                <div className="retro-text-readable text-2xl font-pixel mb-2">12</div>
                <div className="retro-text-readable-dark text-sm">コメント数</div>
              </div>
            </div>
            <div className="retro-card bg-retro-darkGray border-2 border-retro-red p-6 mb-8">
              <h3 className="retro-text-readable text-lg font-pixel mb-2">🔥 連続進捗日数</h3>
              <div className="flex items-center space-x-4">
                <div className="retro-text-readable text-3xl font-pixel">7日</div>
                <div className="retro-text-readable-dark text-sm">毎日の進捗投稿でストリークを維持しよう！</div>
              </div>
            </div>
            <div className="retro-card bg-retro-darkGray border-2 border-retro-purple p-6 mb-8">
              <h3 className="retro-text-readable text-lg font-pixel mb-4">🛠️ スキル</h3>
              <div className="flex flex-wrap gap-2">
                <span className="retro-button retro-button-secondary text-xs px-3 py-1">React</span>
                <span className="retro-button retro-button-secondary text-xs px-3 py-1">TypeScript</span>
                <span className="retro-button retro-button-secondary text-xs px-3 py-1">Next.js</span>
                <span className="retro-button retro-button-secondary text-xs px-3 py-1">Supabase</span>
              </div>
            </div>
            <div className="retro-card bg-retro-darkGray border-2 border-retro-yellow p-6 mb-8">
              <h3 className="retro-text-readable text-lg font-pixel mb-4">🏆 獲得バッジ</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="retro-card bg-black border-2 border-retro-yellow p-3 text-center">
                  <div className="retro-text-readable text-sm font-pixel">初投稿</div>
                  <div className="retro-text-readable-dark text-xs">2024/01/15</div>
                </div>
                <div className="retro-card bg-black border-2 border-retro-yellow p-3 text-center">
                  <div className="retro-text-readable text-sm font-pixel">初コメント</div>
                  <div className="retro-text-readable-dark text-xs">2024/01/16</div>
                </div>
                <div className="retro-card bg-black border-2 border-retro-yellow p-3 text-center">
                  <div className="retro-text-readable text-sm font-pixel">初シェア</div>
                  <div className="retro-text-readable-dark text-xs">2024/01/17</div>
                </div>
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

  // プロフィール情報を取得
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // ユーザーの投稿数を取得（エラーハンドリング付き）
  let postCount = 0
  try {
    const { count } = await supabase
      .from('progress_updates')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
    postCount = count || 0
  } catch (error) {
    console.log('Error fetching post count:', error)
  }

  // ユーザーの参加プロジェクト数を取得（エラーハンドリング付き）
  let projectCount = 0
  try {
    const { count } = await supabase
      .from('intents')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
    projectCount = count || 0
  } catch (error) {
    console.log('Error fetching project count:', error)
  }

  // ユーザーのコメント数を取得（エラーハンドリング付き）
  let commentCount = 0
  try {
    const { count } = await supabase
      .from('comments')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
    commentCount = count || 0
  } catch (error) {
    console.log('Error fetching comment count:', error)
  }

  // ストリーク日数を取得（エラーハンドリング付き）
  let streakData = 0
  try {
    const { data } = await supabase
      .rpc('get_streak_days', { p_user: user.id })
    streakData = data || 0
  } catch (error) {
    console.log('Error fetching streak data:', error)
  }

  // ユーザーのバッジを取得（エラーハンドリング付き）
  let badges: any[] = []
  try {
    const { data } = await supabase
      .from('user_badges')
      .select(`
        badge_code,
        earned_at,
        badges!inner(code, label)
      `)
      .eq('user_id', user.id)
      .order('earned_at', { ascending: false })
    badges = data || []
  } catch (error) {
    console.log('Error fetching badges:', error)
  }

  return (
    <div className="min-h-screen bg-retro-darkGray">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="retro-card bg-black border-2 border-retro-cyan p-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="retro-title text-3xl text-retro-cyan">
              プロフィール
            </h1>
            <ProfileEditForm initialProfile={profile} />
          </div>
          
          <div className="flex items-center space-x-6 mb-8">
            <div className="w-24 h-24 retro-card bg-retro-darkGray border-2 border-retro-orange flex items-center justify-center">
              {profile?.avatar_url ? (
                <Image 
                  src={profile.avatar_url} 
                  alt="Avatar" 
                  width={80}
                  height={80}
                  sizes="80px"
                  className="w-20 h-20 rounded-full object-cover"
                />
              ) : (
                <span className="retro-text-readable text-4xl font-pixel">
                  {profile?.display_name?.charAt(0)?.toUpperCase() || user.email?.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div className="flex-1">
              <h2 className="retro-text-readable text-2xl font-pixel mb-2">
                {profile?.display_name || user.email}
              </h2>
              {profile?.bio && (
                <p className="retro-text-readable-dark mb-2">{profile.bio}</p>
              )}
              {profile?.location && (
                <p className="retro-text-readable-dark text-sm mb-2">📍 {profile.location}</p>
              )}
              {profile?.role && (
                <p className="retro-text-readable-dark text-sm mb-4">🎯 {profile.role}</p>
              )}
              <div className="grid grid-cols-3 gap-4">
                <div className="retro-card bg-retro-darkGray border-2 border-retro-blue p-4 text-center">
                  <div className="retro-text-readable text-2xl font-pixel">{postCount || 0}</div>
                  <div className="retro-text-readable-dark text-xs">投稿数</div>
                </div>
                <div className="retro-card bg-retro-darkGray border-2 border-retro-green p-4 text-center">
                  <div className="retro-text-readable text-2xl font-pixel">{projectCount || 0}</div>
                  <div className="retro-text-readable-dark text-xs">参加プロジェクト</div>
                </div>
                <div className="retro-card bg-retro-darkGray border-2 border-retro-orange p-4 text-center">
                  <div className="retro-text-readable text-2xl font-pixel">{commentCount || 0}</div>
                  <div className="retro-text-readable-dark text-xs">コメント数</div>
                </div>
              </div>
            </div>
          </div>

          {/* ストリーク表示 */}
          <div className="retro-card bg-retro-darkGray border-2 border-retro-red p-6 mb-8">
            <h3 className="retro-text-readable text-lg font-pixel mb-2">🔥 連続進捗日数</h3>
            <div className="flex items-center space-x-4">
              <div className="retro-text-readable text-3xl font-pixel">
                {streakData || 0}日
              </div>
              <div className="retro-text-readable-dark text-sm">
                毎日の進捗投稿でストリークを維持しよう！
              </div>
            </div>
          </div>

          {/* スキル表示 */}
          {profile?.skills && profile.skills.length > 0 && (
            <div className="retro-card bg-retro-darkGray border-2 border-retro-purple p-6 mb-8">
              <h3 className="retro-text-readable text-lg font-pixel mb-4">🛠️ スキル</h3>
              <div className="flex flex-wrap gap-2">
                {profile.skills.map((skill: string, index: number) => (
                  <span 
                    key={index}
                    className="retro-button retro-button-secondary text-xs px-3 py-1"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* バッジ表示 */}
          {badges && badges.length > 0 && (
            <div className="retro-card bg-retro-darkGray border-2 border-retro-yellow p-6 mb-8">
              <h3 className="retro-text-readable text-lg font-pixel mb-4">🏆 獲得バッジ</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {badges.map((badge) => (
                  <div key={badge.badge_code} className="retro-card bg-black border-2 border-retro-yellow p-3 text-center">
                    <div className="retro-text-readable text-sm font-pixel">
                      {(badge.badges as any)?.label || 'バッジ'}
                    </div>
                    <div className="retro-text-readable-dark text-xs">
                      {new Date(badge.earned_at).toLocaleDateString('ja-JP')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* リンク表示 */}
          {profile?.links && (
            <div className="retro-card bg-retro-darkGray border-2 border-retro-cyan p-6 mb-8">
              <h3 className="retro-text-readable text-lg font-pixel mb-4">🔗 リンク</h3>
              <div className="space-y-2">
                {profile.links.github && (
                  <a 
                    href={profile.links.github} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="retro-text-readable-dark hover:text-retro-cyan transition-colors block"
                  >
                    GitHub: {profile.links.github}
                  </a>
                )}
                {profile.links.portfolio && (
                  <a 
                    href={profile.links.portfolio} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="retro-text-readable-dark hover:text-retro-cyan transition-colors block"
                  >
                    Portfolio: {profile.links.portfolio}
                  </a>
                )}
                {profile.links.linkedin && (
                  <a 
                    href={profile.links.linkedin} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="retro-text-readable-dark hover:text-retro-cyan transition-colors block"
                  >
                    LinkedIn: {profile.links.linkedin}
                  </a>
                )}
              </div>
            </div>
          )}

          {/* 最近の活動 */}
          <div>
            <h3 className="retro-text-readable text-xl font-pixel mb-4">最近の活動</h3>
            <div className="retro-card bg-retro-darkGray border-2 border-retro-lightGray p-6">
              <p className="retro-text-readable-dark text-center">
                まだ活動がありません。プロジェクトに参加して活動を開始しましょう！
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 