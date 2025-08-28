import { createClient } from '@/lib/supabaseServer'
import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import ProjectDetail from '@/components/ProjectDetail'

interface PageProps {
  params: {
    id: string
  }
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
      notFound()
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
    notFound()
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