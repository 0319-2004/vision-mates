'use client'

import { useState } from 'react'
import { keepReport, holdReport, deleteReport } from './actions'
import toast from 'react-hot-toast'

interface Report {
  id: string
  content_id: string
  content_type: string
  reason: string
  description: string | null
  status: string
  reported_by: string
  created_at: string
  reviewed_by: string | null
  reviewed_at: string | null
  action_notes: string | null
  profiles_reported_by: {
    display_name: string
    email: string
  }
  profiles_reviewed_by: {
    display_name: string
    email: string
  } | null
}

interface ModerationTableProps {
  reports: Report[]
}

export default function ModerationTable({ reports }: ModerationTableProps) {
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [showNotesModal, setShowNotesModal] = useState(false)
  const [actionType, setActionType] = useState<'keep' | 'hold' | 'delete' | null>(null)
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleAction = async (report: Report, action: 'keep' | 'hold' | 'delete') => {
    setSelectedReport(report)
    setActionType(action)
    setNotes('')
    setShowNotesModal(true)
  }

  const submitAction = async () => {
    if (!selectedReport || !actionType) return

    setIsSubmitting(true)
    try {
      let result
      switch (actionType) {
        case 'keep':
          result = await keepReport(selectedReport.id, notes || undefined)
          break
        case 'hold':
          result = await holdReport(selectedReport.id, notes || undefined)
          break
        case 'delete':
          result = await deleteReport(selectedReport.id, notes || undefined)
          break
      }

      if (result.success) {
        toast.success(result.message || '操作が完了しました')
        setShowNotesModal(false)
        setSelectedReport(null)
        setActionType(null)
        setNotes('')
      } else {
        toast.error(result.error || '操作に失敗しました')
      }
    } catch (error) {
      toast.error('操作に失敗しました')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'text-retro-yellow'
      case 'hold': return 'text-retro-orange'
      case 'kept': return 'text-retro-green'
      case 'deleted': return 'text-retro-red'
      default: return 'text-retro-lightGray'
    }
  }

  const getContentTypeLabel = (type: string) => {
    switch (type) {
      case 'project': return 'プロジェクト'
      case 'comment': return 'コメント'
      case 'user': return 'ユーザー'
      default: return type
    }
  }

  return (
    <>
      <div className="retro-card bg-black border-2 border-retro-lightGray">
        <div className="p-4">
          <h2 className="font-pixel text-lg text-retro-lightGray mb-4">
            REPORTS ({reports.length})
          </h2>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-retro-lightGray">
                  <th className="font-pixel text-xs text-retro-cyan py-2 text-left">日時</th>
                  <th className="font-pixel text-xs text-retro-cyan py-2 text-left">対象</th>
                  <th className="font-pixel text-xs text-retro-cyan py-2 text-left">理由</th>
                  <th className="font-pixel text-xs text-retro-cyan py-2 text-left">通報者</th>
                  <th className="font-pixel text-xs text-retro-cyan py-2 text-left">ステータス</th>
                  <th className="font-pixel text-xs text-retro-cyan py-2 text-left">操作</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report) => (
                  <tr key={report.id} className="border-b border-retro-darkGray">
                    <td className="font-pixel text-xs text-retro-lightGray py-2">
                      {new Date(report.created_at).toLocaleDateString()}
                    </td>
                    <td className="font-pixel text-xs text-retro-lightGray py-2">
                      <div>
                        <div>{getContentTypeLabel(report.content_type)}</div>
                        <div className="text-retro-cyan">{report.content_id}</div>
                      </div>
                    </td>
                    <td className="font-pixel text-xs text-retro-lightGray py-2">
                      <div>
                        <div>{report.reason}</div>
                        {report.description && (
                          <div className="text-retro-lightGray mt-1 max-w-xs truncate">
                            {report.description}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="font-pixel text-xs text-retro-lightGray py-2">
                      <div>
                        <div>{report.profiles_reported_by.display_name}</div>
                        <div className="text-retro-lightGray">{report.profiles_reported_by.email}</div>
                      </div>
                    </td>
                    <td className="font-pixel text-xs py-2">
                      <span className={getStatusColor(report.status)}>
                        {report.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-2">
                      {report.status === 'open' || report.status === 'hold' ? (
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleAction(report, 'keep')}
                            className="retro-button retro-button-success text-xs px-2 py-1"
                          >
                            KEEP
                          </button>
                          <button
                            onClick={() => handleAction(report, 'hold')}
                            className="retro-button retro-button-warning text-xs px-2 py-1"
                          >
                            HOLD
                          </button>
                          <button
                            onClick={() => handleAction(report, 'delete')}
                            className="retro-button retro-button-danger text-xs px-2 py-1"
                          >
                            DELETE
                          </button>
                        </div>
                      ) : (
                        <span className="font-pixel text-xs text-retro-lightGray">
                          {report.profiles_reviewed_by?.display_name || 'Unknown'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ノート入力モーダル */}
      {showNotesModal && selectedReport && actionType && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="retro-card bg-black border-2 border-retro-cyan max-w-md w-full">
            <div className="p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-pixel text-sm text-retro-cyan">
                  {actionType.toUpperCase()} REPORT
                </h3>
                <button
                  onClick={() => setShowNotesModal(false)}
                  className="retro-button text-xs px-2 py-1"
                >
                  CLOSE
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="font-pixel text-xs text-retro-lightGray mb-2">
                    対象: {getContentTypeLabel(selectedReport.content_type)} ({selectedReport.content_id})
                  </p>
                  <p className="font-pixel text-xs text-retro-lightGray mb-2">
                    理由: {selectedReport.reason}
                  </p>
                </div>

                <div>
                  <label className="block font-pixel text-xs text-retro-lightGray mb-2">
                    備考（任意）
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="操作の理由や詳細を入力してください..."
                    className="w-full px-2 py-1 border-2 border-retro-lightGray bg-black text-retro-lightGray font-pixel text-xs focus:border-retro-cyan focus:outline-none"
                    rows={3}
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setShowNotesModal(false)}
                    className="flex-1 retro-button text-xs py-2"
                  >
                    CANCEL
                  </button>
                  <button
                    onClick={submitAction}
                    disabled={isSubmitting}
                    className={`flex-1 retro-button text-xs py-2 disabled:opacity-50 ${
                      actionType === 'keep' ? 'retro-button-success' :
                      actionType === 'hold' ? 'retro-button-warning' :
                      'retro-button-danger'
                    }`}
                  >
                    {isSubmitting ? 'PROCESSING...' : actionType.toUpperCase()}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
