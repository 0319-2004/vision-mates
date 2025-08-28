import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          if (typeof document === 'undefined') return undefined
          return document.cookie
            .split('; ')
            .find((row) => row.startsWith(`${name}=`))
            ?.split('=')[1]
        },
        set(name: string, value: string, options: { path?: string; maxAge?: number; domain?: string; sameSite?: string; secure?: boolean }) {
          if (typeof document === 'undefined') return
          document.cookie = `${name}=${value}; path=${options.path || '/'}; max-age=${options.maxAge || 31536000}; samesite=${options.sameSite || 'lax'}${options.secure ? '; secure' : ''}`
        },
        remove(name: string, options: { path?: string; domain?: string }) {
          if (typeof document === 'undefined') return
          document.cookie = `${name}=; path=${options.path || '/'}; expires=Thu, 01 Jan 1970 00:00:00 GMT`
        },
      },
    }
  )
} 