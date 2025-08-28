-- VisionMates データベース設定 - Step 2: 関数とトリガー
-- Step 1が成功した後にこれを実行してください

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

DROP TRIGGER IF EXISTS trigger_check_first_post_achievement ON progress_updates;
CREATE TRIGGER trigger_check_first_post_achievement
  AFTER INSERT ON progress_updates
  FOR EACH ROW EXECUTE FUNCTION check_first_post_achievement();

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

DROP TRIGGER IF EXISTS trigger_check_first_collab_achievement ON messages;
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