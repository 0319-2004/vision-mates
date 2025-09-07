'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
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
  const [showAuthOptions, setShowAuthOptions] = useState(false)
  const [phoneNumber, setPhoneNumber] = useState('')
  const [otp, setOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const supabase = createClient()

  const createUserProfile = useCallback(async (user: User) => {
    try {
      // 既存のプロフィールをチェック
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single()

      if (existingProfile) {
        return // プロフィールが既に存在する場合は何もしない
      }

      // 新しいプロフィールを作成
      const profileData = {
        id: user.id,
        display_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'ユーザー',
        bio: 'こんにちは！VisionMatesへようこそ！',
        skills: ['プログラミング', 'デザイン', 'マーケティング'],
        avatar_url: user.user_metadata?.avatar_url || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const { error } = await supabase
        .from('profiles')
        .insert(profileData)

      if (error) {
        console.log('Profile creation failed:', error)
        // デモモードでプロフィールを作成
        const localProfiles = localStorage.getItem('visionmates_profiles')
        let profiles = []
        if (localProfiles) {
          try {
            profiles = JSON.parse(localProfiles)
          } catch (e) {
            console.log('Failed to parse existing profiles:', e)
          }
        }
        profiles.push(profileData)
        localStorage.setItem('visionmates_profiles', JSON.stringify(profiles))
      } else {
        console.log('Profile created successfully')
      }
    } catch (error) {
      console.log('Profile creation failed:', error)
    }
  }, [supabase])

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
          toast.success('LOGIN SUCCESS!')
          // 初回ログイン時にプロフィールを作成
          if (session?.user) {
            await createUserProfile(session.user)
          }
        } else if (event === 'SIGNED_OUT') {
          toast.success('LOGOUT COMPLETE')
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase.auth, onAuthChange, createUserProfile])

  

  const handleGoogleLogin = async () => {
    setIsLoading(true)
    try {
      // まずSupabaseの接続をテスト
      const { data: { user: existingUser } } = await supabase.auth.getUser()
      
      if (existingUser) {
        setUser(existingUser)
        toast.success('ログインしました')
        setIsLoading(false)
        return
      }

      // Supabaseの接続をテスト
      const { error: testError } = await supabase
        .from('projects')
        .select('id')
        .limit(1)

      if (testError) {
        console.log('Supabase connection failed, using demo mode:', testError)
        // デモモードでログイン
        const demoUser = {
          id: 'demo-user',
          email: 'demo@example.com',
          user_metadata: {
            full_name: 'デモユーザー',
            avatar_url: null
          }
        }
        setUser(demoUser as any)
        toast.success('デモモードでログインしました')
        setIsLoading(false)
        return
      }

      // Supabaseが利用可能な場合はOAuthを試行
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      
      if (error) {
        console.log('OAuth login failed, using demo mode:', error)
        const demoUser = {
          id: 'demo-user',
          email: 'demo@example.com',
          user_metadata: {
            full_name: 'デモユーザー',
            avatar_url: null
          }
        }
        setUser(demoUser as any)
        toast.success('デモモードでログインしました')
      }
    } catch (error: any) {
      console.log('Login failed, using demo mode:', error)
      const demoUser = {
        id: 'demo-user',
        email: 'demo@example.com',
        user_metadata: {
          full_name: 'デモユーザー',
          avatar_url: null
        }
      }
      setUser(demoUser as any)
      toast.success('デモモードでログインしました')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePhoneLogin = async () => {
    if (!phoneNumber.trim()) {
      toast.error('電話番号を入力してください')
      return
    }

    setIsLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone: phoneNumber,
      })

      if (error) {
        console.log('Phone auth failed, using demo mode:', error)
        const demoUser = {
          id: 'demo-user',
          email: 'demo@example.com',
          user_metadata: {
            full_name: 'デモユーザー',
            avatar_url: null
          }
        }
        setUser(demoUser as any)
        toast.success('デモモードでログインしました')
        setShowAuthOptions(false)
        return
      }

      setOtpSent(true)
      toast.success('認証コードを送信しました')
    } catch (error: any) {
      console.log('Phone auth failed, using demo mode:', error)
      const demoUser = {
        id: 'demo-user',
        email: 'demo@example.com',
        user_metadata: {
          full_name: 'デモユーザー',
          avatar_url: null
        }
      }
      setUser(demoUser as any)
      toast.success('デモモードでログインしました')
      setShowAuthOptions(false)
    } finally {
      setIsLoading(false)
    }
  }

  const handleOtpVerification = async () => {
    if (!otp.trim()) {
      toast.error('認証コードを入力してください')
      return
    }

    setIsLoading(true)
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        phone: phoneNumber,
        token: otp,
        type: 'sms'
      })

      if (error) {
        console.log('OTP verification failed, using demo mode:', error)
        const demoUser = {
          id: 'demo-user',
          email: 'demo@example.com',
          user_metadata: {
            full_name: 'デモユーザー',
            avatar_url: null
          }
        }
        setUser(demoUser as any)
        toast.success('デモモードでログインしました')
        setShowAuthOptions(false)
        return
      }

      setUser(data.user)
      toast.success('ログインしました')
      setShowAuthOptions(false)
      setOtpSent(false)
      setPhoneNumber('')
      setOtp('')
    } catch (error: any) {
      console.log('OTP verification failed, using demo mode:', error)
      const demoUser = {
        id: 'demo-user',
        email: 'demo@example.com',
        user_metadata: {
          full_name: 'デモユーザー',
          avatar_url: null
        }
      }
      setUser(demoUser as any)
      toast.success('デモモードでログインしました')
      setShowAuthOptions(false)
    } finally {
      setIsLoading(false)
    }
  }

  const handleEmailAuth = async () => {
    if (!email.trim() || !password.trim()) {
      toast.error('メールアドレスとパスワードを入力してください')
      return
    }

    setIsLoading(true)
    try {
      let result
      if (isSignUp) {
        result = await supabase.auth.signUp({
          email: email.trim(),
          password: password.trim(),
        })
      } else {
        result = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password.trim(),
        })
      }

      if (result.error) {
        console.log('Email auth failed, using demo mode:', result.error)
        const demoUser = {
          id: 'demo-user',
          email: email.trim(),
          user_metadata: {
            full_name: 'デモユーザー',
            avatar_url: null
          }
        }
        setUser(demoUser as any)
        toast.success(isSignUp ? 'アカウントを作成しました（デモモード）' : 'ログインしました（デモモード）')
      } else {
        if (isSignUp) {
          toast.success('アカウントを作成しました！確認メールをチェックしてください。')
        } else {
          toast.success('ログインしました')
        }
      }
    } catch (error: any) {
      console.log('Email auth failed, using demo mode:', error)
      const demoUser = {
        id: 'demo-user',
        email: email.trim(),
        user_metadata: {
          full_name: 'デモユーザー',
          avatar_url: null
        }
      }
      setUser(demoUser as any)
      toast.success(isSignUp ? 'アカウントを作成しました（デモモード）' : 'ログインしました（デモモード）')
    } finally {
      setIsLoading(false)
      setEmail('')
      setPassword('')
      setShowAuthOptions(false)
    }
  }

  const handleLogout = async () => {
    setIsLoading(true)
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.log('Logout failed, using demo mode:', error)
      }
      // デモモードでもログアウト処理を実行
      setUser(null)
      toast.success('ログアウトしました')
    } catch (error: any) {
      console.log('Logout failed, using demo mode:', error)
      setUser(null)
      toast.success('ログアウトしました')
    } finally {
      setIsLoading(false)
    }
  }

  if (user) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="flex items-center gap-2">
          {user.user_metadata?.avatar_url && (
            <Image
              src={user.user_metadata.avatar_url}
              alt="プロフィール画像"
              width={24}
              height={24}
              sizes="24px"
              className="w-6 h-6 rounded border border-black"
            />
          )}
          <span className="font-pixel text-xs text-retro-lightGray">
            {user.user_metadata?.full_name || user.email}
          </span>
        </div>
        <button
          onClick={handleLogout}
          disabled={isLoading}
          className="retro-button retro-button-danger text-xs px-2 py-1 disabled:opacity-50"
        >
          {isLoading ? 'LOGOUT...' : 'LOGOUT'}
        </button>
      </div>
    )
  }

  if (showAuthOptions) {
    return (
      <div className={`retro-card bg-black border-2 border-retro-cyan p-4 ${className}`}>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="font-pixel text-xs text-retro-cyan">LOGIN OPTIONS</h3>
            <button
              onClick={() => setShowAuthOptions(false)}
              className="retro-button text-xs px-2 py-1"
            >
              CLOSE
            </button>
          </div>
          
          {!otpSent ? (
            <div className="space-y-2">
              <button
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="w-full retro-button retro-button-primary text-xs py-2 disabled:opacity-50"
              >
                {isLoading ? 'GOOGLE LOGIN...' : 'GOOGLE LOGIN'}
              </button>
              
              <div className="border-t border-retro-lightGray pt-2">
                <div className="flex gap-2 mb-2">
                  <button
                    onClick={() => setIsSignUp(false)}
                    className={`flex-1 retro-button text-xs py-1 ${!isSignUp ? 'retro-button-primary' : ''}`}
                  >
                    LOGIN
                  </button>
                  <button
                    onClick={() => setIsSignUp(true)}
                    className={`flex-1 retro-button text-xs py-1 ${isSignUp ? 'retro-button-primary' : ''}`}
                  >
                    SIGNUP
                  </button>
                </div>
                
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="メールアドレス"
                  className="retro-input w-full mb-2"
                />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="パスワード"
                  className="retro-input w-full mb-2"
                />
                <button
                  onClick={handleEmailAuth}
                  disabled={isLoading || !email.trim() || !password.trim()}
                  className="w-full retro-button retro-button-secondary text-xs py-2 disabled:opacity-50"
                >
                  {isLoading ? 'PROCESSING...' : (isSignUp ? 'SIGNUP' : 'LOGIN')}
                </button>
              </div>
              
              <div className="border-t border-retro-lightGray pt-2">
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="電話番号 (+81-90-1234-5678)"
                  className="retro-input w-full mb-2"
                />
                <button
                  onClick={handlePhoneLogin}
                  disabled={isLoading || !phoneNumber.trim()}
                  className="w-full retro-button retro-button-secondary text-xs py-2 disabled:opacity-50"
                >
                  {isLoading ? 'SENDING...' : 'SMS LOGIN'}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="font-pixel text-xs text-retro-lightGray">
                {phoneNumber} に認証コードを送信しました
              </p>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="認証コード"
                className="retro-input w-full"
              />
              <div className="flex space-x-2">
                <button
                  onClick={handleOtpVerification}
                  disabled={isLoading || !otp.trim()}
                  className="flex-1 retro-button retro-button-primary text-xs py-2 disabled:opacity-50"
                >
                  {isLoading ? 'VERIFYING...' : 'VERIFY'}
                </button>
                <button
                  onClick={() => setOtpSent(false)}
                  className="retro-button text-xs px-2 py-2"
                >
                  BACK
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <button
      onClick={() => setShowAuthOptions(true)}
      disabled={isLoading}
      className={`retro-button retro-button-primary text-xs px-3 py-1 disabled:opacity-50 ${className}`}
    >
      {isLoading ? 'LOGIN...' : 'LOGIN'}
    </button>
  )
}