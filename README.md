# VisionMates

ビジョンでつながる仲間募集プラットフォーム

## 概要

VisionMatesは、志を同じくする仲間と出会い、一緒にプロジェクトを実現するためのプラットフォームです。

## 機能

- **プロジェクト一覧**: 公開されているプロジェクトの閲覧
- **プロジェクト詳細**: コメント・進捗の投稿・閲覧
- **参加意向**: 👀見守る / ✋手を挙げる / 🚀コミット の3段階で参加意向を表明
- **認証**: Email + Google OAuth認証

## 技術スタック

- **フロントエンド**: Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **バックエンド**: Supabase (PostgreSQL + RLS)
- **認証**: Supabase Auth (Email + Google OAuth)
- **デプロイ**: Vercel

## セットアップ手順

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env.local`ファイルを作成し、以下の環境変数を設定してください：

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Supabaseプロジェクトの設定

1. [Supabase](https://supabase.com)で新しいプロジェクトを作成
2. SQL Editorで`supabase/schema.sql`の内容を実行
3. Authentication > SettingsでGoogle OAuthを設定（必要に応じて）

### 4. 開発サーバーの起動

```bash
npm run dev
```

http://localhost:3000 でアプリケーションにアクセスできます。

## デプロイ手順（Vercel）

### 1. Vercelプロジェクトの作成

1. [Vercel](https://vercel.com)にログイン
2. GitHubリポジトリをインポート
3. プロジェクト設定で以下を確認：
   - Framework Preset: Next.js
   - Build Command: `npm run build`
   - Output Directory: `.next`

### 2. 環境変数の設定

Vercelのプロジェクト設定 > Environment Variablesで以下を設定：

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. デプロイ

GitHubにプッシュすると自動的にデプロイされます。

## データベース構造

### テーブル

- **projects**: プロジェクト情報
- **comments**: コメント
- **progress_updates**: 進捗更新
- **intents**: 参加意向

### RLS（Row Level Security）

- 閲覧は匿名ユーザーでも可能
- 書き込みは認証済みユーザーのみ

## 開発コマンド

```bash
# 開発サーバー起動
npm run dev

# ビルド
npm run build

# 本番サーバー起動
npm start

# リント
npm run lint

# フォーマット
npm run format
```

## ライセンス

MIT License 