import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!url || !key) {
    console.error('Missing Supabase env: NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY')
    return supabaseResponse
  }

  const supabase = createServerClient(url, key, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value
      },
      set(name: string, value: string, options: any) {
        request.cookies.set(name, value)
        supabaseResponse = NextResponse.next({
          request,
        })
        supabaseResponse.cookies.set(name, value, options)
      },
      remove(name: string, options: any) {
        request.cookies.set(name, '')
        supabaseResponse = NextResponse.next({
          request,
        })
        supabaseResponse.cookies.set(name, '', { ...options, maxAge: 0 })
      },
    }
  })

  // 紹介パラメータの処理
  const { searchParams } = request.nextUrl
  const ref = searchParams.get('ref')
  const src = searchParams.get('src')
  const pid = searchParams.get('pid')

  // 紹介パラメータが存在する場合、Cookieに保存
  if (ref || src || pid) {
    const referralData = {
      ref: ref || null,
      src: src || null,
      pid: pid || null,
      timestamp: Date.now()
    }

    // 48時間有効なCookieを設定
    supabaseResponse.cookies.set('vm_ref', JSON.stringify(referralData), {
      maxAge: 48 * 60 * 60, // 48時間
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    })
  }

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Admin routes protection
  if (request.nextUrl.pathname.startsWith('/admin')) {
    if (!user) {
      // Not authenticated - redirect to not-found
      return NextResponse.redirect(new URL('/not-found', request.url))
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!profile?.is_admin) {
      // Not admin - redirect to not-found
      return NextResponse.redirect(new URL('/not-found', request.url))
    }
  }

  if (
    !user &&
    (request.nextUrl.pathname.startsWith('/projects') ||
      request.nextUrl.pathname.startsWith('/api'))
  ) {
    // Allow access to public routes even when not authenticated
    return supabaseResponse
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
} 