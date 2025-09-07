'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabaseBrowser'
import {
  buildReferralUrl,
  shareToLine,
  shareToLinkedIn,
  shareToInstagram,
  copyToClipboard,
  ShareData
} from '@/lib/share'
import InstagramModal from './InstagramModal'
import { awardShareBadge } from '@/lib/badges'
import toast from 'react-hot-toast'

interface ShareButtonsProps {
  projectId: string
  projectTitle: string
  projectDescription?: string
}

export default function ShareButtons({
  projectId,
  projectTitle,
  projectDescription = ''
}: ShareButtonsProps) {
  const [userId, setUserId] = useState<string | null>(null)
  const [showInstagramModal, setShowInstagramModal] = useState(false)
  const [copySuccess, setCopySuccess] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    // ユーザーIDを取得
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUserId(user?.id || null)
    }
    getUser()

    // Instagramモーダルイベントリスナー
    const handleShowInstagramModal = () => setShowInstagramModal(true)
    window.addEventListener('showInstagramModal', handleShowInstagramModal)
    
    return () => {
      window.removeEventListener('showInstagramModal', handleShowInstagramModal)
    }
  }, [supabase.auth])

  const createShareData = (source: string): ShareData => {
    const url = buildReferralUrl(projectId, userId || undefined, source).toString()
    return {
      url,
      title: projectTitle,
      text: projectDescription || `Vision Matesのプロジェクト「${projectTitle}」をチェックしてみてください！`
    }
  }

  const handleShare = async (source: string) => {
    if (userId) {
      const badgeAwarded = await awardShareBadge(userId)
      if (badgeAwarded) {
        toast.success('🏆 初シェアバッジを獲得しました！')
      }
    }
  }

  const handleCopy = async () => {
    const shareData = createShareData('copy')
    const success = await copyToClipboard(shareData.url)
    if (success) {
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
      await handleShare('copy')
    }
  }

  const handleLineShare = async () => {
    const shareData = createShareData('line')
    shareToLine(shareData.url)
    await handleShare('line')
  }

  const handleLinkedInShare = async () => {
    const shareData = createShareData('linkedin')
    shareToLinkedIn(shareData.url)
    await handleShare('linkedin')
  }

  const handleInstagramShare = async () => {
    const shareData = createShareData('webshare')
    await shareToInstagram(shareData)
    await handleShare('instagram')
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={handleCopy}
          className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          {copySuccess ? 'コピー完了！' : 'リンクをコピー'}
        </button>

        <button
          onClick={handleLineShare}
          className="inline-flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
        >
          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
          </svg>
          LINEで共有
        </button>

        <button
          onClick={handleLinkedInShare}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
          </svg>
          LinkedInで共有
        </button>

        <button
          onClick={handleInstagramShare}
          className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-colors"
        >
          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
          </svg>
          Instagramで共有
        </button>
      </div>

      <InstagramModal
        isOpen={showInstagramModal}
        onClose={() => setShowInstagramModal(false)}
      />
    </>
  )
} 