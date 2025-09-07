import { createClient } from '@/lib/supabaseBrowser'

export const BADGE_TYPES = {
  FIRST_COMMENT: 'first_comment',
  FIRST_UPDATE: 'first_update',
  FIRST_SHARE: 'first_share',
} as const

export type BadgeType = typeof BADGE_TYPES[keyof typeof BADGE_TYPES]

export async function checkAndAwardBadge(userId: string, badgeType: BadgeType): Promise<boolean> {
  const supabase = createClient()

  try {
    // 既にバッジを持っているかチェック
    const { data: existingBadge } = await supabase
      .from('user_badges')
      .select('badge_code')
      .eq('user_id', userId)
      .eq('badge_code', badgeType)
      .single()

    if (existingBadge) {
      return false // 既に持っている
    }

    // バッジを付与
    const { error } = await supabase
      .from('user_badges')
      .insert({
        user_id: userId,
        badge_code: badgeType,
      })

    if (error) {
      console.error('Error awarding badge:', error)
      return false
    }

    return true // 新しく付与された
  } catch (error) {
    console.error('Error checking/awarding badge:', error)
    return false
  }
}

export async function checkFirstCommentBadge(userId: string): Promise<boolean> {
  const supabase = createClient()

  try {
    // コメント数をチェック
    const { count } = await supabase
      .from('comments')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    if (count === 1) {
      return await checkAndAwardBadge(userId, BADGE_TYPES.FIRST_COMMENT)
    }

    return false
  } catch (error) {
    console.error('Error checking first comment badge:', error)
    return false
  }
}

export async function checkFirstUpdateBadge(userId: string): Promise<boolean> {
  const supabase = createClient()

  try {
    // 進捗更新数をチェック
    const { count } = await supabase
      .from('progress_updates')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    if (count === 1) {
      return await checkAndAwardBadge(userId, BADGE_TYPES.FIRST_UPDATE)
    }

    return false
  } catch (error) {
    console.error('Error checking first update badge:', error)
    return false
  }
}

export async function awardShareBadge(userId: string): Promise<boolean> {
  return await checkAndAwardBadge(userId, BADGE_TYPES.FIRST_SHARE)
}
