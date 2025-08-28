# Vision Mates - Monorepo構成サンプル

## 概要
Next.js + Expo の monorepo構成をTurborepoを使用して構築します。

## ディレクトリ構造

```
vision-mates/
├── apps/
│   ├── web/                    # Next.js Webアプリ
│   │   ├── app/               # App Router
│   │   ├── components/        # Web固有コンポーネント
│   │   ├── lib/              # Web固有ユーティリティ
│   │   ├── next.config.js
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── mobile/                # Expo Mobileアプリ
│       ├── app/              # Expo Router
│       ├── components/       # Mobile固有コンポーネント
│       ├── lib/             # Mobile固有ユーティリティ
│       ├── app.json
│       ├── package.json
│       └── tsconfig.json
│
├── packages/
│   ├── ui/                    # 共通UIコンポーネント
│   │   ├── src/
│   │   │   ├── components/
│   │   │   ├── tokens/
│   │   │   ├── themes/
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── types/                 # 共通型定義
│   │   ├── src/
│   │   │   ├── api/
│   │   │   ├── auth/
│   │   │   ├── projects/
│   │   │   ├── routes.ts
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── api/                   # APIクライアント
│   │   ├── src/
│   │   │   ├── clients/
│   │   │   ├── supabase/
│   │   │   ├── trpc/
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── store/                 # 状態管理
│   │   ├── src/
│   │   │   ├── auth/
│   │   │   ├── projects/
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── utils/                 # 共通ユーティリティ
│       ├── src/
│       │   ├── validation/
│       │   ├── formatting/
│       │   └── index.ts
│       ├── package.json
│       └── tsconfig.json
│
├── tools/                     # 開発ツール
│   ├── eslint-config/
│   ├── typescript-config/
│   └── tailwind-config/
│
├── docs/                      # ドキュメント
├── .github/                   # GitHub Actions
├── turbo.json                 # Turborepo設定
├── package.json              # ルートpackage.json
├── tsconfig.json             # ルートTypeScript設定
├── .eslintrc.js
├── .prettierrc
└── README.md
```

## パッケージ詳細

### apps/web (Next.js)
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

### apps/mobile (Expo)
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

### packages/ui (共通UI)
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

### packages/types (共通型)
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

### packages/api (APIクライアント)
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
    "@trpc/client": "^10.45.0",
    "@trpc/server": "^10.45.0",
    "zod": "^3.22.4"
  },
  "devDependencies": {
    "typescript": "^5",
    "tsup": "^7.0.0"
  }
}
```

### packages/store (状態管理)
```json
{
  "name": "@vision-mates/store",
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
    "zustand": "^4.4.0",
    "@tanstack/react-query": "^5.0.0"
  },
  "devDependencies": {
    "typescript": "^5",
    "tsup": "^7.0.0"
  }
}
```

### packages/utils (共通ユーティリティ)
```json
{
  "name": "@vision-mates/utils",
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
    "zod": "^3.22.4",
    "date-fns": "^2.30.0"
  },
  "devDependencies": {
    "typescript": "^5",
    "tsup": "^7.0.0"
  }
}
```

## ルート設定ファイル

### turbo.json
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

### ルートpackage.json
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

### ルートtsconfig.json
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["dom", "dom.iterable", "es6"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "baseUrl": ".",
    "paths": {
      "@vision-mates/ui": ["./packages/ui/src"],
      "@vision-mates/types": ["./packages/types/src"],
      "@vision-mates/api": ["./packages/api/src"],
      "@vision-mates/store": ["./packages/store/src"],
      "@vision-mates/utils": ["./packages/utils/src"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

## 環境変数管理

### .env.example
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

## 開発ワークフロー

### 1. セットアップ
```bash
# 依存関係のインストール
npm install

# パッケージのビルド
npm run build

# 開発サーバーの起動
npm run dev
```

### 2. 新しいパッケージの追加
```bash
# Turborepoジェネレーターを使用
npx turbo gen package

# または手動で作成
mkdir packages/new-package
cd packages/new-package
npm init -y
```

### 3. パッケージ間の依存関係
```bash
# ワークスペース内のパッケージを参照
npm install @vision-mates/ui --workspace=apps/web
```

### 4. ビルドとデプロイ
```bash
# 全パッケージのビルド
npm run build

# 特定のアプリのビルド
npm run build --filter=@vision-mates/web
```

## 推奨デザインシステム

### Tamagui（推奨）
```bash
# packages/ui/package.json
{
  "dependencies": {
    "@tamagui/core": "^1.74.0",
    "@tamagui/config": "^1.74.0",
    "@tamagui/animations-react-native": "^1.74.0",
    "@tamagui/font-inter": "^1.74.0",
    "@tamagui/theme-base": "^1.74.0"
  }
}
```

### NativeWind（代替案）
```bash
# packages/ui/package.json
{
  "dependencies": {
    "nativewind": "^2.0.0",
    "tailwindcss": "^3.3.0"
  }
}
```

## テスト戦略

### Jest設定
```javascript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapping: {
    '^@vision-mates/(.*)$': '<rootDir>/packages/$1/src',
  },
};
```

### E2Eテスト
```bash
# Web: Playwright
npm install -D @playwright/test

# Mobile: Detox
npm install -D detox
```

## CI/CD設定

### GitHub Actions
```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      - run: npm ci
      - run: npm run build
      - run: npm run lint
      - run: npm run test
```

この構成により、Next.jsとExpoの両方で効率的に開発を行い、将来の移行をスムーズに行うことができます。 