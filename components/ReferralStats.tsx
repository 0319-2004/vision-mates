'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabaseBrowser'

interface ReferralStats {
  count: number
  badge: {
    level: string
    updated_at: string
  } | null
}

export default function ReferralStats() {
  const [stats, setStats] = useState<ReferralStats | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          setLoading(false)
          return
        }

        // 紹介数を取得
        const { data: invitations, error: invitationsError } = await supabase
          .from('invitations')
          .select('id')
          .eq('referrer_user_id', user.id)

        if (invitationsError) {
          console.error('Error fetching invitations:', invitationsError)
        }

        // バッジを取得
        const { data: badge, error: badgeError } = await supabase
          .from('referral_badges')
          .select('*')
          .eq('user_id', user.id)
          .single()

        if (badgeError && badgeError.code !== 'PGRST116') {
          console.error('Error fetching badge:', badgeError)
        }

        setStats({
          count: invitations?.length || 0,
          badge: badge
        })
      } catch (error) {
        console.error('Error fetching referral stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [supabase])

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-6 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    )
  }

  if (!stats) {
    return null
  }

  const getBadgeInfo = (level: string) => {
    switch (level) {
      case 'bronze':
        return {
          name: 'ブロンズ',
          color: 'bg-amber-500',
          icon: '🥉',
          requirement: '3人以上紹介'
        }
      case 'silver':
        return {
          name: 'シルバー',
          color: 'bg-gray-400',
          icon: '🥈',
          requirement: '10人以上紹介'
        }
      case 'gold':
        return {
          name: 'ゴールド',
          color: 'bg-yellow-500',
          icon: '🥇',
          requirement: '30人以上紹介'
        }
      default:
        return null
    }
  }

  const badgeInfo = stats.badge ? getBadgeInfo(stats.badge.level) : null

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">紹介統計</h3>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-gray-600">総紹介数</span>
          <span className="text-2xl font-bold text-blue-600">{stats.count}人</span>
        </div>

        {badgeInfo ? (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <div className={`w-12 h-12 ${badgeInfo.color} rounded-full flex items-center justify-center text-white text-xl`}>
                {badgeInfo.icon}
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">{badgeInfo.name}バッジ</h4>
                <p className="text-sm text-gray-600">{badgeInfo.requirement}</p>
                <p className="text-xs text-gray-500">
                  獲得日: {new Date(stats.badge!.updated_at).toLocaleDateString('ja-JP')}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center text-gray-500 text-xl">
                🎯
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">バッジ未獲得</h4>
                <p className="text-sm text-gray-600">
                  {stats.count < 3 
                    ? `あと${3 - stats.count}人紹介でブロンズバッジ獲得！`
                    : stats.count < 10
                    ? `あと${10 - stats.count}人紹介でシルバーバッジ獲得！`
                    : `あと${30 - stats.count}人紹介でゴールドバッジ獲得！`
                  }
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="text-xs text-gray-500">
          <p>• 1人につき1回のみカウントされます</p>
          <p>• 自己紹介はカウントされません</p>
        </div>
      </div>
    </div>
  )
} 