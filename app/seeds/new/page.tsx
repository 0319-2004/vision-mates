import { IdeaTemplate } from '@/types'
import SeedForm from '@/components/SeedForm'
import ideaTemplates from '@/data/idea-templates.json'

export default function NewSeedPage() {
  const templates = ideaTemplates as IdeaTemplate[]

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">企画テンプレ</h1>
        <p className="text-gray-600">
          テンプレートを選んで、簡単にプロジェクトの下書きを作成しましょう
        </p>
      </div>

      <SeedForm templates={templates} />
    </div>
  )
} 