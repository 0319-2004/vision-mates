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
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        toast.error('ログインが必要です')
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

      if (error) throw error

      toast.success('プロジェクトを作成しました！')
      router.push(`/projects/${project.id}`)
    } catch (error) {
      toast.error('プロジェクトの作成に失敗しました')
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* テンプレート選択 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">テンプレートを選択</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <button
              key={template.id}
              onClick={() => handleTemplateSelect(template)}
              className={`p-4 border rounded-lg text-left transition-colors ${
                selectedTemplate?.id === template.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <h3 className="font-semibold text-gray-900 mb-2">{template.name}</h3>
              <p className="text-sm text-gray-600">{template.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* フォーム入力 */}
      {selectedTemplate && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {selectedTemplate.name}の詳細を入力
          </h2>
          
          <div className="space-y-4">
            {selectedTemplate.fields.map((field) => (
              <div key={field.name}>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {field.label}
                </label>
                {field.type === 'textarea' ? (
                  <textarea
                    value={formData[field.name] || ''}
                    onChange={(e) => handleFieldChange(field.name, e.target.value)}
                    placeholder={field.placeholder}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                  />
                ) : (
                  <input
                    type="text"
                    value={formData[field.name] || ''}
                    onChange={(e) => handleFieldChange(field.name, e.target.value)}
                    placeholder={field.placeholder}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* プレビュー */}
      {preview && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">プレビュー</h2>
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">プロジェクトタイトル</h3>
            <p className="text-gray-700">{preview}</p>
          </div>
          
          <div className="mt-6">
            <button
              onClick={handleCreateProject}
              disabled={isSubmitting || !preview.trim()}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? '作成中...' : 'プロジェクトを作成'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
} 