-- VisionMates 初期セットアップ
-- 基本的なテーブル構造を作成

-- UUID拡張を有効化
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 参加レベル用のENUM
CREATE TYPE intent_level AS ENUM ('watch', 'raise', 'commit');

-- プロジェクトテーブル
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  purpose TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  cover_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- プロフィールテーブル
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  display_name TEXT,
  bio TEXT,
  skills TEXT[],
  links JSONB,
  location TEXT,
  role TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- コメントテーブル
CREATE TABLE comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 進捗更新テーブル
CREATE TABLE progress_updates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  percentage INTEGER NOT NULL CHECK (percentage >= 0 AND percentage <= 100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 参加温度投票テーブル
CREATE TABLE participation_votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  temperature_level TEXT NOT NULL CHECK (temperature_level IN ('cold', 'warm', 'hot')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);

-- 参加意図テーブル
CREATE TABLE intents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  level intent_level NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);

-- バッジテーブル
CREATE TABLE badges (
  id SERIAL PRIMARY KEY,
  code TEXT UNIQUE,
  label TEXT
);

-- ユーザーバッジテーブル
CREATE TABLE user_badges (
  user_id UUID REFERENCES auth.users ON DELETE CASCADE,
  badge_code TEXT REFERENCES badges(code),
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, badge_code)
);

-- リアクションテーブル
CREATE TABLE reactions (
  id BIGSERIAL PRIMARY KEY,
  target_type TEXT CHECK (target_type IN ('update','comment')),
  target_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  kind TEXT DEFAULT 'clap',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (target_type, target_id, user_id, kind)
);

-- ルームテーブル
CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  project_id UUID REFERENCES projects(id),
  created_by UUID REFERENCES auth.users,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ルームメンバーテーブル
CREATE TABLE room_members (
  room_id UUID REFERENCES rooms ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (room_id, user_id)
);

-- メッセージテーブル
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES rooms ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE,
  body TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- バッジの初期データ
INSERT INTO badges (code, label) VALUES
  ('first_comment', '初コメント'),
  ('first_update', '初進捗'),
  ('first_share', '初シェア')
ON CONFLICT (code) DO NOTHING;

-- プロジェクト人気度ビュー
CREATE OR REPLACE VIEW project_popularity_weekly AS
SELECT
  project_id,
  COUNT(*) FILTER (WHERE level = 'watch') AS watch_cnt,
  COUNT(*) FILTER (WHERE level = 'raise') AS raise_cnt,
  COUNT(*) FILTER (WHERE level = 'commit') AS commit_cnt
FROM intents
WHERE created_at >= date_trunc('week', NOW())
GROUP BY project_id;

-- ストリークRPC関数
CREATE OR REPLACE FUNCTION get_streak_days(p_user UUID)
RETURNS INT LANGUAGE SQL STABLE AS $$
WITH days AS (
  SELECT DISTINCT date(created_at) d
  FROM progress_updates
  WHERE user_id = p_user
),
r AS (
  SELECT d, lag(d) OVER(ORDER BY d) prev
  FROM days
),
grp AS (
  SELECT d, CASE WHEN prev = d - interval '1 day' THEN 0 ELSE 1 END AS br
  FROM r
),
grp2 AS (
  SELECT d, sum(br) OVER(ORDER BY d) g
  FROM grp
),
latest_group AS (
  SELECT g FROM grp2 ORDER BY d DESC LIMIT 1
)
SELECT COUNT(*) FROM grp2 WHERE g = (SELECT g FROM latest_group);
$$;

-- RLS (Row Level Security) の設定
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE participation_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE intents ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- プロジェクトテーブルのRLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- 基本的なRLSポリシー
CREATE POLICY "projects_select_all" ON projects FOR SELECT TO authenticated USING (true);
CREATE POLICY "projects_insert_authenticated" ON projects FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "projects_update_authenticated" ON projects FOR UPDATE TO authenticated USING (true);

CREATE POLICY "profiles_select_all" ON profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

CREATE POLICY "comments_select_all" ON comments FOR SELECT TO authenticated USING (true);
CREATE POLICY "comments_insert_authenticated" ON comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "comments_update_own" ON comments FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "comments_delete_own" ON comments FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "progress_updates_select_all" ON progress_updates FOR SELECT TO authenticated USING (true);
CREATE POLICY "progress_updates_insert_authenticated" ON progress_updates FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "progress_updates_update_own" ON progress_updates FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "progress_updates_delete_own" ON progress_updates FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "participation_votes_select_all" ON participation_votes FOR SELECT TO authenticated USING (true);
CREATE POLICY "participation_votes_insert_authenticated" ON participation_votes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "participation_votes_update_own" ON participation_votes FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "participation_votes_delete_own" ON participation_votes FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "intents_select_all" ON intents FOR SELECT TO authenticated USING (true);
CREATE POLICY "intents_insert_authenticated" ON intents FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "intents_update_own" ON intents FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "intents_delete_own" ON intents FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "user_badges_select_own" ON user_badges FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "user_badges_insert_admin" ON user_badges FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "reactions_select_all" ON reactions FOR SELECT TO authenticated USING (true);
CREATE POLICY "reactions_insert_own" ON reactions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "reactions_delete_own" ON reactions FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "rooms_select_members" ON rooms FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM room_members WHERE room_id = rooms.id AND user_id = auth.uid())
);

CREATE POLICY "room_members_select_members" ON room_members FOR SELECT TO authenticated USING (
  room_id IN (SELECT room_id FROM room_members WHERE user_id = auth.uid())
);

CREATE POLICY "messages_select_members" ON messages FOR SELECT TO authenticated USING (
  room_id IN (SELECT room_id FROM room_members WHERE user_id = auth.uid())
);
CREATE POLICY "messages_insert_members" ON messages FOR INSERT TO authenticated WITH CHECK (
  auth.uid() = user_id AND 
  room_id IN (SELECT room_id FROM room_members WHERE user_id = auth.uid())
);
