-- VisionMates データベース設定
-- Supabaseで実行してください

-- ① スワイプ発見用テーブル
CREATE TABLE IF NOT EXISTS discover_skips (
  user_id UUID NOT NULL,
  project_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY(user_id, project_id)
);

-- ② 共同作業スプリント用テーブル
CREATE TABLE IF NOT EXISTS rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS focus_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  started_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS claps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES focus_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  count INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ③ ストリークリング用関数
CREATE OR REPLACE FUNCTION get_streak_days(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  streak_days INTEGER := 0;
  current_date DATE := CURRENT_DATE;
  last_date DATE;
  prev_date DATE;
BEGIN
  -- 今日の投稿があるかチェック
  IF EXISTS (
    SELECT 1 FROM progress_updates 
    WHERE user_id = p_user_id 
    AND created_at::date = current_date
  ) THEN
    -- 今日から連続日数を計算
    WITH date_series AS (
      SELECT DISTINCT created_at::date as post_date
      FROM progress_updates
      WHERE user_id = p_user_id
      ORDER BY created_at::date DESC
    ),
    gaps AS (
      SELECT 
        post_date,
        post_date - ROW_NUMBER() OVER (ORDER BY post_date DESC)::int AS grp
      FROM date_series
    ),
    streaks AS (
      SELECT 
        grp,
        COUNT(*) as days,
        MIN(post_date) as start_date,
        MAX(post_date) as end_date
      FROM gaps
      GROUP BY grp
    )
    SELECT days INTO streak_days
    FROM streaks
    WHERE end_date >= current_date
    ORDER BY days DESC
    LIMIT 1;
  ELSE
    -- 昨日までの連続日数を計算
    WITH date_series AS (
      SELECT DISTINCT created_at::date as post_date
      FROM progress_updates
      WHERE user_id = p_user_id
      ORDER BY created_at::date DESC
    ),
    gaps AS (
      SELECT 
        post_date,
        post_date - ROW_NUMBER() OVER (ORDER BY post_date DESC)::int AS grp
      FROM date_series
    ),
    streaks AS (
      SELECT 
        grp,
        COUNT(*) as days,
        MIN(post_date) as start_date,
        MAX(post_date) as end_date
      FROM gaps
      GROUP BY grp
    )
    SELECT days INTO streak_days
    FROM streaks
    WHERE end_date = current_date - INTERVAL '1 day'
    ORDER BY days DESC
    LIMIT 1;
  END IF;

  RETURN COALESCE(streak_days, 0);
END;
$$;

-- ④ 企画テンプレ用（既存projectsテーブルを使用）

-- ⑤ ミニ功績用テーブル
CREATE TABLE IF NOT EXISTS user_achievements (
  user_id UUID NOT NULL,
  code TEXT NOT NULL,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY(user_id, code)
);

-- ⑥ DM/グループ用テーブル
CREATE TABLE IF NOT EXISTS threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ⑦ プロフィール用テーブル
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ⑧ 紹介システム用テーブル
CREATE TABLE IF NOT EXISTS invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invited_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  source TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  accepted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS referral_badges (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_type TEXT NOT NULL CHECK (badge_type IN ('bronze', 'silver', 'gold')),
  referral_count INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- インデックスの作成
CREATE INDEX IF NOT EXISTS idx_discover_skips_user_id ON discover_skips(user_id);
CREATE INDEX IF NOT EXISTS idx_discover_skips_project_id ON discover_skips(project_id);
CREATE INDEX IF NOT EXISTS idx_rooms_owner_id ON rooms(owner_id);
CREATE INDEX IF NOT EXISTS idx_focus_sessions_room_id ON focus_sessions(room_id);
CREATE INDEX IF NOT EXISTS idx_focus_sessions_started_by ON focus_sessions(started_by);
CREATE INDEX IF NOT EXISTS idx_claps_session_id ON claps(session_id);
CREATE INDEX IF NOT EXISTS idx_claps_user_id ON claps(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_threads_project_id ON threads(project_id);
CREATE INDEX IF NOT EXISTS idx_threads_created_by ON threads(created_by);
CREATE INDEX IF NOT EXISTS idx_messages_thread_id ON messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_id);
CREATE INDEX IF NOT EXISTS idx_invitations_referrer_user_id ON invitations(referrer_user_id);
CREATE INDEX IF NOT EXISTS idx_invitations_invited_user_id ON invitations(invited_user_id);
CREATE INDEX IF NOT EXISTS idx_invitations_project_id ON invitations(project_id);
CREATE INDEX IF NOT EXISTS idx_invitations_status ON invitations(status);

-- RLSポリシーの設定
ALTER TABLE discover_skips ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE focus_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE claps ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_badges ENABLE ROW LEVEL SECURITY;

-- discover_skips ポリシー
CREATE POLICY "Users can view their own skips" ON discover_skips
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own skips" ON discover_skips
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- rooms ポリシー
CREATE POLICY "Anyone can view rooms" ON rooms
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create rooms" ON rooms
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Room owners can update their rooms" ON rooms
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Room owners can delete their rooms" ON rooms
  FOR DELETE USING (auth.uid() = owner_id);

-- focus_sessions ポリシー
CREATE POLICY "Anyone can view focus sessions" ON focus_sessions
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create focus sessions" ON focus_sessions
  FOR INSERT WITH CHECK (auth.uid() = started_by);

CREATE POLICY "Session starters can update their sessions" ON focus_sessions
  FOR UPDATE USING (auth.uid() = started_by);

-- claps ポリシー
CREATE POLICY "Anyone can view claps" ON claps
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create claps" ON claps
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- user_achievements ポリシー
CREATE POLICY "Users can view their own achievements" ON user_achievements
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert achievements" ON user_achievements
  FOR INSERT WITH CHECK (true);

-- threads ポリシー
CREATE POLICY "Anyone can view threads" ON threads
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create threads" ON threads
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Thread creators can update their threads" ON threads
  FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Thread creators can delete their threads" ON threads
  FOR DELETE USING (auth.uid() = created_by);

-- messages ポリシー
CREATE POLICY "Anyone can view messages" ON messages
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create messages" ON messages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Message authors can update their messages" ON messages
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Message authors can delete their messages" ON messages
  FOR DELETE USING (auth.uid() = user_id);

-- profiles ポリシー
CREATE POLICY "Anyone can view profiles" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- invitations ポリシー
CREATE POLICY "Users can view their own invitations" ON invitations
  FOR SELECT USING (auth.uid() = referrer_user_id OR auth.uid() = invited_user_id);

CREATE POLICY "Authenticated users can create invitations" ON invitations
  FOR INSERT WITH CHECK (auth.uid() = referrer_user_id);

CREATE POLICY "System can update invitations" ON invitations
  FOR UPDATE USING (true);

-- referral_badges ポリシー
CREATE POLICY "Anyone can view referral badges" ON referral_badges
  FOR SELECT USING (true);

CREATE POLICY "System can manage referral badges" ON referral_badges
  FOR ALL USING (true);

-- トリガー関数の作成
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- トリガーの作成
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 功績付与関数
CREATE OR REPLACE FUNCTION award_achievement(p_user_id UUID, p_code TEXT)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO user_achievements (user_id, code)
  VALUES (p_user_id, p_code)
  ON CONFLICT (user_id, code) DO NOTHING;
END;
$$;

-- 進捗投稿時の功績付与トリガー
CREATE OR REPLACE FUNCTION check_first_post_achievement()
RETURNS TRIGGER AS $$
BEGIN
  -- 初投稿功績のチェック
  IF NOT EXISTS (
    SELECT 1 FROM user_achievements 
    WHERE user_id = NEW.user_id AND code = 'first_post'
  ) THEN
    PERFORM award_achievement(NEW.user_id, 'first_post');
  END IF;
  
  -- 連続投稿功績のチェック
  PERFORM check_streak_achievements(NEW.user_id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_first_post_achievement
  AFTER INSERT ON progress_updates
  FOR EACH ROW EXECUTE FUNCTION check_first_post_achievement();

-- 連続投稿功績チェック関数
CREATE OR REPLACE FUNCTION check_streak_achievements(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  current_streak INTEGER;
BEGIN
  SELECT get_streak_days(p_user_id) INTO current_streak;
  
  -- 7日連続功績
  IF current_streak >= 7 AND NOT EXISTS (
    SELECT 1 FROM user_achievements 
    WHERE user_id = p_user_id AND code = 'streak_7'
  ) THEN
    PERFORM award_achievement(p_user_id, 'streak_7');
  END IF;
  
  -- 30日連続功績
  IF current_streak >= 30 AND NOT EXISTS (
    SELECT 1 FROM user_achievements 
    WHERE user_id = p_user_id AND code = 'streak_30'
  ) THEN
    PERFORM award_achievement(p_user_id, 'streak_30');
  END IF;
END;
$$;

-- メッセージ投稿時の功績付与トリガー
CREATE OR REPLACE FUNCTION check_first_collab_achievement()
RETURNS TRIGGER AS $$
BEGIN
  -- 初コラボ功績のチェック
  IF NOT EXISTS (
    SELECT 1 FROM user_achievements 
    WHERE user_id = NEW.user_id AND code = 'first_collab'
  ) THEN
    PERFORM award_achievement(NEW.user_id, 'first_collab');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_first_collab_achievement
  AFTER INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION check_first_collab_achievement();

-- 紹介確定関数
CREATE OR REPLACE FUNCTION claim_referral(p_referrer TEXT, p_project TEXT, p_source TEXT)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  v_referrer_user_id UUID;
  v_project_id UUID;
  v_invited_user_id UUID;
  v_referral_count INTEGER;
BEGIN
  -- 現在のユーザーを取得
  v_invited_user_id := auth.uid();
  
  -- 紹介者とプロジェクトのIDを取得
  SELECT id INTO v_referrer_user_id FROM auth.users WHERE email = p_referrer;
  SELECT id INTO v_project_id FROM projects WHERE id::text = p_project;
  
  -- 既存の招待を確認
  IF EXISTS (
    SELECT 1 FROM invitations 
    WHERE referrer_user_id = v_referrer_user_id 
    AND project_id = v_project_id 
    AND source = p_source
    AND status = 'pending'
  ) THEN
    -- 招待を確定
    UPDATE invitations 
    SET invited_user_id = v_invited_user_id,
        status = 'accepted',
        accepted_at = NOW()
    WHERE referrer_user_id = v_referrer_user_id 
    AND project_id = v_project_id 
    AND source = p_source
    AND status = 'pending';
    
    -- 紹介バッジをチェック・付与
    PERFORM check_referral_badges(v_referrer_user_id);
  END IF;
END;
$$;

-- 紹介バッジチェック関数
CREATE OR REPLACE FUNCTION check_referral_badges(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  v_referral_count INTEGER;
  v_badge_type TEXT;
BEGIN
  -- 紹介数をカウント
  SELECT COUNT(*) INTO v_referral_count
  FROM invitations
  WHERE referrer_user_id = p_user_id AND status = 'accepted';
  
  -- バッジタイプを決定
  IF v_referral_count >= 30 THEN
    v_badge_type := 'gold';
  ELSIF v_referral_count >= 10 THEN
    v_badge_type := 'silver';
  ELSIF v_referral_count >= 3 THEN
    v_badge_type := 'bronze';
  ELSE
    RETURN;
  END IF;
  
  -- バッジを付与または更新
  INSERT INTO referral_badges (user_id, badge_type, referral_count)
  VALUES (p_user_id, v_badge_type, v_referral_count)
  ON CONFLICT (user_id) DO UPDATE SET
    badge_type = v_badge_type,
    referral_count = v_referral_count,
    updated_at = NOW();
  
  -- 対応する功績を付与
  IF v_badge_type = 'bronze' AND v_referral_count = 3 THEN
    PERFORM award_achievement(p_user_id, 'referral_3');
  ELSIF v_badge_type = 'silver' AND v_referral_count = 10 THEN
    PERFORM award_achievement(p_user_id, 'referral_10');
  ELSIF v_badge_type = 'gold' AND v_referral_count = 30 THEN
    PERFORM award_achievement(p_user_id, 'referral_30');
  END IF;
END;
$$; 