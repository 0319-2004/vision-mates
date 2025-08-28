-- VisionMates 最小MVP用 RPC関数（修正版）

-- プロジェクト一覧を件数付きで取得
CREATE OR REPLACE FUNCTION get_projects_with_counts()
RETURNS TABLE (
  id UUID,
  title TEXT,
  purpose TEXT,
  tags TEXT[],
  created_at TIMESTAMPTZ,
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