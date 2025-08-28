-- VisionMates データベース設定 - Step 1: 基本テーブル（修正版）
-- profilesテーブルを除外して、他のテーブルを先に作成

-- 既存のポリシーを削除（エラーを防ぐため）
DROP POLICY IF EXISTS "Users can view their own skips" ON discover_skips;
DROP POLICY IF EXISTS "Users can insert their own skips" ON discover_skips;
DROP POLICY IF EXISTS "Anyone can view rooms" ON rooms;
DROP POLICY IF EXISTS "Authenticated users can create rooms" ON rooms;
DROP POLICY IF EXISTS "Room owners can update their rooms" ON rooms;
DROP POLICY IF EXISTS "Room owners can delete their rooms" ON rooms;
DROP POLICY IF EXISTS "Anyone can view focus sessions" ON focus_sessions;
DROP POLICY IF EXISTS "Authenticated users can create focus sessions" ON focus_sessions;
DROP POLICY IF EXISTS "Session starters can update their sessions" ON focus_sessions;
DROP POLICY IF EXISTS "Anyone can view claps" ON claps;
DROP POLICY IF EXISTS "Authenticated users can create claps" ON claps;
DROP POLICY IF EXISTS "Users can view their own achievements" ON user_achievements;
DROP POLICY IF EXISTS "System can insert achievements" ON user_achievements;
DROP POLICY IF EXISTS "Anyone can view threads" ON threads;
DROP POLICY IF EXISTS "Authenticated users can create threads" ON threads;
DROP POLICY IF EXISTS "Thread creators can update their threads" ON threads;
DROP POLICY IF EXISTS "Thread creators can delete their threads" ON threads;
DROP POLICY IF EXISTS "Anyone can view messages" ON messages;
DROP POLICY IF EXISTS "Authenticated users can create messages" ON messages;
DROP POLICY IF EXISTS "Message authors can update their messages" ON messages;
DROP POLICY IF EXISTS "Message authors can delete their messages" ON messages;
DROP POLICY IF EXISTS "Users can view their own invitations" ON invitations;
DROP POLICY IF EXISTS "Authenticated users can create invitations" ON invitations;
DROP POLICY IF EXISTS "System can update invitations" ON invitations;
DROP POLICY IF EXISTS "Anyone can view referral badges" ON referral_badges;
DROP POLICY IF EXISTS "System can manage referral badges" ON referral_badges;

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
  owner_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS focus_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  started_by UUID NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS claps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES focus_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  count INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

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
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ⑧ 紹介システム用テーブル
CREATE TABLE IF NOT EXISTS invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_user_id UUID NOT NULL,
  invited_user_id UUID,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  source TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  accepted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS referral_badges (
  user_id UUID PRIMARY KEY,
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