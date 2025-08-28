'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabaseBrowser'
import { User } from '@supabase/supabase-js'
import { Dialog } from '@headlessui/react'
import AuthButton from './AuthButton'

interface AuthGuardProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  showLoginModal?: boolean
}

export default function AuthGuard({ 
  children, 
  fallback,
  showLoginModal = true 
}: AuthGuardProps) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setIsLoading(false)
    }
    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        if (event === 'SIGNED_IN' && showModal) {
          setShowModal(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase.auth, showModal])

  const handleAuthChange = (user: User | null) => {
    setUser(user)
    if (user && showModal) {
      setShowModal(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    if (fallback) {
      return <>{fallback}</>
    }

    if (showLoginModal) {
      return (
        <>
          <div className="flex items-center justify-center p-8">
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              ログインして続行
            </button>
          </div>

          <Dialog
            open={showModal}
            onClose={() => setShowModal(false)}
            className="relative z-50"
          >
            <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
            
            <div className="fixed inset-0 flex items-center justify-center p-4">
              <Dialog.Panel className="mx-auto max-w-sm rounded-lg bg-white p-6">
                <Dialog.Title className="text-lg font-medium text-gray-900 mb-4">
                  ログインが必要です
                </Dialog.Title>
                <Dialog.Description className="text-sm text-gray-500 mb-6">
                  この機能を利用するにはログインしてください。
                </Dialog.Description>
                
                <div className="space-y-4">
                  <AuthButton onAuthChange={handleAuthChange} />
                  
                  <button
                    onClick={() => setShowModal(false)}
                    className="w-full px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    キャンセル
                  </button>
                </div>
              </Dialog.Panel>
            </div>
          </Dialog>
        </>
      )
    }

    return null
  }

  return <>{children}</>
} 