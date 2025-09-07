'use client'

import { useState } from 'react'
import { IdeaTemplate } from '@/types'
import { createClient } from '@/lib/supabaseBrowser'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

interface SeedFormProps {
  templates: IdeaTemplate[]
}

export default function SeedForm({ templates }: SeedFormProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<IdeaTemplate | null>(null)
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [preview, setPreview] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleTemplateSelect = (template: IdeaTemplate) => {
    setSelectedTemplate(template)
    setFormData({})
    setPreview('')
  }

  const handleFieldChange = (fieldName: string, value: string) => {
    const newFormData = { ...formData, [fieldName]: value }
    setFormData(newFormData)
    
    // プレビューを更新
    if (selectedTemplate) {
      let previewText = selectedTemplate.template
      selectedTemplate.fields.forEach(field => {
        const fieldValue = newFormData[field.name] || `[${field.label}]`
        previewText = previewText.replace(`{${field.name}}`, fieldValue)
      })
      setPreview(previewText)
    }
  }

  const handleCreateProject = async () => {
    if (!selectedTemplate || !preview.trim()) {
      toast.error('テンプレートを選択し、すべての項目を入力してください')
      return
    }

    setIsSubmitting(true)
    
    try {
      // まずSupabaseの接続をテスト（認証状態をリセットしない）
      const { error: testError } = await supabase
        .from('projects')
        .select('id')
        .limit(1)

      if (testError) {
        console.log('Database connection failed, using demo mode:', testError)
        // デモモードでプロジェクト作成
        const demoProjectId = `demo-${Date.now()}`
        const newProject = {
          id: demoProjectId,
          title: preview,
          purpose: `テンプレート「${selectedTemplate.name}」から作成されたプロジェクトです。`,
          tags: [selectedTemplate.name],
          created_at: new Date().toISOString(),
          watch_count: 0,
          raise_count: 0,
          commit_count: 0,
          comment_count: 0,
          update_count: 0,
        }
        
        // ローカルストレージに保存
        const existingProjects = localStorage.getItem('visionmates_projects')
        let projects = []
        if (existingProjects) {
          try {
            projects = JSON.parse(existingProjects)
          } catch (e) {
            console.log('Failed to parse existing projects:', e)
          }
        }
        projects.push(newProject)
        localStorage.setItem('visionmates_projects', JSON.stringify(projects))
        
        toast.success('プロジェクトを作成しました！（デモモード）')
        router.push('/')
        return
      }

      // データベースが利用可能な場合のみ認証チェック
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        // デモモードでプロジェクト作成
        const demoProjectId = `demo-${Date.now()}`
        const newProject = {
          id: demoProjectId,
          title: preview,
          purpose: `テンプレート「${selectedTemplate.name}」から作成されたプロジェクトです。`,
          tags: [selectedTemplate.name],
          created_at: new Date().toISOString(),
          watch_count: 0,
          raise_count: 0,
          commit_count: 0,
          comment_count: 0,
          update_count: 0,
        }
        
        // ローカルストレージに保存
        const existingProjects = localStorage.getItem('visionmates_projects')
        let projects = []
        if (existingProjects) {
          try {
            projects = JSON.parse(existingProjects)
          } catch (e) {
            console.log('Failed to parse existing projects:', e)
          }
        }
        projects.push(newProject)
        localStorage.setItem('visionmates_projects', JSON.stringify(projects))
        
        toast.success('プロジェクトを作成しました！（デモモード）')
        router.push('/')
        return
      }

      // プロジェクトを作成
      const { data: project, error } = await supabase
        .from('projects')
        .insert({
          title: preview,
          purpose: `テンプレート「${selectedTemplate.name}」から作成されたプロジェクトです。`,
          tags: [selectedTemplate.name]
        })
        .select()
        .single()

      if (error) {
        console.log('Database operation failed, using demo mode:', error)
        // デモモードでプロジェクト作成
        const demoProjectId = `demo-${Date.now()}`
        const newProject = {
          id: demoProjectId,
          title: preview,
          purpose: `テンプレート「${selectedTemplate.name}」から作成されたプロジェクトです。`,
          tags: [selectedTemplate.name],
          created_at: new Date().toISOString(),
          watch_count: 0,
          raise_count: 0,
          commit_count: 0,
          comment_count: 0,
          update_count: 0,
        }
        
        // ローカルストレージに保存
        const existingProjects = localStorage.getItem('visionmates_projects')
        let projects = []
        if (existingProjects) {
          try {
            projects = JSON.parse(existingProjects)
          } catch (e) {
            console.log('Failed to parse existing projects:', e)
          }
        }
        projects.push(newProject)
        localStorage.setItem('visionmates_projects', JSON.stringify(projects))
        
        toast.success('プロジェクトを作成しました！（デモモード）')
        router.push('/')
        return
      }

      toast.success('プロジェクトを作成しました！')
      router.push(`/projects/${project.id}`)
    } catch (error) {
      console.log('Project creation failed, using demo mode:', error)
      // デモモードでプロジェクト作成
      const demoProjectId = `demo-${Date.now()}`
      const newProject = {
        id: demoProjectId,
        title: preview,
        purpose: `テンプレート「${selectedTemplate.name}」から作成されたプロジェクトです。`,
        tags: [selectedTemplate.name],
        created_at: new Date().toISOString(),
        watch_count: 0,
        raise_count: 0,
        commit_count: 0,
        comment_count: 0,
        update_count: 0,
      }
      
      // ローカルストレージに保存
      const existingProjects = localStorage.getItem('visionmates_projects')
      let projects = []
      if (existingProjects) {
        try {
          projects = JSON.parse(existingProjects)
        } catch (e) {
          console.log('Failed to parse existing projects:', e)
        }
      }
      projects.push(newProject)
      localStorage.setItem('visionmates_projects', JSON.stringify(projects))
      
      toast.success('プロジェクトを作成しました！（デモモード）')
      router.push('/')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* テンプレート選択 */}
      <div className="retro-card bg-black border-2 border-retro-cyan p-6">
        <h2 className="retro-title text-xl text-retro-cyan mb-4">テンプレートを選択</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <button
              key={template.id}
              onClick={() => handleTemplateSelect(template)}
              className={`retro-card p-4 text-left transition-all duration-200 ${
                selectedTemplate?.id === template.id
                  ? 'border-2 border-retro-cyan bg-retro-darkGray'
                  : 'border-2 border-retro-lightGray bg-black hover:border-retro-cyan'
              }`}
            >
              <h3 className="retro-text-readable font-pixel text-sm mb-2">{template.name}</h3>
              <p className="retro-text-readable-dark text-xs">{template.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* フォーム入力 */}
      {selectedTemplate && (
        <div className="retro-card bg-black border-2 border-retro-orange p-6">
          <h2 className="retro-title text-xl text-retro-orange mb-4">
            {selectedTemplate.name}の詳細を入力
          </h2>
          
          <div className="space-y-4">
            {selectedTemplate.fields.map((field) => (
              <div key={field.name}>
                <label className="retro-label">
                  {field.label}
                </label>
                {field.type === 'textarea' ? (
                  <textarea
                    value={formData[field.name] || ''}
                    onChange={(e) => handleFieldChange(field.name, e.target.value)}
                    placeholder={field.placeholder}
                    className="retro-textarea w-full"
                    rows={3}
                  />
                ) : (
                  <input
                    type="text"
                    value={formData[field.name] || ''}
                    onChange={(e) => handleFieldChange(field.name, e.target.value)}
                    placeholder={field.placeholder}
                    className="retro-input w-full"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* プレビュー */}
      {preview && (
        <div className="retro-card bg-black border-2 border-retro-green p-6">
          <h2 className="retro-title text-xl text-retro-green mb-4">プレビュー</h2>
          <div className="retro-card bg-retro-darkGray border-2 border-retro-lightGray p-4">
            <h3 className="retro-text-readable font-pixel text-sm mb-2">プロジェクトタイトル</h3>
            <p className="retro-text-readable-dark">{preview}</p>
          </div>
          
          <div className="mt-6">
            <button
              onClick={handleCreateProject}
              disabled={isSubmitting || !preview.trim()}
              className="w-full retro-button retro-button-primary py-3 font-pixel text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? '作成中...' : 'プロジェクトを作成'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
} 