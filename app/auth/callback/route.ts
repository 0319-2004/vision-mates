import { createClient } from '@/lib/supabaseServer'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      if (!error) {
        return NextResponse.redirect(`${origin}${next}`)
      }
    } catch (error) {
      console.log('Auth callback error:', error)
    }
  }

  // エラーの場合はホームページにリダイレクト（デモモード）
  return NextResponse.redirect(`${origin}${next}`)
} 