// 共有機能用ユーティリティ

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

export interface ShareData {
  url: string
  title: string
  text: string
}

/**
 * 紹介URLを生成
 */
export function buildReferralUrl(
  projectId: string,
  refUserId?: string,
  source: string = 'copy'
): URL {
  const baseUrl = new URL(`${SITE_URL}/projects/${projectId}`)
  
  if (refUserId) {
    baseUrl.searchParams.set('ref', refUserId)
  }
  baseUrl.searchParams.set('src', source)
  baseUrl.searchParams.set('pid', projectId)
  
  return baseUrl
}

/**
 * LINEで共有
 */
export function shareToLine(url: string): void {
  const encodedUrl = encodeURIComponent(url)
  const lineUrl = `https://social-plugins.line.me/lineit/share?url=${encodedUrl}`
  window.open(lineUrl, '_blank', 'width=600,height=400')
}

/**
 * LinkedInで共有
 */
export function shareToLinkedIn(url: string): void {
  const encodedUrl = encodeURIComponent(url)
  const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`
  window.open(linkedinUrl, '_blank', 'width=600,height=400')
}

/**
 * Web Share APIを試行
 */
export async function tryWebShare(shareData: ShareData): Promise<boolean> {
  if (!navigator.share) {
    return false
  }

  try {
    await navigator.share(shareData)
    return true
  } catch (error) {
    console.log('Web Share API failed:', error)
    return false
  }
}

/**
 * クリップボードにコピー
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text)
      return true
    } else {
      // フォールバック
      const textArea = document.createElement('textarea')
      textArea.value = text
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      return true
    }
  } catch (error) {
    console.error('Copy to clipboard failed:', error)
    return false
  }
}

/**
 * Instagram共有（Web Share API + フォールバック）
 */
export async function shareToInstagram(shareData: ShareData): Promise<boolean> {
  // まずWeb Share APIを試行
  const success = await tryWebShare(shareData)
  if (success) {
    return true
  }

  // フォールバック: コピーリンク
  const copied = await copyToClipboard(shareData.url)
  if (copied) {
    // Instagramの使い方モーダルを表示するためのイベントを発火
    window.dispatchEvent(new CustomEvent('showInstagramModal'))
    return true
  }

  return false
} 