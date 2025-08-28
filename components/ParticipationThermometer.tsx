'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabaseBrowser'
import { useAuth } from '@/hooks/useAuth'
import AuthGuard from './AuthGuard'
import AuthButton from './AuthButton'
import toast from 'react-hot-toast'

interface ParticipationThermometerProps {
  projectId: string
}

type TemperatureLevel = 'cold' | 'warm' | 'hot'

const temperatureLabels = {
  cold: '冷めている',
  warm: '普通',
  hot: '熱い！'
}

const temperatureColors = {
  cold: 'bg-blue-500',
  warm: 'bg-yellow-500',
  hot: 'bg-red-500'
}

export default function ParticipationThermometer({ projectId }: ParticipationThermometerProps) {
  const [selectedTemperature, setSelectedTemperature] = useState<TemperatureLevel | null>(null)
  const [userVote, setUserVote] = useState<TemperatureLevel | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [stats, setStats] = useState({ cold: 0, warm: 0, hot: 0, total: 0 })
  const { user } = useAuth()
  const supabase = createClient()

  useEffect(() => {
    loadStats()
    if (user) {
      loadUserVote()
    }
  }, [user, projectId])

  const loadStats = async () => {
    try {
      const { data, error } = await supabase
        .from('participation_votes')
        .select('temperature_level')
        .eq('project_id', projectId)

      if (error) throw error

      const counts = { cold: 0, warm: 0, hot: 0, total: 0 }
      data?.forEach(vote => {
        counts[vote.temperature_level as TemperatureLevel]++
        counts.total++
      })
      setStats(counts)
    } catch (error) {
      console.error('統計の読み込みに失敗しました:', error)
    }
  }

  const loadUserVote = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('participation_votes')
        .select('temperature_level')
        .eq('project_id', projectId)
        .eq('user_id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') throw error
      setUserVote(data?.temperature_level || null)
    } catch (error) {
      console.error('ユーザー投票の読み込みに失敗しました:', error)
    }
  }

  const handleVote = async (temperature: TemperatureLevel) => {
    if (!user) return

    setIsSubmitting(true)
    try {
      const { error } = await supabase
        .from('participation_votes')
        .upsert({
          project_id: projectId,
          user_id: user.id,
          temperature_level: temperature,
        })

      if (error) throw error

      setUserVote(temperature)
      toast.success('投票しました！')
      loadStats()
    } catch (error: any) {
      toast.error(error.message || '投票に失敗しました')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getPercentage = (count: number) => {
    return stats.total > 0 ? Math.round((count / stats.total) * 100) : 0
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900">参加温度</h3>
      
      <AuthGuard
        fallback={
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-600 mb-3">
              投票するにはログインが必要です
            </p>
            <AuthButton />
          </div>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            このプロジェクトへの参加意欲を教えてください
          </p>
          
          <div className="flex gap-2">
            {(['cold', 'warm', 'hot'] as TemperatureLevel[]).map((temp) => (
              <button
                key={temp}
                onClick={() => handleVote(temp)}
                disabled={isSubmitting}
                className={`flex-1 py-3 px-4 rounded-lg border-2 transition-all ${
                  userVote === temp
                    ? `${temperatureColors[temp]} text-white border-transparent`
                    : 'bg-white border-gray-300 hover:border-gray-400'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <div className="text-center">
                  <div className="text-lg font-medium">{temperatureLabels[temp]}</div>
                  <div className="text-sm opacity-75">
                    {getPercentage(stats[temp])}%
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </AuthGuard>

      {/* 統計表示 */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-medium text-gray-700 mb-3">投票結果</h4>
        <div className="space-y-2">
          {(['cold', 'warm', 'hot'] as TemperatureLevel[]).map((temp) => (
            <div key={temp} className="flex items-center justify-between">
              <span className="text-sm text-gray-600">{temperatureLabels[temp]}</span>
              <div className="flex items-center gap-2">
                <div className="w-20 bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${temperatureColors[temp]}`}
                    style={{ width: `${getPercentage(stats[temp])}%` }}
                  />
                </div>
                <span className="text-sm text-gray-500 w-8 text-right">
                  {stats[temp]}
                </span>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 pt-3 border-t border-gray-200">
          <span className="text-sm text-gray-500">
            総投票数: {stats.total}票
          </span>
        </div>
      </div>
    </div>
  )
} 