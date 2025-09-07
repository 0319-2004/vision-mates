'use server'

import { createClient } from '@/lib/supabaseServer'
import { revalidatePath } from 'next/cache'

// 管理者権限チェック
async function checkAdminPermission() {
  const supabase = createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    throw new Error('認証が必要です')
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (profileError || !profile?.is_admin) {
    throw new Error('管理者権限が必要です')
  }

  return user
}

// 通報を「残す」に変更
export async function keepReport(reportId: string, notes?: string) {
  try {
    const user = await checkAdminPermission()
    const supabase = createClient()

    // 通報の存在確認
    const { data: report, error: reportError } = await supabase
      .from('reports')
      .select('*')
      .eq('id', reportId)
      .single()

    if (reportError || !report) {
      throw new Error('通報が見つかりません')
    }

    // 通報ステータスを更新
    const { error: updateError } = await supabase
      .from('reports')
      .update({
        status: 'kept',
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        action_notes: notes || null
      })
      .eq('id', reportId)

    if (updateError) {
      throw new Error('通報の更新に失敗しました')
    }

    // 操作ログを記録
    const { error: logError } = await supabase
      .from('moderation_actions')
      .insert({
        report_id: reportId,
        action: 'keep',
        actor_id: user.id,
        notes: notes || null
      })

    if (logError) {
      console.error('Failed to log moderation action:', logError)
    }

    revalidatePath('/admin/moderation')
    return { success: true, message: '通報を「残す」に変更しました' }

  } catch (error) {
    console.error('Keep report error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '操作に失敗しました' 
    }
  }
}

// 通報を「保留」に変更
export async function holdReport(reportId: string, notes?: string) {
  try {
    const user = await checkAdminPermission()
    const supabase = createClient()

    // 通報の存在確認
    const { data: report, error: reportError } = await supabase
      .from('reports')
      .select('*')
      .eq('id', reportId)
      .single()

    if (reportError || !report) {
      throw new Error('通報が見つかりません')
    }

    // 通報ステータスを更新
    const { error: updateError } = await supabase
      .from('reports')
      .update({
        status: 'hold',
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        action_notes: notes || null
      })
      .eq('id', reportId)

    if (updateError) {
      throw new Error('通報の更新に失敗しました')
    }

    // 操作ログを記録
    const { error: logError } = await supabase
      .from('moderation_actions')
      .insert({
        report_id: reportId,
        action: 'hold',
        actor_id: user.id,
        notes: notes || null
      })

    if (logError) {
      console.error('Failed to log moderation action:', logError)
    }

    revalidatePath('/admin/moderation')
    return { success: true, message: '通報を「保留」に変更しました' }

  } catch (error) {
    console.error('Hold report error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '操作に失敗しました' 
    }
  }
}

// 通報を「削除」に変更
export async function deleteReport(reportId: string, notes?: string) {
  try {
    const user = await checkAdminPermission()
    const supabase = createClient()

    // 通報の存在確認
    const { data: report, error: reportError } = await supabase
      .from('reports')
      .select('*')
      .eq('id', reportId)
      .single()

    if (reportError || !report) {
      throw new Error('通報が見つかりません')
    }

    // 対象コンテンツの削除処理
    await deleteContent(report.content_id, report.content_type)

    // 通報ステータスを更新
    const { error: updateError } = await supabase
      .from('reports')
      .update({
        status: 'deleted',
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        action_notes: notes || null
      })
      .eq('id', reportId)

    if (updateError) {
      throw new Error('通報の更新に失敗しました')
    }

    // 操作ログを記録
    const { error: logError } = await supabase
      .from('moderation_actions')
      .insert({
        report_id: reportId,
        action: 'delete',
        actor_id: user.id,
        notes: notes || null
      })

    if (logError) {
      console.error('Failed to log moderation action:', logError)
    }

    revalidatePath('/admin/moderation')
    return { success: true, message: '通報を「削除」に変更し、対象コンテンツを削除しました' }

  } catch (error) {
    console.error('Delete report error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '操作に失敗しました' 
    }
  }
}

// コンテンツ削除用の安全な関数
async function deleteContent(contentId: string, contentType: string) {
  const supabase = createClient()

  switch (contentType) {
    case 'project':
      // プロジェクトの削除（関連データも含む）
      const { error: projectError } = await supabase
        .from('projects')
        .delete()
        .eq('id', contentId)
      
      if (projectError) {
        throw new Error('プロジェクトの削除に失敗しました')
      }
      break

    case 'comment':
      // コメントの削除
      const { error: commentError } = await supabase
        .from('comments')
        .delete()
        .eq('id', contentId)
      
      if (commentError) {
        throw new Error('コメントの削除に失敗しました')
      }
      break

    case 'user':
      // ユーザーのブロック（プロフィールの無効化）
      const { error: userError } = await supabase
        .from('profiles')
        .update({ is_admin: false })
        .eq('id', contentId)
      
      if (userError) {
        throw new Error('ユーザーのブロックに失敗しました')
      }
      break

    default:
      throw new Error(`未対応のコンテンツタイプ: ${contentType}`)
  }
}
