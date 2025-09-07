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
  const [filteredProjects, setFilteredProjects] = useState<ProjectWithCounts[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'newest' | 'popular'>('newest')
  const supabase = createClient()

  const fetchProjects = async () => {
    try {
      setLoading(true)
      setError('')

      // まずローカルストレージからプロジェクトを取得
      const localProjects = localStorage.getItem('visionmates_projects')
      let localProjectsData: ProjectWithCounts[] = []
      
      if (localProjects) {
        try {
          localProjectsData = JSON.parse(localProjects)
        } catch (e) {
          console.log('Failed to parse local projects:', e)
        }
      }

      // まずRPCを試す
      let { data, error: rpcError } = await supabase
        .rpc('get_project_with_counts')

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

        if (projectsError) {
          console.log('Direct table query also failed:', projectsError)
          // データベースが存在しない場合はサンプルデータとローカルプロジェクトを結合
          const defaultProjects = [
            {
              id: '1',
              title: 'VisionMates開発',
              purpose: 'ビジョンでつながる仲間募集プラットフォームの開発',
              tags: ['Next.js', 'Supabase', 'TypeScript'],
              created_at: new Date().toISOString(),
              watch_count: 5,
              raise_count: 3,
              commit_count: 2,
              comment_count: 8,
              update_count: 4,
            },
            {
              id: '2',
              title: 'サステナブルな街づくり',
              purpose: '環境に配慮した都市計画の提案と実装',
              tags: ['環境', '都市計画', 'サステナビリティ'],
              created_at: new Date().toISOString(),
              watch_count: 12,
              raise_count: 7,
              commit_count: 4,
              comment_count: 15,
              update_count: 6,
            },
            {
              id: '3',
              title: '地域活性化プロジェクト',
              purpose: '地方創生のための新しいビジネスモデルの構築',
              tags: ['地域活性化', 'ビジネス', '地方創生'],
              created_at: new Date().toISOString(),
              watch_count: 8,
              raise_count: 5,
              commit_count: 3,
              comment_count: 12,
              update_count: 5,
            },
            {
              id: '4',
              title: 'AIチャットボット開発',
              purpose: 'カスタマーサポートを自動化するAIチャットボットの開発',
              tags: ['AI', '機械学習', 'Python'],
              created_at: new Date().toISOString(),
              watch_count: 3,
              raise_count: 1,
              commit_count: 0,
              comment_count: 2,
              update_count: 1,
            },
            {
              id: '5',
              title: 'エコフレンドリーなアプリ',
              purpose: '環境に優しい生活をサポートするモバイルアプリの開発',
              tags: ['React Native', '環境', 'モバイル'],
              created_at: new Date().toISOString(),
              watch_count: 7,
              raise_count: 4,
              commit_count: 2,
              comment_count: 5,
              update_count: 3,
            },
            {
              id: '6',
              title: 'オンライン学習プラットフォーム',
              purpose: '誰でもアクセスできる無料のオンライン学習プラットフォーム',
              tags: ['教育', 'Web開発', 'アクセシビリティ'],
              created_at: new Date().toISOString(),
              watch_count: 15,
              raise_count: 8,
              commit_count: 5,
              comment_count: 12,
              update_count: 7,
            }
          ]
          
          // デフォルトプロジェクトとローカルプロジェクトを結合
          data = [...defaultProjects, ...localProjectsData]
        } else {
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
          })) || []
          
          // データベースプロジェクトとローカルプロジェクトを結合
          data = [...data, ...localProjectsData]
        }
      } else {
        // RPCが成功した場合もローカルプロジェクトを追加
        data = [...(data || []), ...localProjectsData]
      }

      setProjects(data || [])
      setFilteredProjects(data || [])
    } catch (err) {
      console.error('Error fetching projects:', err)
      // エラーが発生した場合もサンプルデータとローカルプロジェクトを表示
      const defaultProjects = [
        {
          id: '1',
          title: 'VisionMates開発',
          purpose: 'ビジョンでつながる仲間募集プラットフォームの開発',
          tags: ['Next.js', 'Supabase', 'TypeScript'],
          created_at: new Date().toISOString(),
          watch_count: 5,
          raise_count: 3,
          commit_count: 2,
          comment_count: 8,
          update_count: 4,
        },
        {
          id: '2',
          title: 'サステナブルな街づくり',
          purpose: '環境に配慮した都市計画の提案と実装',
          tags: ['環境', '都市計画', 'サステナビリティ'],
          created_at: new Date().toISOString(),
          watch_count: 12,
          raise_count: 7,
          commit_count: 4,
          comment_count: 15,
          update_count: 6,
        },
        {
          id: '3',
          title: '地域活性化プロジェクト',
          purpose: '地方創生のための新しいビジネスモデルの構築',
          tags: ['地域活性化', 'ビジネス', '地方創生'],
          created_at: new Date().toISOString(),
          watch_count: 8,
          raise_count: 5,
          commit_count: 3,
          comment_count: 12,
          update_count: 5,
        },
        {
          id: '4',
          title: 'AIチャットボット開発',
          purpose: 'カスタマーサポートを自動化するAIチャットボットの開発',
          tags: ['AI', '機械学習', 'Python'],
          created_at: new Date().toISOString(),
          watch_count: 3,
          raise_count: 1,
          commit_count: 0,
          comment_count: 2,
          update_count: 1,
        },
        {
          id: '5',
          title: 'エコフレンドリーなアプリ',
          purpose: '環境に優しい生活をサポートするモバイルアプリの開発',
          tags: ['React Native', '環境', 'モバイル'],
          created_at: new Date().toISOString(),
          watch_count: 7,
          raise_count: 4,
          commit_count: 2,
          comment_count: 5,
          update_count: 3,
        },
        {
          id: '6',
          title: 'オンライン学習プラットフォーム',
          purpose: '誰でもアクセスできる無料のオンライン学習プラットフォーム',
          tags: ['教育', 'Web開発', 'アクセシビリティ'],
          created_at: new Date().toISOString(),
          watch_count: 15,
          raise_count: 8,
          commit_count: 5,
          comment_count: 12,
          update_count: 7,
        }
      ];
      
      // ローカルストレージからプロジェクトを取得
      const localProjects = localStorage.getItem('visionmates_projects')
      let localProjectsData: ProjectWithCounts[] = []
      
      if (localProjects) {
        try {
          localProjectsData = JSON.parse(localProjects)
        } catch (e) {
          console.log('Failed to parse local projects:', e)
        }
      }
      
      // デフォルトプロジェクトとローカルプロジェクトを結合
      setProjects([...defaultProjects, ...localProjectsData])
      setFilteredProjects([...defaultProjects, ...localProjectsData])
    } finally {
      setLoading(false)
    }
  }

  // 検索とソートのロジック
  useEffect(() => {
    let filtered = [...projects]

    // 検索フィルタリング
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(project => 
        project.title.toLowerCase().includes(query) ||
        project.purpose.toLowerCase().includes(query) ||
        project.tags.some(tag => tag.toLowerCase().includes(query))
      )
    }

    // ソート
    if (sortBy === 'newest') {
      filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    } else if (sortBy === 'popular') {
      filtered.sort((a, b) => {
        const aPopularity = a.watch_count + a.raise_count + a.commit_count + a.comment_count + a.update_count
        const bPopularity = b.watch_count + b.raise_count + b.commit_count + b.comment_count + b.update_count
        return bPopularity - aPopularity
      })
    }

    setFilteredProjects(filtered)
  }, [projects, searchQuery, sortBy])

  useEffect(() => {
    fetchProjects()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-retro-darkGray">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="retro-card max-w-md mx-auto">
              <div className="text-retro-orange text-6xl mb-4 retro-blink">⚡</div>
              <p className="font-pixel text-retro-lightGray text-sm">LOADING...</p>
              <div className="mt-4 bg-black border-2 border-retro-lightGray h-4 rounded">
                <div className="bg-retro-green h-full rounded animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-retro-darkGray">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="retro-card max-w-md mx-auto">
              <div className="text-retro-red text-6xl mb-4">💀</div>
              <p className="font-pixel text-retro-red text-sm mb-4">ERROR!</p>
              <p className="font-pixel text-retro-lightGray text-xs">{error}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-retro-darkGray">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* レトロゲーム風ヒーローセクション */}
        <div className="text-center mb-16">
          <div className="retro-card mb-8 bg-black">
            <h1 className="text-6xl font-pixel text-retro-yellow mb-6 retro-glow">
              VISION<span className="text-retro-cyan">MATES</span>
            </h1>
            <div className="retro-gradient h-2 w-full mb-6"></div>
            <p className="text-sm font-pixel text-retro-lightGray max-w-2xl mx-auto leading-relaxed mb-6">
              仲間と共にプロジェクトを攻略せよ！<br />
              あなたのビジョンをクエストに変えて、<br />
              最高のパーティーメンバーを見つけよう！
            </p>
            
            {/* ゲーム風統計表示 */}
            <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
              <div className="retro-card bg-retro-darkGray">
                <div className="text-retro-green text-2xl mb-2">🚀</div>
                <div className="font-pixel text-xs text-retro-lightGray">PROJECTS</div>
                <div className="font-pixel text-lg text-retro-yellow">{projects.length}</div>
              </div>
              <div className="retro-card bg-retro-darkGray">
                <div className="text-retro-purple text-2xl mb-2">👥</div>
                <div className="font-pixel text-xs text-retro-lightGray">ACTIVE</div>
                <div className="font-pixel text-lg text-retro-cyan retro-blink">ONLINE</div>
              </div>
            </div>
          </div>

          {/* レトロ風ナビゲーションボタン */}
          <div className="flex justify-center space-x-4 mb-8">
            <button className="retro-button retro-button-primary">
              🎮 PLAY
            </button>
            <button className="retro-button retro-button-secondary">
              📊 STATS
            </button>
            <button className="retro-button">
              ⚙️ OPTIONS
            </button>
          </div>
        </div>

        {/* プロジェクト一覧（ゲーム風）*/}
        <div className="mb-8">
        <h2 className="font-pixel text-retro-orange text-xl mb-6 text-center">
          &gt;&gt; ACTIVE QUESTS &lt;&lt;
        </h2>
        
        {/* 検索とソート機能 */}
        <div className="retro-card bg-black border-2 border-retro-cyan p-4 mb-8">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            {/* 検索ボックス */}
            <div className="flex-1 w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="プロジェクトを検索..."
                className="w-full px-3 py-2 border-2 border-retro-lightGray bg-black text-retro-lightGray font-pixel text-sm focus:border-retro-cyan focus:outline-none"
              />
            </div>
            
            {/* ソートボタン */}
            <div className="flex gap-2">
              <button
                onClick={() => setSortBy('newest')}
                className={`retro-button text-xs px-3 py-2 ${sortBy === 'newest' ? 'retro-button-primary' : ''}`}
              >
                NEWEST
              </button>
              <button
                onClick={() => setSortBy('popular')}
                className={`retro-button text-xs px-3 py-2 ${sortBy === 'popular' ? 'retro-button-primary' : ''}`}
              >
                POPULAR
              </button>
            </div>
          </div>
          
          {/* 検索結果の表示 */}
          {searchQuery.trim() && (
            <div className="mt-3 text-center">
              <span className="font-pixel text-xs text-retro-lightGray">
                {filteredProjects.length} 件のプロジェクトが見つかりました
              </span>
            </div>
          )}
        </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredProjects.map((project) => (
              <ProjectCard
                key={project.id}
                p={project}
                onChanged={fetchProjects}
              />
            ))}
          </div>
        </div>

        {projects.length === 0 && (
          <div className="text-center py-16">
            <div className="retro-card max-w-md mx-auto">
              <div className="text-6xl mb-4 retro-blink">🌟</div>
              <h3 className="font-pixel text-lg text-retro-yellow mb-4">NO QUESTS FOUND</h3>
              <p className="font-pixel text-xs text-retro-lightGray mb-6">
                最初のクエストを作成して<br />
                冒険を始めよう！
              </p>
              <button className="retro-button retro-button-primary">
                + CREATE QUEST
              </button>
            </div>
          </div>
        )}

        {/* レトロ風フッター */}
        <div className="mt-16 text-center">
          <div className="retro-card bg-black">
            <p className="font-pixel text-xs text-retro-lightGray">
              PRESS <span className="text-retro-yellow">START</span> TO CONTINUE...
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
