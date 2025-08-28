-- 完全なスキーマ検証クエリ
-- データベース設定が正しく完了しているか確認

-- 1. テーブルの存在確認
SELECT 'Tables' as category, table_name as name, 'EXISTS' as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'profiles', 
  'user_achievements', 
  'threads', 
  'messages', 
  'discover_skips',
  'rooms',
  'focus_sessions',
  'claps',
  'invitations',
  'referral_badges'
)
ORDER BY table_name;

-- 2. 関数の存在確認
SELECT 'Functions' as category, routine_name as name, 'EXISTS' as status
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN (
  'get_streak_days', 
  'award_achievement', 
  'claim_referral',
  'check_streak_achievements',
  'check_first_post_achievement',
  'check_first_collab_achievement',
  'check_referral_badges',
  'handle_new_user'
)
ORDER BY routine_name;

-- 3. トリガーの存在確認
SELECT 'Triggers' as category, trigger_name as name, 'EXISTS' as status
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
AND trigger_name IN (
  'on_auth_user_created',
  'trigger_check_first_post_achievement',
  'trigger_check_first_collab_achievement'
)
ORDER BY trigger_name;

-- 4. ポリシーの存在確認
SELECT 'Policies' as category, 
       schemaname || '.' || tablename || '.' || policyname as name, 
       'EXISTS' as status
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN (
  'profiles', 
  'user_achievements', 
  'threads', 
  'messages', 
  'discover_skips',
  'rooms',
  'focus_sessions',
  'claps',
  'invitations',
  'referral_badges'
)
ORDER BY tablename, policyname;

-- 5. インデックスの存在確認
SELECT 'Indexes' as category, indexname as name, 'EXISTS' as status
FROM pg_indexes 
WHERE schemaname = 'public' 
AND indexname LIKE 'idx_%'
ORDER BY indexname; 