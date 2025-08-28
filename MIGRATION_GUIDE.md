# Vision Mates - 移行ガイド

## 概要
現在のNext.jsプロジェクトから、Expo/React Native移行を考慮したmonorepo構成への移行手順を説明します。

## 📋 移行前の準備

### 1. 現在のプロジェクト構造の確認
```bash
# 現在のディレクトリ構造を確認
tree -I 'node_modules|.next|.git' -a
```

### 2. 依存関係の整理
```bash
# 現在の依存関係を確認
npm list --depth=0
```

### 3. 環境変数の整理
```bash
# 現在の環境変数を確認
cat .env.example
```

## 🚀 移行手順

### Step 1: Monorepo構造の作成

```bash
# 1. 新しいディレクトリ構造を作成
mkdir -p apps/web apps/mobile packages/{ui,types,api,store,utils} tools docs

# 2. 現在のNext.jsプロジェクトをapps/webに移動
mv app apps/web/
mv components apps/web/
mv lib apps/web/
mv hooks apps/web/
mv types apps/web/
mv middleware.ts apps/web/
mv next.config.js apps/web/
mv next-env.d.ts apps/web/
mv postcss.config.js apps/web/
mv tailwind.config.ts apps/web/
mv tsconfig.json apps/web/tsconfig.json.backup
```

### Step 2: ルート設定ファイルの作成

#### turbo.json
```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env.*local"],
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**", "dist/**"]
    },
    "lint": {
      "dependsOn": ["^lint"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "test": {
      "dependsOn": ["^build"],
      "outputs": ["coverage/**"]
    }
  }
}
```

#### ルートpackage.json
```json
{
  "name": "vision-mates",
  "version": "0.1.0",
  "private": true,
  "workspaces": [
    "apps/*",
    "packages/*"
  ],
  "scripts": {
    "build": "turbo run build",
    "dev": "turbo run dev",
    "lint": "turbo run lint",
    "test": "turbo run test",
    "clean": "turbo run clean",
    "format": "prettier --write \"**/*.{ts,tsx,md}\"",
    "type-check": "turbo run type-check"
  },
  "devDependencies": {
    "@turbo/gen": "^1.10.0",
    "turbo": "^1.10.0",
    "prettier": "^3.1.0",
    "eslint": "^8",
    "typescript": "^5"
  },
  "packageManager": "npm@9.0.0"
}
```

### Step 3: 共通パッケージの作成

#### packages/types/package.json
```json
{
  "name": "@vision-mates/types",
  "version": "0.1.0",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch",
    "lint": "eslint ."
  },
  "dependencies": {
    "zod": "^3.22.4"
  },
  "devDependencies": {
    "typescript": "^5",
    "tsup": "^7.0.0"
  }
}
```

#### packages/types/src/index.ts
```typescript
// 既存のtypesディレクトリから型定義を移行
export * from './auth'
export * from './projects'
export * from './api'
export * from './routes'
```

### Step 4: UIパッケージの作成

#### packages/ui/package.json
```json
{
  "name": "@vision-mates/ui",
  "version": "0.1.0",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch",
    "lint": "eslint ."
  },
  "dependencies": {
    "react": "^18",
    "react-native": "0.72.6",
    "react-native-web": "^0.19.0",
    "@tamagui/core": "^1.74.0",
    "@tamagui/config": "^1.74.0"
  },
  "devDependencies": {
    "@types/react": "^18",
    "@types/react-native": "^0.72.0",
    "typescript": "^5",
    "tsup": "^7.0.0"
  },
  "peerDependencies": {
    "react": "^18",
    "react-native": ">=0.72.0"
  }
}
```

### Step 5: APIパッケージの作成

#### packages/api/package.json
```json
{
  "name": "@vision-mates/api",
  "version": "0.1.0",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch",
    "lint": "eslint ."
  },
  "dependencies": {
    "@vision-mates/types": "workspace:*",
    "@supabase/supabase-js": "^2.39.0",
    "zod": "^3.22.4"
  },
  "devDependencies": {
    "typescript": "^5",
    "tsup": "^7.0.0"
  }
}
```

### Step 6: Webアプリの更新

#### apps/web/package.json
```json
{
  "name": "@vision-mates/web",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "@vision-mates/ui": "workspace:*",
    "@vision-mates/types": "workspace:*",
    "@vision-mates/api": "workspace:*",
    "@vision-mates/store": "workspace:*",
    "@vision-mates/utils": "workspace:*",
    "next": "14.0.4",
    "react": "^18",
    "react-dom": "^18",
    "@supabase/ssr": "^0.1.0",
    "@supabase/supabase-js": "^2.39.0"
  },
  "devDependencies": {
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "typescript": "^5",
    "tailwindcss": "^3.3.0",
    "autoprefixer": "^10.0.1",
    "postcss": "^8"
  }
}
```

### Step 7: Mobileアプリの作成

#### apps/mobile/package.json
```json
{
  "name": "@vision-mates/mobile",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "start": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "web": "expo start --web",
    "build": "expo build",
    "lint": "eslint ."
  },
  "dependencies": {
    "@vision-mates/ui": "workspace:*",
    "@vision-mates/types": "workspace:*",
    "@vision-mates/api": "workspace:*",
    "@vision-mates/store": "workspace:*",
    "@vision-mates/utils": "workspace:*",
    "expo": "~49.0.0",
    "expo-router": "^2.0.0",
    "react": "18.2.0",
    "react-native": "0.72.6",
    "@supabase/supabase-js": "^2.39.0",
    "react-native-url-polyfill": "^2.0.0"
  },
  "devDependencies": {
    "@babel/core": "^7.20.0",
    "@types/react": "~18.2.14",
    "typescript": "^5.1.3"
  }
}
```

### Step 8: 既存コンポーネントの移行

#### 1. 共通コンポーネントの特定
```bash
# 既存のコンポーネントを分析
find apps/web/components -name "*.tsx" -exec grep -l "onClick\|onSubmit" {} \;
```

#### 2. プラットフォーム非依存化
```typescript
// 移行前: Web固有
interface ButtonProps {
  onClick: () => void;
  children: React.ReactNode;
}

// 移行後: プラットフォーム非依存
interface ButtonProps {
  onPress: () => void;
  title: string;
  variant?: 'primary' | 'secondary';
}
```

#### 3. スタイリングの統一
```typescript
// 移行前: Tailwind CSS
<button className="px-4 py-2 bg-blue-500 text-white rounded-lg">
  Click me
</button>

// 移行後: Tamagui
<Button onPress={handlePress} variant="primary">
  <Text color="white">Click me</Text>
</Button>
```

### Step 9: ルーティングの対応付け

#### packages/types/src/routes.ts
```typescript
export const routeMappings = {
  'projects.detail': {
    web: '/projects/[id]',
    mobile: '/(tabs)/projects/[id]',
  },
  'projects.edit': {
    web: '/projects/[id]/edit',
    mobile: '/(tabs)/projects/[id]/edit',
  },
  'profile': {
    web: '/profile',
    mobile: '/(tabs)/profile',
  },
} as const;

export type RouteName = keyof typeof routeMappings;
```

### Step 10: 環境変数の整理

#### .env.example
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# API
NEXT_PUBLIC_API_URL=http://localhost:3000/api

# Auth
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=http://localhost:3000

# Database
DATABASE_URL=your-database-url
```

## 🔄 段階的移行戦略

### Phase 1: 基盤構築（1-2週間）
- [ ] Monorepo構造の作成
- [ ] 共通パッケージの基本設定
- [ ] 既存コードの移動
- [ ] 基本的なビルド設定

### Phase 2: 共通化（2-3週間）
- [ ] 型定義の共通化
- [ ] APIクライアントの抽象化
- [ ] 基本的なUIコンポーネントの作成
- [ ] 状態管理の統一

### Phase 3: 最適化（1-2週間）
- [ ] パフォーマンス最適化
- [ ] テストの追加
- [ ] ドキュメントの整備
- [ ] CI/CD設定

### Phase 4: Mobile対応（2-3週間）
- [ ] Expoプロジェクトの作成
- [ ] ルーティングの対応付け
- [ ] プラットフォーム固有機能の実装
- [ ] クロスプラットフォームテスト

## 🧪 テスト戦略

### 1. 既存テストの移行
```bash
# 既存のテストを確認
find . -name "*.test.*" -o -name "*.spec.*"
```

### 2. 新しいテストの追加
```typescript
// packages/ui/src/components/__tests__/Button.test.tsx
import { render, fireEvent } from '@testing-library/react'
import { Button } from '../Button'

describe('Button', () => {
  it('should render correctly', () => {
    const { getByText } = render(
      <Button onPress={() => {}} title="Test Button" />
    )
    expect(getByText('Test Button')).toBeInTheDocument()
  })

  it('should call onPress when pressed', () => {
    const onPress = jest.fn()
    const { getByText } = render(
      <Button onPress={onPress} title="Test Button" />
    )
    fireEvent.click(getByText('Test Button'))
    expect(onPress).toHaveBeenCalled()
  })
})
```

## 🚀 デプロイ設定

### Web（Vercel）
```json
// vercel.json
{
  "buildCommand": "npm run build --filter=@vision-mates/web",
  "outputDirectory": "apps/web/.next",
  "installCommand": "npm install"
}
```

### Mobile（EAS Build）
```json
// apps/mobile/eas.json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {}
  }
}
```

## 📊 移行チェックリスト

### 準備段階
- [ ] 現在のプロジェクト構造の分析
- [ ] 依存関係の整理
- [ ] 環境変数の整理
- [ ] バックアップの作成

### 実装段階
- [ ] Monorepo構造の作成
- [ ] 共通パッケージの設定
- [ ] 既存コードの移行
- [ ] プラットフォーム非依存化
- [ ] テストの移行・追加

### 検証段階
- [ ] ビルドの確認
- [ ] テストの実行
- [ ] 開発サーバーの起動
- [ ] 機能の動作確認
- [ ] パフォーマンスの測定

### 完了段階
- [ ] ドキュメントの更新
- [ ] CI/CD設定の更新
- [ ] チームへの移行完了報告
- [ ] 今後の開発方針の共有

## 🐛 よくある問題と解決策

### 1. 依存関係のエラー
```bash
# 解決策: node_modulesを削除して再インストール
rm -rf node_modules
npm install
```

### 2. TypeScriptパスの解決エラー
```bash
# 解決策: tsconfig.jsonのpaths設定を確認
# ルートのtsconfig.jsonでパスエイリアスを設定
```

### 3. ビルドエラー
```bash
# 解決策: パッケージのビルド順序を確認
npm run build --filter=@vision-mates/types
npm run build --filter=@vision-mates/ui
npm run build --filter=@vision-mates/web
```

### 4. 開発サーバーの起動エラー
```bash
# 解決策: ポートの競合を確認
lsof -ti:3000 | xargs kill -9
npm run dev
```

---

この移行ガイドに従うことで、現在のNext.jsプロジェクトからmonorepo構成への移行を安全かつ効率的に行うことができます。 