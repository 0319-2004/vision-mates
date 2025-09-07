'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabaseBrowser'
import SwipeCard from '@/components/SwipeCard'
import ProjectCard from '@/components/ProjectCard'

export default function DiscoverPage() {
  const [user, setUser] = useState<any>(null)
  const [userSkills, setUserSkills] = useState<string[]>([])
  const [project, setProject] = useState<any>(null)
  const supabase = createClient()
  
  // デモプロジェクトのデータ
  const demoProjects = [
    {
      id: '4',
      title: 'AIチャットボット開発',
      purpose: 'カスタマーサポートを自動化するAIチャットボットの開発',
      tags: ['AI', '機械学習', 'Python'],
      created_at: '2024-01-15T10:00:00Z',
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
      created_at: '2024-01-15T10:00:00Z',
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
      created_at: '2024-01-15T10:00:00Z',
      watch_count: 15,
      raise_count: 8,
      commit_count: 5,
      comment_count: 12,
      update_count: 7,
    }
  ]
  
  // 初期プロジェクトを固定で設定（ハイドレーションエラーを防ぐため）
  const initialProject = demoProjects[0]

  // useEffectでクライアントサイドでのみランダム選択を実行
  useEffect(() => {
    // クライアントサイドでのみランダム選択を実行
    const randomProject = demoProjects[Math.floor(Math.random() * demoProjects.length)]
    setProject(randomProject)
  }, [])

  // おすすめプロジェクト（スキルマッチング）
  const recommendedProjects = userSkills.length > 0 
    ? demoProjects.filter(project => 
        project.tags.some(tag => 
          userSkills.some(skill => 
            skill.toLowerCase().includes(tag.toLowerCase()) || 
            tag.toLowerCase().includes(skill.toLowerCase())
          )
        )
      ).slice(0, 10)
    : demoProjects.slice(0, 10)

  // 今週の注目プロジェクト（人気順）
  const weeklyPopularProjects = [...demoProjects].sort((a, b) => {
    const aPopularity = a.commit_count + a.raise_count + a.watch_count
    const bPopularity = b.commit_count + b.raise_count + b.watch_count
    return bPopularity - aPopularity
  }).slice(0, 10)


  return (
    <div className="min-h-screen bg-retro-darkGray">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="retro-title text-3xl text-retro-cyan mb-8 text-center">発見</h1>
        
        {/* おすすめプロジェクト */}
        {user && userSkills.length > 0 && (
          <div className="mb-12">
            <h2 className="retro-text-readable text-xl font-pixel mb-6">🎯 あなたへのおすすめ</h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {recommendedProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  p={project}
                  onChanged={() => {}}
                />
              ))}
            </div>
          </div>
        )}

        {/* 今週の注目 */}
        <div className="mb-12">
          <h2 className="retro-text-readable text-xl font-pixel mb-6">🔥 今週の注目</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {weeklyPopularProjects.map((project) => (
              <ProjectCard
                key={project.id}
                p={project}
                onChanged={() => {}}
              />
            ))}
          </div>
        </div>

        {/* スワイプカード（既存機能） */}
        <div className="retro-card bg-black border-2 border-retro-orange p-6">
          <h2 className="retro-text-readable text-xl font-pixel mb-6 text-center">🎲 ランダム発見</h2>
          <div className="max-w-md mx-auto" suppressHydrationWarning>
            <SwipeCard project={project || initialProject} />
          </div>
        </div>
      </div>
    </div>
  )
}