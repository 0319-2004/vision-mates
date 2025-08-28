'use server'

import { createClient } from '@/lib/supabaseServer'
import { cookies } from 'next/headers'

export async function claimReferral() {
  try {
    const cookieStore = cookies()
    const referralCookie = cookieStore.get('vm_ref')
    
    if (!referralCookie) {
      return { success: false, message: '紹介情報が見つかりません' }
    }

    let referralData
    try {
      referralData = JSON.parse(referralCookie.value)
    } catch (error) {
      console.error('Invalid referral cookie format:', error)
      return { success: false, message: '無効な紹介情報です' }
    }

    // 48時間以内の紹介のみ有効
    const now = Date.now()
    const referralTime = referralData.timestamp || 0
    const timeDiff = now - referralTime
    const maxAge = 48 * 60 * 60 * 1000 // 48時間

    if (timeDiff > maxAge) {
      // 古いCookieを削除
      cookieStore.delete('vm_ref')
      return { success: false, message: '紹介情報の有効期限が切れています' }
    }

    const { ref, src, pid } = referralData

    if (!ref || !src || !pid) {
      return { success: false, message: '不完全な紹介情報です' }
    }

    const supabase = createClient()

    // 現在のユーザーを取得
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { success: false, message: '認証が必要です' }
    }

    // 紹介を確定
    const { error: claimError } = await supabase.rpc('claim_referral', {
      p_referrer: ref,
      p_project: pid,
      p_source: src
    })

    if (claimError) {
      console.error('Claim referral error:', claimError)
      // エラーが発生してもCookieは削除（重複防止のため）
      cookieStore.delete('vm_ref')
      return { success: false, message: '紹介の確定に失敗しました' }
    }

    // 成功時にCookieを削除
    cookieStore.delete('vm_ref')

    return { success: true, message: '紹介が確定されました' }
  } catch (error) {
    console.error('Claim referral error:', error)
    return { success: false, message: '予期しないエラーが発生しました' }
  }
} 