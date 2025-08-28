'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabaseBrowser'
import { User } from '@supabase/supabase-js'
import toast from 'react-hot-toast'

interface AuthButtonProps {
  onAuthChange?: (user: User | null) => void
  className?: string
}

export default function AuthButton({ onAuthChange, className = '' }: AuthButtonProps) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    // 初期ユーザー状態を取得
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      onAuthChange?.(user)
    }
    getUser()

    // 認証状態の変更を監視
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session?.user?.email)
        setUser(session?.user ?? null)
        onAuthChange?.(session?.user ?? null)
        
        if (event === 'SIGNED_IN') {
          toast.success('ログインしました！')
        } else if (event === 'SIGNED_OUT') {
          toast.success('ログアウトしました')
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase.auth, onAuthChange])

  const handleGoogleLogin = async () => {
    setIsLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (error) throw error
    } catch (error: any) {
      console.error('Login error:', error)
      toast.error(error.message || 'ログインに失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = async () => {
    setIsLoading(true)
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    } catch (error: any) {
      console.error('Logout error:', error)
      toast.error(error.message || 'ログアウトに失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  if (user) {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <div className="flex items-center gap-2">
          {user.user_metadata?.avatar_url && (
            <img
              src={user.user_metadata.avatar_url}
              alt="プロフィール画像"
              className="w-8 h-8 rounded-full"
            />
          )}
          <span className="text-sm text-gray-700">
            {user.user_metadata?.full_name || user.email}
          </span>
        </div>
        <button
          onClick={handleLogout}
          disabled={isLoading}
          className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? 'ログアウト中...' : 'ログアウト'}
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={handleGoogleLogin}
      disabled={isLoading}
      className={`flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${className}`}
    >
      <svg className="w-5 h-5" viewBox="0 0 24 24">
        <path
          fill="currentColor"
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        />
        <path
          fill="currentColor"
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        />
        <path
          fill="currentColor"
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        />
        <path
          fill="currentColor"
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        />
      </svg>
      {isLoading ? 'ログイン中...' : 'Googleでログイン'}
    </button>
  )
} 