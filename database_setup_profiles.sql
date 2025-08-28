-- profilesテーブルの個別作成
-- 他のテーブルが作成された後に実行してください

-- profilesテーブルの作成
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY,
  display_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- profilesテーブルのインデックス
CREATE INDEX IF NOT EXISTS idx_profiles_id ON profiles(id);

-- RLSポリシーの設定
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- profiles ポリシー
CREATE POLICY "Anyone can view profiles" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 既存のユーザー用にプロフィールを作成（オプション）
INSERT INTO profiles (id, display_name)
SELECT 
  id,
  COALESCE(raw_user_meta_data->>'full_name', split_part(email, '@', 1)) as display_name
FROM auth.users
WHERE id NOT IN (SELECT id FROM profiles)
ON CONFLICT (id) DO NOTHING; 