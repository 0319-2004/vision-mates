'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabaseBrowser'
import ProjectCard from '@/components/ProjectCard'

interface ProjectWithCounts {
  id: string
  title: string
  purpose: string
  tags: string[]
  created_at: string
  watch_count: number
  raise_count: number
  commit_count: number
  comment_count: number
  update_count: number
}

export default function HomePage() {
  const [projects, setProjects] = useState<ProjectWithCounts[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const supabase = createClient()

  const fetchProjects = async () => {
    try {
      setLoading(true)
      setError('')

      // まずRPCを試す
      let { data, error: rpcError } = await supabase
        .rpc('get_projects_with_counts')

      // RPCが失敗した場合はテーブル直読みでフォールバック
      if (rpcError) {
        console.log('RPC failed, falling back to direct table query:', rpcError)
        
        const { data: projectsData, error: projectsError } = await supabase
          .from('projects')
          .select(`
            *,
            comments:comments(count),
            progress:progress_updates(count),
            intents:intents(count)
          `)

        if (projectsError) throw projectsError

        // データを変換
        data = projectsData?.map((project: any) => ({
          id: project.id,
          title: project.title,
          purpose: project.purpose,
          tags: project.tags || [],
          created_at: project.created_at,
          watch_count: project.intents?.filter((i: any) => i.level === 'watch').length || 0,
          raise_count: project.intents?.filter((i: any) => i.level === 'raise').length || 0,
          commit_count: project.intents?.filter((i: any) => i.level === 'commit').length || 0,
          comment_count: project.comments?.[0]?.count || 0,
          update_count: project.progress?.[0]?.count || 0,
        }))
      }

      setProjects(data || [])
    } catch (err) {
      console.error('Error fetching projects:', err)
      setError('プロジェクトの取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProjects()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">プロジェクトを読み込み中...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
              <p className="text-red-600">{error}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* ヒーローセクション */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            VisionMates
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            志を同じくする仲間と出会い、一緒にプロジェクトを実現しましょう。
            あなたのビジョンを共有し、共に成長するコミュニティです。
          </p>
          <div className="mt-8 flex justify-center space-x-4">
            <div className="bg-white rounded-full px-6 py-2 shadow-sm border border-gray-200">
              <span className="text-sm text-gray-600">🚀 プロジェクト数: {projects.length}</span>
            </div>
            <div className="bg-white rounded-full px-6 py-2 shadow-sm border border-gray-200">
              <span className="text-sm text-gray-600">👥 アクティブなコミュニティ</span>
            </div>
          </div>
        </div>

        {/* プロジェクト一覧 */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              p={project}
              onChanged={fetchProjects}
            />
          ))}
        </div>

        {projects.length === 0 && (
          <div className="text-center py-16">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 max-w-md mx-auto">
              <div className="text-6xl mb-4">🌟</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">まだプロジェクトがありません</h3>
              <p className="text-gray-600">最初のプロジェクトを作成して、コミュニティを始めましょう！</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 