'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabaseBrowser'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'

interface Profile {
  id: string
  display_name?: string
  bio?: string
  skills?: string[]
  links?: {
    github?: string
    portfolio?: string
    linkedin?: string
  }
  location?: string
  role?: string
  avatar_url?: string
}

interface ProfileEditFormProps {
  initialProfile?: Profile | null
}

export default function ProfileEditForm({ initialProfile }: ProfileEditFormProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    display_name: initialProfile?.display_name || '',
    bio: initialProfile?.bio || '',
    skills: initialProfile?.skills?.join(', ') || '',
    location: initialProfile?.location || '',
    role: initialProfile?.role || '',
    avatar_url: initialProfile?.avatar_url || '',
    github: initialProfile?.links?.github || '',
    portfolio: initialProfile?.links?.portfolio || '',
    linkedin: initialProfile?.links?.linkedin || '',
  })

  const supabase = createClient()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('ログインが必要です')
        return
      }

      // スキルを配列に変換
      const skillsArray = formData.skills
        .split(',')
        .map(skill => skill.trim())
        .filter(skill => skill.length > 0)

      // リンクオブジェクトを作成
      const links = {
        github: formData.github || null,
        portfolio: formData.portfolio || null,
        linkedin: formData.linkedin || null,
      }

      const profileData = {
        display_name: formData.display_name || null,
        bio: formData.bio || null,
        skills: skillsArray.length > 0 ? skillsArray : null,
        location: formData.location || null,
        role: formData.role || null,
        avatar_url: formData.avatar_url || null,
        links: Object.values(links).some(link => link) ? links : null,
        updated_at: new Date().toISOString(),
      }

      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          ...profileData,
        })

      if (error) {
        console.error('Profile update error:', error)
        toast.error('プロフィールの更新に失敗しました')
        return
      }

      toast.success('プロフィールを更新しました！')
      setIsOpen(false)
      router.refresh()
    } catch (error) {
      console.error('Profile update error:', error)
      toast.error('プロフィールの更新に失敗しました')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="retro-button retro-button-primary text-xs px-4 py-2"
      >
        プロフィール編集
      </button>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="retro-card bg-black border-2 border-retro-cyan p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="retro-title text-xl text-retro-cyan">プロフィール編集</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="retro-button text-xs px-3 py-1"
          >
            CLOSE
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="retro-label">表示名</label>
            <input
              type="text"
              value={formData.display_name}
              onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
              placeholder="表示名を入力"
              className="retro-input w-full"
            />
          </div>

          <div>
            <label className="retro-label">自己紹介</label>
            <textarea
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              placeholder="自己紹介を入力"
              className="retro-textarea w-full"
              rows={3}
            />
          </div>

          <div>
            <label className="retro-label">スキル（カンマ区切り）</label>
            <input
              type="text"
              value={formData.skills}
              onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
              placeholder="Next.js, TypeScript, React"
              className="retro-input w-full"
            />
          </div>

          <div>
            <label className="retro-label">所在地</label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="東京都、大阪府など"
              className="retro-input w-full"
            />
          </div>

          <div>
            <label className="retro-label">役割</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="retro-input w-full"
            >
              <option value="">選択してください</option>
              <option value="student">学生</option>
              <option value="pro">プロ</option>
              <option value="founder">起業家</option>
              <option value="freelancer">フリーランサー</option>
              <option value="other">その他</option>
            </select>
          </div>

          <div>
            <label className="retro-label">アバター画像URL</label>
            <input
              type="url"
              value={formData.avatar_url}
              onChange={(e) => setFormData({ ...formData, avatar_url: e.target.value })}
              placeholder="https://example.com/avatar.jpg"
              className="retro-input w-full"
            />
          </div>

          <div className="border-t border-retro-lightGray pt-4">
            <h3 className="retro-text-readable text-sm font-pixel mb-3">🔗 リンク</h3>
            
            <div className="space-y-3">
              <div>
                <label className="retro-label">GitHub</label>
                <input
                  type="url"
                  value={formData.github}
                  onChange={(e) => setFormData({ ...formData, github: e.target.value })}
                  placeholder="https://github.com/username"
                  className="retro-input w-full"
                />
              </div>

              <div>
                <label className="retro-label">Portfolio</label>
                <input
                  type="url"
                  value={formData.portfolio}
                  onChange={(e) => setFormData({ ...formData, portfolio: e.target.value })}
                  placeholder="https://your-portfolio.com"
                  className="retro-input w-full"
                />
              </div>

              <div>
                <label className="retro-label">LinkedIn</label>
                <input
                  type="url"
                  value={formData.linkedin}
                  onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                  placeholder="https://linkedin.com/in/username"
                  className="retro-input w-full"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="retro-button retro-button-primary text-xs px-4 py-2 disabled:opacity-50"
            >
              {isSubmitting ? '保存中...' : '保存'}
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="retro-button text-xs px-4 py-2"
            >
              キャンセル
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}