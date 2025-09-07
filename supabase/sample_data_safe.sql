-- VisionMates 安全なサンプルデータ
-- 外部キー制約を考慮したサンプルデータ

-- サンプルプロジェクトの作成（既に作成済みの場合はスキップ）
INSERT INTO projects (id, title, purpose, tags, cover_url) VALUES
  (
    '550e8400-e29b-41d4-a716-446655440001',
    'VisionMates プラットフォーム開発',
    '開発者同士が協力してプロジェクトを進めるプラットフォームの構築',
    ARRAY['Next.js', 'TypeScript', 'Supabase', 'Tailwind CSS'],
    'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&h=400&fit=crop'
  ),
  (
    '550e8400-e29b-41d4-a716-446655440002',
    'AI チャットボット開発',
    '自然言語処理を使ったカスタマーサポート用チャットボット',
    ARRAY['Python', 'OpenAI', 'FastAPI', 'Docker'],
    'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=400&fit=crop'
  ),
  (
    '550e8400-e29b-41d4-a716-446655440003',
    'モバイルアプリ UI/UX 改善',
    'ユーザビリティを向上させるためのデザインシステム構築',
    ARRAY['React Native', 'Figma', 'User Research', 'Design System'],
    'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=800&h=400&fit=crop'
  ),
  (
    '550e8400-e29b-41d4-a716-446655440004',
    'ブロックチェーン DApp 開発',
    'DeFi プロトコルのフロントエンド開発',
    ARRAY['Solidity', 'Web3.js', 'React', 'Ethereum'],
    'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800&h=400&fit=crop'
  ),
  (
    '550e8400-e29b-41d4-a716-446655440005',
    'データ分析ダッシュボード',
    'ビジネス指標を可視化するリアルタイムダッシュボード',
    ARRAY['Python', 'Streamlit', 'PostgreSQL', 'Data Visualization'],
    'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=400&fit=crop'
  )
ON CONFLICT (id) DO NOTHING;

-- バッジの初期データ（既に作成済みの場合はスキップ）
INSERT INTO badges (code, label) VALUES
  ('first_comment', '初コメント'),
  ('first_update', '初進捗'),
  ('first_share', '初シェア')
ON CONFLICT (code) DO NOTHING;

-- 注意: ユーザー関連のデータは、実際の認証システムが設定されてから
-- アプリケーション経由で作成することをお勧めします。

-- 以下のコメントアウトされた部分は、実際のユーザーが存在する場合に
-- 手動で実行してください：

-- 実際のユーザーIDを取得するクエリ例：
-- SELECT id FROM auth.users LIMIT 1;

-- サンプルコメントの作成（実際のユーザーIDに置き換えてください）
-- INSERT INTO comments (project_id, user_id, content) VALUES
--   (
--     '550e8400-e29b-41d4-a716-446655440001',
--     '実際のユーザーIDをここに貼り付け',
--     '素晴らしいプロジェクトですね！私も参加したいです。'
--   );

-- サンプル進捗更新の作成（実際のユーザーIDに置き換えてください）
-- INSERT INTO progress_updates (project_id, user_id, content, percentage) VALUES
--   (
--     '550e8400-e29b-41d4-a716-446655440001',
--     '実際のユーザーIDをここに貼り付け',
--     '基本的な認証システムの実装が完了しました。',
--     25
--   );

-- サンプル参加意図の作成（実際のユーザーIDに置き換えてください）
-- INSERT INTO intents (project_id, user_id, level) VALUES
--   (
--     '550e8400-e29b-41d4-a716-446655440001',
--     '実際のユーザーIDをここに貼り付け',
--     'watch'
--   );

-- サンプル参加温度投票の作成（実際のユーザーIDに置き換えてください）
-- INSERT INTO participation_votes (project_id, user_id, temperature_level) VALUES
--   (
--     '550e8400-e29b-41d4-a716-446655440001',
--     '実際のユーザーIDをここに貼り付け',
--     'hot'
--   );
