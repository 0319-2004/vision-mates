import { createClient } from '@/lib/supabaseServer'
import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import ProjectDetail from '@/components/ProjectDetail'

export const revalidate = 300

interface PageProps {
  params: {
    id: string
  }
}

// デモプロジェクトのデータを取得する関数
function getDemoProject(id: string) {
  const demoProjects = {
    '1': {
      id: '1',
      title: 'VisionMates開発',
      purpose: 'ビジョンでつながる仲間募集プラットフォームの開発',
      tags: ['Next.js', 'Supabase', 'TypeScript'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      watch_count: 5,
      raise_count: 3,
      commit_count: 2,
      comment_count: 8,
      update_count: 4,
    },
    '2': {
      id: '2',
      title: 'サステナブルな街づくり',
      purpose: '環境に配慮した都市計画の提案と実装',
      tags: ['環境', '都市計画', 'サステナビリティ'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      watch_count: 12,
      raise_count: 7,
      commit_count: 4,
      comment_count: 15,
      update_count: 6,
    },
    '3': {
      id: '3',
      title: '地域活性化プロジェクト',
      purpose: '地方創生のための新しいビジネスモデルの構築',
      tags: ['地域活性化', 'ビジネス', '地方創生'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      watch_count: 8,
      raise_count: 5,
      commit_count: 3,
      comment_count: 12,
      update_count: 5,
    },
    '4': {
      id: '4',
      title: 'AIチャットボット開発',
      purpose: 'カスタマーサポートを自動化するAIチャットボットの開発',
      tags: ['AI', '機械学習', 'Python'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      watch_count: 3,
      raise_count: 1,
      commit_count: 0,
      comment_count: 2,
      update_count: 1,
    },
    '5': {
      id: '5',
      title: 'エコフレンドリーなアプリ',
      purpose: '環境に優しい生活をサポートするモバイルアプリの開発',
      tags: ['React Native', '環境', 'モバイル'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      watch_count: 7,
      raise_count: 4,
      commit_count: 2,
      comment_count: 5,
      update_count: 3,
    },
    '6': {
      id: '6',
      title: 'オンライン学習プラットフォーム',
      purpose: '誰でもアクセスできる無料のオンライン学習プラットフォーム',
      tags: ['教育', 'Web開発', 'アクセシビリティ'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      watch_count: 15,
      raise_count: 8,
      commit_count: 5,
      comment_count: 12,
      update_count: 7,
    }
  }

  return demoProjects[id as keyof typeof demoProjects] || demoProjects['1']
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const supabase = createClient()
  
  const { data: project } = await supabase
    .from('projects')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!project) {
    return {
      title: 'プロジェクトが見つかりません - VisionMates',
    }
  }

  return {
    title: `${project.title} - VisionMates`,
    description: project.purpose,
    openGraph: {
      title: project.title,
      description: project.purpose,
      type: 'website',
      url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/projects/${params.id}`,
      images: [
        {
          url: `/projects/${params.id}/opengraph-image`,
          width: 1200,
          height: 630,
          alt: project.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: project.title,
      description: project.purpose,
      images: [`/projects/${params.id}/opengraph-image`],
    },
  }
}

export default async function ProjectPage({ params }: PageProps) {
  const supabase = createClient()
  
  // デモプロジェクトの場合はサンプルデータを返す
  if (params.id.startsWith('demo-') || ['1', '2', '3', '4', '5', '6'].includes(params.id)) {
    // ローカルストレージからプロジェクトを検索
    if (typeof window !== 'undefined' && params.id.startsWith('demo-')) {
      const localProjects = localStorage.getItem('visionmates_projects')
      if (localProjects) {
        try {
          const projects = JSON.parse(localProjects)
          const localProject = projects.find((p: any) => p.id === params.id)
          if (localProject) {
            return (
              <ProjectDetail
                project={localProject}
                comments={[]}
                progressUpdates={[]}
                intents={[]}
              />
            )
          }
        } catch (e) {
          console.log('Failed to parse local projects:', e)
        }
      }
    }
    
    const demoProject = getDemoProject(params.id)

    return (
      <ProjectDetail
        project={demoProject}
        comments={[]}
        progressUpdates={[]}
        intents={[]}
      />
    )
  }

  // プロジェクト詳細を取得（RPCを試す）
  let { data: project, error: projectError } = await supabase
    .rpc('get_project_with_counts', { pid: params.id })

  // RPCが失敗した場合はテーブル直読みでフォールバック
  if (projectError) {
    console.log('RPC failed, falling back to direct table query:', projectError)
    
    const { data: projectData, error: directError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', params.id)
      .single()

    if (directError || !projectData) {
      // データベースにプロジェクトが存在しない場合はデモプロジェクトを表示
      const demoProject = getDemoProject(params.id)

      return (
        <ProjectDetail
          project={demoProject}
          comments={[]}
          progressUpdates={[]}
          intents={[]}
        />
      )
    }

    // カウントを取得
    const [commentsCount, updatesCount, intentsData] = await Promise.all([
      supabase.from('comments').select('*', { count: 'exact', head: true }).eq('project_id', params.id),
      supabase.from('progress_updates').select('*', { count: 'exact', head: true }).eq('project_id', params.id),
      supabase.from('intents').select('*').eq('project_id', params.id)
    ])

    project = {
      ...projectData,
      watch_count: intentsData.data?.filter(i => i.level === 'watch').length || 0,
      raise_count: intentsData.data?.filter(i => i.level === 'raise').length || 0,
      commit_count: intentsData.data?.filter(i => i.level === 'commit').length || 0,
      comment_count: commentsCount.count || 0,
      update_count: updatesCount.count || 0,
    }
  }

  if (!project) {
    // プロジェクトが見つからない場合はデモプロジェクトを表示
    const demoProject = getDemoProject(params.id)

    return (
      <ProjectDetail
        project={demoProject}
        comments={[]}
        progressUpdates={[]}
        intents={[]}
      />
    )
  }

  // コメントを取得
  const { data: comments } = await supabase
    .from('comments')
    .select(`
      *,
      user:users(email)
    `)
    .eq('project_id', params.id)
    .order('created_at', { ascending: false })

  // 進捗更新を取得
  const { data: progressUpdates } = await supabase
    .from('progress_updates')
    .select(`
      *,
      user:users(email)
    `)
    .eq('project_id', params.id)
    .order('created_at', { ascending: false })

  // 参加意向を取得
  const { data: intents } = await supabase
    .from('intents')
    .select('*')
    .eq('project_id', params.id)

  return (
    <ProjectDetail
      project={project}
      comments={comments || []}
      progressUpdates={progressUpdates || []}
      intents={intents || []}
    />
  )
} 