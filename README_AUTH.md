# Next.js 14 + Supabase Cookieベースセッション管理

このプロジェクトでは、Next.js 14とSupabaseを使用したCookieベースのセッション管理を実装しています。

## 🎯 目的

- **未ログイン**: 閲覧可能
- **ログイン**: 投稿可能（コメント/進捗/参加温度）
- **再訪問時にセッションが維持される**（毎回サインイン不要）

## 🏗️ 実装構成

### 1. Supabaseクライアント設定

#### `lib/supabaseServer.ts`
サーバーサイド用のSupabaseクライアント
```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createClient() {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Componentからの呼び出しは無視
          }
        },
      },
    }
  )
}
```

#### `lib/supabaseBrowser.ts`
ブラウザ用のSupabaseクライアント
```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return document.cookie
            .split('; ')
            .find((row) => row.startsWith(`${name}=`))
            ?.split('=')[1]
        },
        set(name: string, value: string, options) {
          document.cookie = `${name}=${value}; path=${options.path || '/'}; max-age=${options.maxAge || 31536000}; samesite=${options.sameSite || 'lax'}${options.secure ? '; secure' : ''}`
        },
        remove(name: string, options) {
          document.cookie = `${name}=; path=${options.path || '/'}; expires=Thu, 01 Jan 1970 00:00:00 GMT`
        },
      },
    }
  )
}
```

### 2. ミドルウェア設定

#### `middleware.ts`
セッションの自動リフレッシュとルート保護
```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // セッションの自動リフレッシュ
  const { data: { user } } = await supabase.auth.getUser()

  return supabaseResponse
}
```

### 3. 認証コンポーネント

#### `components/AuthButton.tsx`
Google OAuthログイン/ログアウトボタン
- ログイン状態の表示
- Google OAuth認証
- ログアウト機能
- トースト通知

#### `components/AuthGuard.tsx`
認証が必要なコンテンツの保護
- 未認証時のフォールバック表示
- ログインモーダル
- 認証状態の監視

#### `hooks/useAuth.ts`
認証状態管理フック
```typescript
export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    // 初期ユーザー状態を取得
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setIsLoading(false)
    }
    getUser()

    // 認証状態の変更を監視
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase.auth])

  return { user, isLoading, supabase }
}
```

### 4. 使用例コンポーネント

#### `components/CommentForm.tsx`
認証が必要なコメント投稿フォーム
- AuthGuardによる保護
- 未認証時のフォールバック表示
- 投稿成功時のトースト通知

#### `components/ProgressUpdate.tsx`
認証が必要な進捗更新フォーム
- 進捗内容と完了率の入力
- AuthGuardによる保護

#### `components/ParticipationThermometer.tsx`
参加温度投票コンポーネント
- 3段階の投票（冷めている/普通/熱い！）
- リアルタイム統計表示
- ユーザー別投票状態の管理

## 🔧 環境設定

### 1. 環境変数

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_SITE_URL=http://localhost:3000  # 開発環境
# NEXT_PUBLIC_SITE_URL=https://your-domain.com  # 本番環境
```

### 2. Supabase設定

1. **Authentication → Providers → Google** を有効化
2. **Site URL** を本番URLに設定
3. **Redirect URLs** に以下を追加：
   - `http://localhost:3000/auth/callback` (開発環境)
   - `https://your-domain.com/auth/callback` (本番環境)

### 3. データベーススキーマ

```sql
-- コメントテーブル
CREATE TABLE comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 進捗更新テーブル
CREATE TABLE progress_updates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  percentage INTEGER NOT NULL CHECK (percentage >= 0 AND percentage <= 100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 参加温度投票テーブル
CREATE TABLE participation_votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  temperature_level TEXT NOT NULL CHECK (temperature_level IN ('cold', 'warm', 'hot')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);
```

## 🚀 使用方法

### 1. 認証ボタンの配置

```tsx
import AuthButton from '@/components/AuthButton'

// ヘッダーなどに配置
<AuthButton onAuthChange={(user) => console.log('認証状態が変更されました:', user)} />
```

### 2. 保護されたコンテンツの実装

```tsx
import AuthGuard from '@/components/AuthGuard'

// 認証が必要なコンテンツを保護
<AuthGuard
  fallback={
    <div className="p-4 bg-gray-50 rounded-lg">
      <p>ログインが必要です</p>
      <AuthButton />
    </div>
  }
>
  <ProtectedContent />
</AuthGuard>
```

### 3. 認証状態の取得

```tsx
import { useAuth } from '@/hooks/useAuth'

function MyComponent() {
  const { user, isLoading } = useAuth()

  if (isLoading) return <div>読み込み中...</div>
  
  return (
    <div>
      {user ? (
        <p>ようこそ、{user.user_metadata?.full_name}さん！</p>
      ) : (
        <p>ログインしてください</p>
      )}
    </div>
  )
}
```

## 🎨 UX/UI の特徴

### 1. トースト通知
- `react-hot-toast`を使用
- ログイン/ログアウト時の成功通知
- エラー時の適切なフィードバック

### 2. ローディング状態
- 認証状態の読み込み中表示
- フォーム送信中の無効化

### 3. モーダル認証
- 未認証時のログインモーダル
- スムーズな認証フロー

### 4. レスポンシブデザイン
- Tailwind CSSによる美しいUI
- モバイル対応

## 🔒 セキュリティ

### 1. Row Level Security (RLS)
- データベースレベルでのアクセス制御
- ユーザーは自分のデータのみ操作可能

### 2. Cookie設定
- セキュアなCookie設定
- SameSite属性の適切な設定

### 3. 認証状態の検証
- サーバーサイドでの認証状態確認
- クライアントサイドでの状態管理

## 📱 動作確認

1. 開発サーバーを起動
```bash
npm run dev
```

2. `/example` ページにアクセス
3. 未ログイン状態でコンテンツを確認
4. Googleでログイン
5. 投稿機能をテスト
6. ブラウザをリフレッシュしてセッション維持を確認

## 🎯 実装のポイント

1. **@supabase/ssr** を使用した最新のSSR対応
2. **Cookieベース** のセッション管理でUX向上
3. **ミドルウェア** による自動セッションリフレッシュ
4. **AuthGuard** による柔軟な認証制御
5. **トースト通知** による適切なフィードバック
6. **TypeScript** による型安全性

この実装により、ユーザーフレンドリーで安全な認証システムを構築できます。 