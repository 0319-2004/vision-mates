'use client'

interface StreakRingProps {
  streakDays: number
}

export default function StreakRing({ streakDays }: StreakRingProps) {
  const targetDays = 30
  const progress = Math.min((streakDays / targetDays) * 100, 100)
  const circumference = 2 * Math.PI * 45 // r=45
  const strokeDasharray = circumference
  const strokeDashoffset = circumference - (progress / 100) * circumference

  return (
    <div className="flex items-center justify-center space-x-8">
      {/* SVG円グラフ */}
      <div className="relative">
        <svg width="120" height="120" className="transform -rotate-90">
          {/* 背景円 */}
          <circle
            cx="60"
            cy="60"
            r="45"
            stroke="#e5e7eb"
            strokeWidth="8"
            fill="none"
          />
          {/* 進捗円 */}
          <circle
            cx="60"
            cy="60"
            r="45"
            stroke={progress > 0 ? "#3b82f6" : "#e5e7eb"}
            strokeWidth="8"
            fill="none"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        
        {/* 中央の数字 */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{streakDays}</div>
            <div className="text-sm text-gray-600">日</div>
          </div>
        </div>
      </div>

      {/* 情報 */}
      <div className="text-left">
        <h4 className="text-lg font-semibold text-gray-900 mb-2">
          {streakDays > 0 ? '連続投稿中！' : '投稿を始めよう'}
        </h4>
        <p className="text-gray-600 mb-3">
          {streakDays > 0 
            ? `${streakDays}日間連続で投稿しています`
            : '初めての投稿をしてみましょう'
          }
        </p>
        
        {streakDays > 0 && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">目標</span>
              <span className="font-medium">{targetDays}日</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <div className="text-xs text-gray-500 text-right">
              {Math.round(progress)}% 達成
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 