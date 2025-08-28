# Vision Mates - Monorepo README

## 概要
Vision Matesは、Next.js + Expo のクロスプラットフォームアプリケーションです。Turborepoを使用したmonorepo構成で、WebとMobileの両方で効率的な開発を実現します。

## 🚀 クイックスタート

### 前提条件
- Node.js 18以上
- npm 9以上
- Expo CLI（モバイル開発用）

### セットアップ
```bash
# リポジトリのクローン
git clone <repository-url>
cd vision-mates

# 依存関係のインストール
npm install

# 環境変数の設定
cp .env.example .env.local
# .env.localを編集して必要な値を設定

# 開発サーバーの起動
npm run dev
```

## 📁 プロジェクト構造

```
vision-mates/
├── apps/
│   ├── web/          # Next.js Webアプリ (http://localhost:3000)
│   └── mobile/       # Expo Mobileアプリ
├── packages/
│   ├── ui/           # 共通UIコンポーネント
│   ├── types/        # 共通型定義
│   ├── api/          # APIクライアント
│   ├── store/        # 状態管理
│   └── utils/        # 共通ユーティリティ
└── docs/             # ドキュメント
```

## 🛠️ 開発コマンド

### 全アプリケーション
```bash
npm run dev          # 全アプリの開発サーバー起動
npm run build        # 全パッケージのビルド
npm run lint         # 全パッケージのリント
npm run test         # 全パッケージのテスト
```

### 特定のアプリケーション
```bash
# Webアプリのみ
npm run dev --filter=@vision-mates/web
npm run build --filter=@vision-mates/web

# Mobileアプリのみ
npm run dev --filter=@vision-mates/mobile
npm run build --filter=@vision-mates/mobile
```

### パッケージ管理
```bash
# 新しいパッケージの追加
npx turbo gen package

# パッケージ間の依存関係追加
npm install @vision-mates/ui --workspace=apps/web
```

## 🎨 デザインシステム

### Tamagui（推奨）
クロスプラットフォーム対応のUIライブラリを使用しています。

```typescript
import { Button, Text } from '@vision-mates/ui';

export function MyComponent() {
  return (
    <Button onPress={() => console.log('Pressed!')}>
      <Text>Hello World</Text>
    </Button>
  );
}
```

### デザイントークン
```typescript
import { tokens } from '@vision-mates/ui';

// 色、サイズ、間隔などの一貫したデザインシステム
const { colors, spacing, borderRadius } = tokens;
```

## 🔌 API統合

### Supabase
```typescript
import { supabaseClient } from '@vision-mates/api';

// プロジェクト一覧の取得
const projects = await supabaseClient.getProjects();
```

### tRPC（オプション）
```typescript
import { trpc } from '@vision-mates/api';

// 型安全なAPI呼び出し
const projects = trpc.projects.list.useQuery();
```

## 📱 プラットフォーム固有の実装

### Web固有のコンポーネント
```typescript
// apps/web/components/WebSpecificComponent.tsx
export function WebSpecificComponent() {
  // Web固有の実装
}
```

### Mobile固有のコンポーネント
```typescript
// apps/mobile/components/MobileSpecificComponent.tsx
export function MobileSpecificComponent() {
  // Mobile固有の実装
}
```

## 🧪 テスト

### ユニットテスト
```bash
npm run test
```

### E2Eテスト
```bash
# Web E2Eテスト
npm run test:e2e:web

# Mobile E2Eテスト
npm run test:e2e:mobile
```

## 🚀 デプロイ

### Web（Vercel）
```bash
npm run build --filter=@vision-mates/web
# Vercelにデプロイ
```

### Mobile（Expo）
```bash
npm run build --filter=@vision-mates/mobile
# Expo Application Servicesにデプロイ
```

## 📚 ドキュメント

- [設計原則](./DESIGN_PRINCIPLES.md) - アーキテクチャと設計原則
- [Monorepo構成](./MONOREPO_STRUCTURE.md) - 詳細な構成説明
- [API仕様](./docs/api.md) - API仕様書
- [コンポーネントライブラリ](./docs/components.md) - UIコンポーネント一覧

## 🤝 開発ガイドライン

### コード規約
- TypeScriptを必須とする
- ESLint + Prettierでコード品質を保つ
- コミットメッセージはConventional Commitsに従う

### ブランチ戦略
- `main`: 本番環境
- `develop`: 開発環境
- `feature/*`: 機能開発
- `hotfix/*`: 緊急修正

### プルリクエスト
1. 機能ブランチを作成
2. 変更を実装
3. テストを実行
4. プルリクエストを作成
5. レビュー後にマージ

## 🐛 トラブルシューティング

### よくある問題

#### 依存関係のエラー
```bash
# node_modulesを削除して再インストール
rm -rf node_modules
npm install
```

#### ビルドエラー
```bash
# キャッシュをクリアしてビルド
npm run clean
npm run build
```

#### モバイルアプリの起動エラー
```bash
# Expoキャッシュをクリア
npx expo start --clear
```

## 📞 サポート

- バグ報告: GitHub Issues
- 機能要望: GitHub Discussions
- 技術的な質問: GitHub Discussions

## 📄 ライセンス

MIT License

---

このREADMEは基本的な情報を提供しています。詳細な情報は各ドキュメントを参照してください。 