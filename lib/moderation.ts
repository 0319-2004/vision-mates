// モデレーション設定
export const MODERATION_CONFIG = {
  // 自動削除の閾値
  AUTO_DELETE_THRESHOLDS: {
    project: 5,      // プロジェクト: 5件の通報で自動削除
    comment: 3,      // コメント: 3件の通報で自動削除
    user: 10,        // ユーザー: 10件の通報で自動ブロック
  },
  
  // 自動警告の閾値
  AUTO_WARNING_THRESHOLDS: {
    project: 3,      // プロジェクト: 3件の通報で警告
    comment: 2,      // コメント: 2件の通報で警告
    user: 5,         // ユーザー: 5件の通報で警告
  },
  
  // 通報の有効期限（日数）
  REPORT_EXPIRY_DAYS: 30,
  
  // 自動処理の実行間隔（分）
  AUTO_PROCESS_INTERVAL: 60,
}

// 通報の重要度を計算
export function calculateReportSeverity(reports: any[]): 'low' | 'medium' | 'high' | 'critical' {
  const count = reports.length
  const recentReports = reports.filter(r => {
    const reportDate = new Date(r.created_at)
    const daysDiff = (Date.now() - reportDate.getTime()) / (1000 * 60 * 60 * 24)
    return daysDiff <= 7 // 過去7日以内
  }).length

  // 重要度の判定
  if (count >= 10 || recentReports >= 5) return 'critical'
  if (count >= 5 || recentReports >= 3) return 'high'
  if (count >= 3 || recentReports >= 2) return 'medium'
  return 'low'
}

// 自動削除の判定
export function shouldAutoDelete(targetType: string, reportCount: number): boolean {
  const threshold = MODERATION_CONFIG.AUTO_DELETE_THRESHOLDS[targetType as keyof typeof MODERATION_CONFIG.AUTO_DELETE_THRESHOLDS]
  return reportCount >= threshold
}

// 自動警告の判定
export function shouldAutoWarn(targetType: string, reportCount: number): boolean {
  const threshold = MODERATION_CONFIG.AUTO_WARNING_THRESHOLDS[targetType as keyof typeof MODERATION_CONFIG.AUTO_WARNING_THRESHOLDS]
  return reportCount >= threshold
}

// 通報の自動処理
export function processReports() {
  try {
    const reports = localStorage.getItem('visionmates_reports')
    if (!reports) return

    const reportsData = JSON.parse(reports)
    const now = new Date()
    
    // 通報を対象別にグループ化
    const reportsByTarget = reportsData.reduce((acc: any, report: any) => {
      const key = `${report.target_type}_${report.target_id}`
      if (!acc[key]) {
        acc[key] = []
      }
      acc[key].push(report)
      return acc
    }, {})

    // 各対象の通報を処理
    Object.entries(reportsByTarget).forEach(([key, targetReports]: [string, any]) => {
      const [targetType, targetId] = key.split('_')
      const reportCount = targetReports.length
      const severity = calculateReportSeverity(targetReports)

      // 自動削除の判定
      if (shouldAutoDelete(targetType, reportCount)) {
        handleAutoDelete(targetType, targetId, reportCount, severity)
      }
      // 自動警告の判定
      else if (shouldAutoWarn(targetType, reportCount)) {
        handleAutoWarning(targetType, targetId, reportCount, severity)
      }
    })

    // 期限切れの通報を削除
    cleanupExpiredReports(reportsData)
    
  } catch (error) {
    console.log('Error processing reports:', error)
  }
}

// 自動削除の処理
function handleAutoDelete(targetType: string, targetId: string, reportCount: number, severity: string) {
  console.log(`Auto-deleting ${targetType} ${targetId} due to ${reportCount} reports (${severity})`)
  
  // 削除ログを保存
  const deletionLog = {
    id: `deletion-${Date.now()}`,
    target_type: targetType,
    target_id: targetId,
    report_count: reportCount,
    severity: severity,
    action: 'auto_delete',
    created_at: new Date().toISOString(),
    reason: `${reportCount}件の通報により自動削除`
  }

  // 削除ログを保存
  const existingLogs = localStorage.getItem('visionmates_moderation_logs')
  let logs = []
  if (existingLogs) {
    try {
      logs = JSON.parse(existingLogs)
    } catch (e) {
      console.log('Failed to parse existing logs:', e)
    }
  }
  logs.push(deletionLog)
  localStorage.setItem('visionmates_moderation_logs', JSON.stringify(logs))

  // 実際の削除処理
  if (targetType === 'project') {
    deleteProject(targetId)
  } else if (targetType === 'comment') {
    deleteComment(targetId)
  } else if (targetType === 'user') {
    blockUser(targetId)
  }

  // 通報を解決済みにマーク
  markReportsAsResolved(targetType, targetId, 'auto_deleted')
}

// 自動警告の処理
function handleAutoWarning(targetType: string, targetId: string, reportCount: number, severity: string) {
  console.log(`Auto-warning ${targetType} ${targetId} due to ${reportCount} reports (${severity})`)
  
  // 警告ログを保存
  const warningLog = {
    id: `warning-${Date.now()}`,
    target_type: targetType,
    target_id: targetId,
    report_count: reportCount,
    severity: severity,
    action: 'auto_warning',
    created_at: new Date().toISOString(),
    reason: `${reportCount}件の通報により警告`
  }

  const existingLogs = localStorage.getItem('visionmates_moderation_logs')
  let logs = []
  if (existingLogs) {
    try {
      logs = JSON.parse(existingLogs)
    } catch (e) {
      console.log('Failed to parse existing logs:', e)
    }
  }
  logs.push(warningLog)
  localStorage.setItem('visionmates_moderation_logs', JSON.stringify(logs))

  // 通報を警告済みにマーク
  markReportsAsResolved(targetType, targetId, 'auto_warned')
}

// プロジェクトの削除
function deleteProject(projectId: string) {
  // ローカルストレージからプロジェクトを削除
  const projects = localStorage.getItem('visionmates_projects')
  if (projects) {
    try {
      const projectsData = JSON.parse(projects)
      const filteredProjects = projectsData.filter((p: any) => p.id !== projectId)
      localStorage.setItem('visionmates_projects', JSON.stringify(filteredProjects))
    } catch (e) {
      console.log('Failed to delete project:', e)
    }
  }
}

// コメントの削除
function deleteComment(commentId: string) {
  // コメントの削除処理（実装が必要）
  console.log(`Deleting comment ${commentId}`)
}

// ユーザーのブロック
function blockUser(userId: string) {
  // ユーザーのブロック処理（実装が必要）
  console.log(`Blocking user ${userId}`)
}

// 通報を解決済みにマーク
function markReportsAsResolved(targetType: string, targetId: string, status: string) {
  const reports = localStorage.getItem('visionmates_reports')
  if (!reports) return

  try {
    const reportsData = JSON.parse(reports)
    const updatedReports = reportsData.map((report: any) => {
      if (report.target_type === targetType && report.target_id === targetId) {
        return { ...report, status: status, resolved_at: new Date().toISOString() }
      }
      return report
    })
    localStorage.setItem('visionmates_reports', JSON.stringify(updatedReports))
  } catch (e) {
    console.log('Failed to mark reports as resolved:', e)
  }
}

// 期限切れの通報をクリーンアップ
function cleanupExpiredReports(reportsData: any[]) {
  const now = new Date()
  const expiryDate = new Date(now.getTime() - (MODERATION_CONFIG.REPORT_EXPIRY_DAYS * 24 * 60 * 60 * 1000))
  
  const activeReports = reportsData.filter((report: any) => {
    const reportDate = new Date(report.created_at)
    return reportDate > expiryDate
  })

  localStorage.setItem('visionmates_reports', JSON.stringify(activeReports))
}

// 自動処理の開始
export function startAutoModeration() {
  // 初回実行
  processReports()
  
  // 定期的な実行
  setInterval(processReports, MODERATION_CONFIG.AUTO_PROCESS_INTERVAL * 60 * 1000)
}

