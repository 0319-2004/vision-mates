export interface Achievement {
  code: string
  name: string
  description: string
  icon: string
  color: string
}

export const ACHIEVEMENTS: Record<string, Achievement> = {
  first_post: {
    code: 'first_post',
    name: '初投稿',
    description: '初めて進捗を投稿しました',
    icon: '📝',
    color: 'bg-blue-100 text-blue-800'
  },
  first_collab: {
    code: 'first_collab',
    name: '初コラボ',
    description: '初めてスレッドに参加しました',
    icon: '🤝',
    color: 'bg-green-100 text-green-800'
  },
  referral_3: {
    code: 'referral_3',
    name: '紹介者',
    description: '3人を紹介しました',
    icon: '👥',
    color: 'bg-purple-100 text-purple-800'
  },
  referral_10: {
    code: 'referral_10',
    name: '紹介マスター',
    description: '10人を紹介しました',
    icon: '🌟',
    color: 'bg-yellow-100 text-yellow-800'
  },
  referral_30: {
    code: 'referral_30',
    name: '紹介伝説',
    description: '30人を紹介しました',
    icon: '👑',
    color: 'bg-red-100 text-red-800'
  },
  streak_7: {
    code: 'streak_7',
    name: '継続者',
    description: '7日連続で投稿しました',
    icon: '🔥',
    color: 'bg-orange-100 text-orange-800'
  },
  streak_30: {
    code: 'streak_30',
    name: '継続マスター',
    description: '30日連続で投稿しました',
    icon: '💎',
    color: 'bg-indigo-100 text-indigo-800'
  }
}

export function getAchievement(code: string): Achievement | undefined {
  return ACHIEVEMENTS[code]
}

export function getAllAchievements(): Achievement[] {
  return Object.values(ACHIEVEMENTS)
} 