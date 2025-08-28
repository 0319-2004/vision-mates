import { ImageResponse } from 'next/og'
import { createClient } from '@/lib/supabaseServer'

export const size = {
  width: 1200,
  height: 630,
}

export const contentType = 'image/png'

export default async function Image({ params }: { params: { id: string } }) {
  const supabase = createClient()
  
  // プロジェクト情報を取得
  const { data: project } = await supabase
    .from('projects')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!project) {
    return new ImageResponse(
      (
        <div
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontFamily: 'system-ui',
          }}
        >
          <h1 style={{ fontSize: 48, marginBottom: 16 }}>VisionMates</h1>
          <p style={{ fontSize: 24 }}>プロジェクトが見つかりません</p>
        </div>
      ),
      size
    )
  }

  // 参加意向数を取得
  const { data: intents } = await supabase
    .from('intents')
    .select('level')
    .eq('project_id', params.id)

  const watchCount = intents?.filter(i => i.level === 'watch').length || 0
  const raiseCount = intents?.filter(i => i.level === 'raise').length || 0
  const commitCount = intents?.filter(i => i.level === 'commit').length || 0

  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          padding: 60,
          color: 'white',
          fontFamily: 'system-ui',
        }}
      >
        {/* ヘッダー */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 40 }}>
          <div
            style={{
              width: 60,
              height: 60,
              borderRadius: 30,
              background: 'rgba(255, 255, 255, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 24,
              marginRight: 20,
            }}
          >
            👥
          </div>
          <h1 style={{ fontSize: 36, fontWeight: 'bold' }}>VisionMates</h1>
        </div>

        {/* プロジェクトタイトル */}
        <h2
          style={{
            fontSize: 48,
            fontWeight: 'bold',
            marginBottom: 20,
            lineHeight: 1.2,
          }}
        >
          {project.title}
        </h2>

        {/* プロジェクトの目的 */}
        <p
          style={{
            fontSize: 24,
            marginBottom: 40,
            opacity: 0.9,
            lineHeight: 1.4,
          }}
        >
          {project.purpose.length > 100
            ? `${project.purpose.substring(0, 100)}...`
            : project.purpose}
        </p>

        {/* 参加意向統計 */}
        <div style={{ display: 'flex', gap: 40, marginBottom: 40 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 32, fontWeight: 'bold' }}>👀</div>
            <div style={{ fontSize: 20, fontWeight: 'bold' }}>{watchCount}</div>
            <div style={{ fontSize: 14, opacity: 0.8 }}>見守る</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 32, fontWeight: 'bold' }}>✋</div>
            <div style={{ fontSize: 20, fontWeight: 'bold' }}>{raiseCount}</div>
            <div style={{ fontSize: 14, opacity: 0.8 }}>手を挙げる</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 32, fontWeight: 'bold' }}>🚀</div>
            <div style={{ fontSize: 20, fontWeight: 'bold' }}>{commitCount}</div>
            <div style={{ fontSize: 14, opacity: 0.8 }}>コミット</div>
          </div>
        </div>

        {/* タグ */}
        {project.tags.length > 0 && (
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {project.tags.slice(0, 5).map((tag: string, index: number) => (
              <div
                key={index}
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  padding: '8px 16px',
                  borderRadius: 20,
                  fontSize: 14,
                  fontWeight: '500',
                }}
              >
                #{tag}
              </div>
            ))}
          </div>
        )}

        {/* フッター */}
        <div
          style={{
            position: 'absolute',
            bottom: 40,
            right: 60,
            fontSize: 18,
            opacity: 0.8,
          }}
        >
          vision-mates.com
        </div>
      </div>
    ),
    size
  )
} 