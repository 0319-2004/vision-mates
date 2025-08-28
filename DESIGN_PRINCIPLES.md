# Vision Mates - 設計原則（Expo/React Native移行対応）

## 概要
このドキュメントは、将来のExpo/React Native移行を考慮したコード・設計原則を定義します。

## 1. アーキテクチャ原則

### 1.1 レイヤー分離
```
┌─────────────────────────────────────┐
│           Presentation Layer        │
│  (Next.js App Router / Expo Router) │
├─────────────────────────────────────┤
│           Business Logic Layer      │
│        (Hooks, Services)            │
├─────────────────────────────────────┤
│           Data Access Layer         │
│        (Supabase, API Clients)      │
├─────────────────────────────────────┤
│           Infrastructure Layer      │
│        (Types, Utils, Config)       │
└─────────────────────────────────────┘
```

### 1.2 依存関係の方向
- 上位レイヤーは下位レイヤーに依存可能
- 下位レイヤーは上位レイヤーに依存禁止
- 横方向の依存関係は最小限に抑制

## 2. コンポーネント設計原則

### 2.1 プラットフォーム非依存コンポーネント
```typescript
// ✅ 良い例：プラットフォーム非依存
interface ButtonProps {
  onPress: () => void;
  title: string;
  variant?: 'primary' | 'secondary';
}

// ❌ 悪い例：Web固有の実装
interface ButtonProps {
  onClick: () => void; // Web固有
  children: React.ReactNode; // Web固有
}
```

### 2.2 スタイリング原則
- **デザイントークン化**: 色、サイズ、間隔をトークンとして定義
- **プラットフォーム適応**: `react-native-web`互換のスタイリング
- **テーマ分離**: ダークモード、ライトモード対応

```typescript
// デザイントークン例
export const tokens = {
  colors: {
    primary: '#007AFF',
    secondary: '#5856D6',
    background: '#FFFFFF',
    text: '#000000',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
  },
} as const;
```

## 3. データアクセス原則

### 3.1 API抽象化
```typescript
// packages/api/src/client.ts
export interface ApiClient {
  projects: {
    list: () => Promise<Project[]>;
    get: (id: string) => Promise<Project>;
    create: (data: CreateProjectData) => Promise<Project>;
  };
  auth: {
    signIn: (credentials: SignInCredentials) => Promise<AuthResult>;
    signOut: () => Promise<void>;
  };
}

// プラットフォーム固有の実装
export class WebApiClient implements ApiClient {
  // Web固有の実装
}

export class MobileApiClient implements ApiClient {
  // Mobile固有の実装
}
```

### 3.2 Supabase統合
```typescript
// packages/api/src/supabase.ts
export interface SupabaseConfig {
  url: string;
  anonKey: string;
  serviceRoleKey?: string;
}

export class SupabaseClient {
  private client: SupabaseClient;
  
  constructor(config: SupabaseConfig) {
    this.client = createClient(config.url, config.anonKey);
  }
  
  // 共通メソッド
  async getProjects(): Promise<Project[]> {
    const { data, error } = await this.client
      .from('projects')
      .select('*');
    
    if (error) throw error;
    return data;
  }
}
```

## 4. ルーティング設計

### 4.1 ルート命名規則
```typescript
// Web (Next.js App Router)
/web/projects/[id]          // プロジェクト詳細
/web/projects/[id]/edit     // プロジェクト編集
/web/profile                // プロフィール

// Mobile (Expo Router)
/mobile/(tabs)/projects/[id]    // プロジェクト詳細
/mobile/(tabs)/projects/[id]/edit // プロジェクト編集
/mobile/(tabs)/profile           // プロフィール
```

### 4.2 ルートマッピング
```typescript
// packages/types/src/routes.ts
export const routeMappings = {
  'projects.detail': {
    web: '/projects/[id]',
    mobile: '/(tabs)/projects/[id]',
  },
  'projects.edit': {
    web: '/projects/[id]/edit',
    mobile: '/(tabs)/projects/[id]/edit',
  },
} as const;
```

## 5. 状態管理原則

### 5.1 グローバル状態
- **Zustand**: 軽量でプラットフォーム非依存
- **React Query**: サーバー状態管理
- **ローカルストレージ**: AsyncStorage互換

```typescript
// packages/store/src/auth.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      login: (user) => set({ user, isAuthenticated: true }),
      logout: () => set({ user: null, isAuthenticated: false }),
    }),
    {
      name: 'auth-storage',
    }
  )
);
```

## 6. エラーハンドリング

### 6.1 統一エラー型
```typescript
// packages/types/src/errors.ts
export interface AppError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
```

### 6.2 エラー境界
```typescript
// packages/ui/src/ErrorBoundary.tsx
interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback: React.ComponentType<{ error: Error }>;
}

export function ErrorBoundary({ children, fallback: Fallback }: ErrorBoundaryProps) {
  // プラットフォーム非依存のエラー境界実装
}
```

## 7. テスト戦略

### 7.1 テストピラミッド
```
    ┌─────────────┐
    │   E2E Tests │ ← 少数（重要なユーザーフロー）
    ├─────────────┤
    │Integration  │ ← 中程度（API、データベース）
    │   Tests     │
    ├─────────────┤
    │  Unit Tests │ ← 多数（ビジネスロジック、ユーティリティ）
    └─────────────┘
```

### 7.2 テスト環境
- **Jest**: ユニットテスト
- **React Testing Library**: コンポーネントテスト
- **Playwright**: Web E2Eテスト
- **Detox**: Mobile E2Eテスト

## 8. パフォーマンス最適化

### 8.1 バンドルサイズ
- **Tree Shaking**: 未使用コードの除去
- **Code Splitting**: ルートベースの分割
- **Lazy Loading**: 動的インポート

### 8.2 画像最適化
```typescript
// packages/ui/src/Image.tsx
interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
}

export function OptimizedImage({ src, alt, width, height }: OptimizedImageProps) {
  // Web: Next.js Image
  // Mobile: Expo Image
  // 共通のフォールバック処理
}
```

## 9. セキュリティ原則

### 9.1 認証・認可
- **JWT**: トークンベース認証
- **RBAC**: ロールベースアクセス制御
- **環境変数**: 機密情報の分離

### 9.2 データ保護
- **入力検証**: Zodスキーマによる型安全
- **SQL Injection**: Supabaseのパラメータ化クエリ
- **XSS**: Reactの自動エスケープ

## 10. 移行チェックリスト

### 10.1 準備段階
- [ ] デザイントークンの定義
- [ ] API抽象化の実装
- [ ] プラットフォーム非依存コンポーネントの作成
- [ ] ルーティング設計の統一

### 10.2 実装段階
- [ ] Monorepo構成の構築
- [ ] 共通パッケージの作成
- [ ] プラットフォーム固有コードの分離
- [ ] テスト環境の整備

### 10.3 検証段階
- [ ] クロスプラットフォームテスト
- [ ] パフォーマンス測定
- [ ] セキュリティ監査
- [ ] ユーザビリティテスト

## 11. 推奨ツール・ライブラリ

### 11.1 コアライブラリ
- **TypeScript**: 型安全性
- **Zod**: スキーマ検証
- **Zustand**: 状態管理
- **React Query**: サーバー状態管理

### 11.2 UIライブラリ
- **Tamagui**: クロスプラットフォームUI
- **NativeWind**: Tailwind CSS for React Native
- **React Native Elements**: 豊富なコンポーネント

### 11.3 開発ツール
- **Turborepo**: Monorepo管理
- **ESLint**: コード品質
- **Prettier**: コードフォーマット
- **Husky**: Git hooks

---

この設計原則に従うことで、将来のExpo/React Native移行をスムーズに行うことができます。 