-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum for intent levels
CREATE TYPE intent_level AS ENUM ('watch', 'raise', 'commit');

-- Create projects table
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  purpose TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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

-- Create intents table
CREATE TABLE intents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  level intent_level NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);

-- Create function to get projects with counts
CREATE OR REPLACE FUNCTION get_project_with_counts()
RETURNS TABLE (
  id UUID,
  title TEXT,
  purpose TEXT,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  comments_count BIGINT,
  progress_count BIGINT,
  watch_count BIGINT,
  raise_count BIGINT,
  commit_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.title,
    p.purpose,
    p.tags,
    p.created_at,
    p.updated_at,
    COALESCE(c.comments_count, 0) as comments_count,
    COALESCE(pr.progress_count, 0) as progress_count,
    COALESCE(i.watch_count, 0) as watch_count,
    COALESCE(i.raise_count, 0) as raise_count,
    COALESCE(i.commit_count, 0) as commit_count
  FROM projects p
  LEFT JOIN (
    SELECT project_id, COUNT(*) as comments_count
    FROM comments
    GROUP BY project_id
  ) c ON p.id = c.project_id
  LEFT JOIN (
    SELECT project_id, COUNT(*) as progress_count
    FROM progress_updates
    GROUP BY project_id
  ) pr ON p.id = pr.project_id
  LEFT JOIN (
    SELECT 
      project_id,
      COUNT(*) FILTER (WHERE level = 'watch') as watch_count,
      COUNT(*) FILTER (WHERE level = 'raise') as raise_count,
      COUNT(*) FILTER (WHERE level = 'commit') as commit_count
    FROM intents
    GROUP BY project_id
  ) i ON p.id = i.project_id
  ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Enable Row Level Security
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE intents ENABLE ROW LEVEL SECURITY;

-- RLS Policies for projects (readable by all, writable by authenticated users)
CREATE POLICY "Projects are viewable by everyone" ON projects
  FOR SELECT USING (true);

CREATE POLICY "Projects are insertable by authenticated users" ON projects
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Projects are updatable by authenticated users" ON projects
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- RLS Policies for comments (readable by all, writable by authenticated users)
CREATE POLICY "コメントは誰でも閲覧可能" ON comments
  FOR SELECT USING (true);

CREATE POLICY "認証済みユーザーのみコメント投稿可能" ON comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "自分のコメントのみ更新可能" ON comments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "自分のコメントのみ削除可能" ON comments
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for progress_updates (readable by all, writable by authenticated users)
CREATE POLICY "進捗更新は誰でも閲覧可能" ON progress_updates
  FOR SELECT USING (true);

CREATE POLICY "認証済みユーザーのみ進捗更新可能" ON progress_updates
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "自分の進捗更新のみ更新可能" ON progress_updates
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "自分の進捗更新のみ削除可能" ON progress_updates
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for participation_votes (readable by all, writable by authenticated users)
CREATE POLICY "投票結果は誰でも閲覧可能" ON participation_votes
  FOR SELECT USING (true);

CREATE POLICY "認証済みユーザーのみ投票可能" ON participation_votes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "自分の投票のみ更新可能" ON participation_votes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "自分の投票のみ削除可能" ON participation_votes
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for intents (readable by all, writable by authenticated users)
CREATE POLICY "Intents are viewable by everyone" ON intents
  FOR SELECT USING (true);

CREATE POLICY "Intents are insertable by authenticated users" ON intents
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Intents are updatable by authenticated users" ON intents
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Intents are deletable by authenticated users" ON intents
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- Insert sample data
INSERT INTO projects (title, purpose, tags) VALUES
('VisionMates開発', 'ビジョンでつながる仲間募集プラットフォームの開発', ARRAY['Next.js', 'Supabase', 'TypeScript']),
('サステナブルな街づくり', '環境に配慮した都市計画の提案と実装', ARRAY['環境', '都市計画', 'サステナビリティ']),
('地域活性化プロジェクト', '地方創生のための新しいビジネスモデルの構築', ARRAY['地域活性化', 'ビジネス', '地方創生']); 

-- インデックスの作成
CREATE INDEX idx_comments_project_id ON comments(project_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);
CREATE INDEX idx_comments_created_at ON comments(created_at);

CREATE INDEX idx_progress_updates_project_id ON progress_updates(project_id);
CREATE INDEX idx_progress_updates_user_id ON progress_updates(user_id);
CREATE INDEX idx_progress_updates_created_at ON progress_updates(created_at);

CREATE INDEX idx_participation_votes_project_id ON participation_votes(project_id);
CREATE INDEX idx_participation_votes_user_id ON participation_votes(user_id); 