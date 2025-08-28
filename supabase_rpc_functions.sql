-- VisionMates 最小MVP用 RPC関数

-- プロジェクト一覧を件数付きで取得
CREATE OR REPLACE FUNCTION get_projects_with_counts()
RETURNS TABLE (
  id UUID,
  title TEXT,
  purpose TEXT,
  tags TEXT[],
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  watch_count BIGINT,
  raise_count BIGINT,
  commit_count BIGINT,
  comment_count BIGINT,
  update_count BIGINT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.title,
    p.purpose,
    p.tags,
    p.created_at,
    p.updated_at,
    COALESCE(watch_counts.count, 0) as watch_count,
    COALESCE(raise_counts.count, 0) as raise_count,
    COALESCE(commit_counts.count, 0) as commit_count,
    COALESCE(comment_counts.count, 0) as comment_count,
    COALESCE(update_counts.count, 0) as update_count
  FROM projects p
  LEFT JOIN (
    SELECT project_id, COUNT(*) as count
    FROM intents 
    WHERE level = 'watch'
    GROUP BY project_id
  ) watch_counts ON p.id = watch_counts.project_id
  LEFT JOIN (
    SELECT project_id, COUNT(*) as count
    FROM intents 
    WHERE level = 'raise'
    GROUP BY project_id
  ) raise_counts ON p.id = raise_counts.project_id
  LEFT JOIN (
    SELECT project_id, COUNT(*) as count
    FROM intents 
    WHERE level = 'commit'
    GROUP BY project_id
  ) commit_counts ON p.id = commit_counts.project_id
  LEFT JOIN (
    SELECT project_id, COUNT(*) as count
    FROM comments
    GROUP BY project_id
  ) comment_counts ON p.id = comment_counts.project_id
  LEFT JOIN (
    SELECT project_id, COUNT(*) as count
    FROM progress_updates
    GROUP BY project_id
  ) update_counts ON p.id = update_counts.project_id
  ORDER BY p.created_at DESC;
END;
$$;

-- 特定プロジェクトを件数付きで取得
CREATE OR REPLACE FUNCTION get_project_with_counts(pid UUID)
RETURNS TABLE (
  id UUID,
  title TEXT,
  purpose TEXT,
  tags TEXT[],
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  watch_count BIGINT,
  raise_count BIGINT,
  commit_count BIGINT,
  comment_count BIGINT,
  update_count BIGINT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.title,
    p.purpose,
    p.tags,
    p.created_at,
    p.updated_at,
    COALESCE(watch_counts.count, 0) as watch_count,
    COALESCE(raise_counts.count, 0) as raise_count,
    COALESCE(commit_counts.count, 0) as commit_count,
    COALESCE(comment_counts.count, 0) as comment_count,
    COALESCE(update_counts.count, 0) as update_count
  FROM projects p
  LEFT JOIN (
    SELECT project_id, COUNT(*) as count
    FROM intents 
    WHERE level = 'watch' AND project_id = pid
    GROUP BY project_id
  ) watch_counts ON p.id = watch_counts.project_id
  LEFT JOIN (
    SELECT project_id, COUNT(*) as count
    FROM intents 
    WHERE level = 'raise' AND project_id = pid
    GROUP BY project_id
  ) raise_counts ON p.id = raise_counts.project_id
  LEFT JOIN (
    SELECT project_id, COUNT(*) as count
    FROM intents 
    WHERE level = 'commit' AND project_id = pid
    GROUP BY project_id
  ) commit_counts ON p.id = commit_counts.project_id
  LEFT JOIN (
    SELECT project_id, COUNT(*) as count
    FROM comments
    WHERE project_id = pid
    GROUP BY project_id
  ) comment_counts ON p.id = comment_counts.project_id
  LEFT JOIN (
    SELECT project_id, COUNT(*) as count
    FROM progress_updates
    WHERE project_id = pid
    GROUP BY project_id
  ) update_counts ON p.id = update_counts.project_id
  WHERE p.id = pid;
END;
$$;

-- RLSポリシー（公開読み取り + 認証ユーザーのinsert）
-- projects
CREATE POLICY IF NOT EXISTS "Anyone can view projects" ON projects
  FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "Authenticated users can create projects" ON projects
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- comments
CREATE POLICY IF NOT EXISTS "Anyone can view comments" ON comments
  FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "Authenticated users can create comments" ON comments
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- progress_updates
CREATE POLICY IF NOT EXISTS "Anyone can view progress updates" ON progress_updates
  FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "Authenticated users can create progress updates" ON progress_updates
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- intents
CREATE POLICY IF NOT EXISTS "Anyone can view intents" ON intents
  FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "Authenticated users can create intents" ON intents
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY IF NOT EXISTS "Users can update their own intents" ON intents
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can delete their own intents" ON intents
  FOR DELETE USING (auth.uid() = user_id); 