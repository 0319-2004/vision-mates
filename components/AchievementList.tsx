'use client'

import { UserAchievement } from '@/types'
import { getAchievement } from '@/lib/achievements'

interface AchievementListProps {
  achievements: UserAchievement[]
}

export default function AchievementList({ achievements }: AchievementListProps) {
  if (achievements.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 mb-4">まだ功績を獲得していません</p>
        <p className="text-sm text-gray-400">
          プロジェクトに参加したり、投稿したりして功績を獲得しましょう！
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {achievements.map((achievement) => {
        const achievementData = getAchievement(achievement.code)
        
        if (!achievementData) {
          return null
        }

        return (
          <div
            key={achievement.code}
            className={`p-4 rounded-lg border ${achievementData.color} bg-opacity-20`}
          >
            <div className="text-center">
              <div className="text-2xl mb-2">{achievementData.icon}</div>
              <h4 className="font-semibold text-sm mb-1">{achievementData.name}</h4>
              <p className="text-xs opacity-75">{achievementData.description}</p>
              <div className="text-xs opacity-60 mt-2">
                {new Date(achievement.earned_at).toLocaleDateString('ja-JP')}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
} 