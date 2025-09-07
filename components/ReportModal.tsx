'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'

interface ReportModalProps {
  isOpen: boolean
  onClose: () => void
  targetType: 'project' | 'comment' | 'user'
  targetId: string
  targetTitle?: string
}

export default function ReportModal({ 
  isOpen, 
  onClose, 
  targetType, 
  targetId, 
  targetTitle 
}: ReportModalProps) {
  const [selectedReason, setSelectedReason] = useState('')
  const [description, setDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const reportReasons = [
    { value: 'spam', label: 'スパム・不適切な内容' },
    { value: 'harassment', label: 'ハラスメント・いじめ' },
    { value: 'inappropriate', label: '不適切なコンテンツ' },
    { value: 'copyright', label: '著作権侵害' },
    { value: 'fake', label: '偽情報・詐欺' },
    { value: 'other', label: 'その他' }
  ]

  const handleSubmit = async () => {
    if (!selectedReason) {
      toast.error('通報理由を選択してください')
      return
    }

    setIsSubmitting(true)
    try {
      // 新しいAPIエンドポイントを使用
      const response = await fetch('/api/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contentId: targetId,
          contentType: targetType,
          reason: selectedReason,
          description: description.trim() || null
        })
      })

      const result = await response.json()

      if (response.ok) {
        toast.success('通報を受け付けました。ご協力ありがとうございます。')
        onClose()
        setSelectedReason('')
        setDescription('')
      } else {
        toast.error(result.error || '通報の送信に失敗しました')
      }
    } catch (error) {
      console.log('Report submission failed:', error)
      toast.error('通報の送信に失敗しました')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="retro-card bg-black border-2 border-retro-cyan max-w-md w-full">
        <div className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-pixel text-sm text-retro-cyan">REPORT</h3>
            <button
              onClick={onClose}
              className="retro-button text-xs px-2 py-1"
            >
              CLOSE
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <p className="font-pixel text-xs text-retro-lightGray mb-2">
                通報対象: {targetTitle || `${targetType} (${targetId})`}
              </p>
            </div>

            <div>
              <label className="retro-label">
                通報理由
              </label>
              <div className="space-y-2">
                {reportReasons.map((reason) => (
                  <label key={reason.value} className="flex items-center">
                    <input
                      type="radio"
                      name="reason"
                      value={reason.value}
                      checked={selectedReason === reason.value}
                      onChange={(e) => setSelectedReason(e.target.value)}
                      className="mr-2 accent-retro-cyan"
                    />
                    <span className="retro-text-readable-dark text-xs">
                      {reason.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="retro-label">
                詳細（任意）
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="詳細を入力してください..."
                className="retro-textarea w-full"
                rows={3}
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="flex-1 retro-button text-xs py-2"
              >
                CANCEL
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || !selectedReason}
                className="flex-1 retro-button retro-button-danger text-xs py-2 disabled:opacity-50"
              >
                {isSubmitting ? 'SUBMITTING...' : 'REPORT'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
