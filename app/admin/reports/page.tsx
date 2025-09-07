'use client'

import { useState, useEffect } from 'react'
import { processReports, MODERATION_CONFIG } from '@/lib/moderation'

interface Report {
  id: string
  target_type: string
  target_id: string
  target_title?: string
  reason: string
  description: string
  created_at: string
  status: string
  resolved_at?: string
}

interface ModerationLog {
  id: string
  target_type: string
  target_id: string
  report_count: number
  severity: string
  action: string
  created_at: string
  reason: string
}

export default function ReportsAdminPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [logs, setLogs] = useState<ModerationLog[]>([])
  const [filter, setFilter] = useState<'all' | 'pending' | 'resolved'>('all')
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'count'>('newest')

  useEffect(() => {
    loadReports()
    loadLogs()
  }, [])

  const loadReports = () => {
    const reportsData = localStorage.getItem('visionmates_reports')
    if (reportsData) {
      try {
        const parsedReports = JSON.parse(reportsData)
        setReports(parsedReports)
      } catch (e) {
        console.log('Failed to parse reports:', e)
      }
    }
  }

  const loadLogs = () => {
    const logsData = localStorage.getItem('visionmates_moderation_logs')
    if (logsData) {
      try {
        const parsedLogs = JSON.parse(logsData)
        setLogs(parsedLogs)
      } catch (e) {
        console.log('Failed to parse logs:', e)
      }
    }
  }

  const handleManualProcess = () => {
    processReports()
    loadReports()
    loadLogs()
  }

  const handleResolveReport = (reportId: string) => {
    const updatedReports = reports.map(report => {
      if (report.id === reportId) {
        return { ...report, status: 'manually_resolved', resolved_at: new Date().toISOString() }
      }
      return report
    })
    setReports(updatedReports)
    localStorage.setItem('visionmates_reports', JSON.stringify(updatedReports))
  }

  const filteredReports = reports.filter(report => {
    if (filter === 'pending') return report.status === 'pending'
    if (filter === 'resolved') return report.status !== 'pending'
    return true
  })

  const sortedReports = [...filteredReports].sort((a, b) => {
    if (sortBy === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    if (sortBy === 'oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    return 0
  })

  // 通報を対象別にグループ化
  const reportsByTarget = sortedReports.reduce((acc: any, report) => {
    const key = `${report.target_type}_${report.target_id}`
    if (!acc[key]) {
      acc[key] = []
    }
    acc[key].push(report)
    return acc
  }, {})

  return (
    <div className="min-h-screen bg-retro-darkGray">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* ヘッダー */}
        <div className="retro-card bg-black border-2 border-retro-cyan mb-8">
          <div className="p-6">
            <h1 className="text-3xl font-pixel text-retro-cyan mb-4">MODERATION DASHBOARD</h1>
            <p className="font-pixel text-sm text-retro-lightGray mb-4">
              通報の管理と自動処理システム
            </p>
            
            <div className="flex flex-wrap gap-4 items-center">
              <button
                onClick={handleManualProcess}
                className="retro-button retro-button-primary text-xs px-4 py-2"
              >
                PROCESS REPORTS
              </button>
              
              <div className="flex gap-2">
                <button
                  onClick={() => setFilter('all')}
                  className={`retro-button text-xs px-3 py-1 ${filter === 'all' ? 'retro-button-primary' : ''}`}
                >
                  ALL
                </button>
                <button
                  onClick={() => setFilter('pending')}
                  className={`retro-button text-xs px-3 py-1 ${filter === 'pending' ? 'retro-button-primary' : ''}`}
                >
                  PENDING
                </button>
                <button
                  onClick={() => setFilter('resolved')}
                  className={`retro-button text-xs px-3 py-1 ${filter === 'resolved' ? 'retro-button-primary' : ''}`}
                >
                  RESOLVED
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 設定情報 */}
        <div className="retro-card bg-black border-2 border-retro-yellow mb-8">
          <div className="p-4">
            <h2 className="font-pixel text-lg text-retro-yellow mb-3">AUTO-MODERATION SETTINGS</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div>
                <h3 className="font-pixel text-retro-cyan mb-2">AUTO DELETE THRESHOLDS</h3>
                <ul className="font-pixel text-retro-lightGray space-y-1">
                  <li>Projects: {MODERATION_CONFIG.AUTO_DELETE_THRESHOLDS.project} reports</li>
                  <li>Comments: {MODERATION_CONFIG.AUTO_DELETE_THRESHOLDS.comment} reports</li>
                  <li>Users: {MODERATION_CONFIG.AUTO_DELETE_THRESHOLDS.user} reports</li>
                </ul>
              </div>
              <div>
                <h3 className="font-pixel text-retro-cyan mb-2">AUTO WARNING THRESHOLDS</h3>
                <ul className="font-pixel text-retro-lightGray space-y-1">
                  <li>Projects: {MODERATION_CONFIG.AUTO_WARNING_THRESHOLDS.project} reports</li>
                  <li>Comments: {MODERATION_CONFIG.AUTO_WARNING_THRESHOLDS.comment} reports</li>
                  <li>Users: {MODERATION_CONFIG.AUTO_WARNING_THRESHOLDS.user} reports</li>
                </ul>
              </div>
              <div>
                <h3 className="font-pixel text-retro-cyan mb-2">SYSTEM SETTINGS</h3>
                <ul className="font-pixel text-retro-lightGray space-y-1">
                  <li>Report Expiry: {MODERATION_CONFIG.REPORT_EXPIRY_DAYS} days</li>
                  <li>Process Interval: {MODERATION_CONFIG.AUTO_PROCESS_INTERVAL} min</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* 通報一覧 */}
        <div className="retro-card bg-black border-2 border-retro-lightGray mb-8">
          <div className="p-4">
            <h2 className="font-pixel text-lg text-retro-lightGray mb-4">
              REPORTS ({filteredReports.length})
            </h2>
            
            {Object.entries(reportsByTarget).map(([key, targetReports]: [string, any]) => {
              const [targetType, targetId] = key.split('_')
              const reportCount = targetReports.length
              const latestReport = targetReports[0]
              
              return (
                <div key={key} className="border-b border-retro-lightGray pb-4 mb-4 last:border-b-0">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-pixel text-sm text-retro-cyan">
                        {targetType.toUpperCase()}: {latestReport.target_title || targetId}
                      </h3>
                      <p className="font-pixel text-xs text-retro-lightGray">
                        {reportCount} 件の通報
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {latestReport.status === 'pending' && (
                        <button
                          onClick={() => handleResolveReport(latestReport.id)}
                          className="retro-button retro-button-secondary text-xs px-2 py-1"
                        >
                          RESOLVE
                        </button>
                      )}
                      <span className={`retro-button text-xs px-2 py-1 ${
                        latestReport.status === 'pending' ? 'retro-button-danger' : 'retro-button-success'
                      }`}>
                        {latestReport.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    {targetReports.slice(0, 3).map((report: Report) => (
                      <div key={report.id} className="bg-retro-darkGray p-2 rounded">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-pixel text-xs text-retro-lightGray">
                              {report.reason} - {new Date(report.created_at).toLocaleDateString()}
                            </p>
                            {report.description && (
                              <p className="font-pixel text-xs text-retro-lightGray mt-1">
                                {report.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    {targetReports.length > 3 && (
                      <p className="font-pixel text-xs text-retro-lightGray">
                        +{targetReports.length - 3} more reports
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* 処理ログ */}
        <div className="retro-card bg-black border-2 border-retro-purple">
          <div className="p-4">
            <h2 className="font-pixel text-lg text-retro-purple mb-4">
              MODERATION LOGS ({logs.length})
            </h2>
            
            <div className="space-y-2">
              {logs.slice(0, 10).map((log) => (
                <div key={log.id} className="bg-retro-darkGray p-3 rounded">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-pixel text-sm text-retro-lightGray">
                        {log.action.toUpperCase()} - {log.target_type.toUpperCase()}: {log.target_id}
                      </p>
                      <p className="font-pixel text-xs text-retro-lightGray">
                        {log.reason} ({log.report_count} reports, {log.severity} severity)
                      </p>
                    </div>
                    <span className="font-pixel text-xs text-retro-lightGray">
                      {new Date(log.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

