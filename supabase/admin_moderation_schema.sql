-- 管理者専用モデレーション機能のDBスキーマ
-- 実行前に既存のprofilesテーブルがあることを確認してください

-- 管理者フラグ（profiles に boolean を追加）
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false;

-- 通報テーブル
CREATE TABLE IF NOT EXISTS public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id uuid NOT NULL,               -- 通報対象（投稿など）のID
  content_type text NOT NULL,             -- 例: 'project', 'comment', 'user'
  reason text NOT NULL,
  description text,                       -- 詳細説明
  status text NOT NULL DEFAULT 'open',    -- 'open' | 'hold' | 'kept' | 'deleted'
  reported_by uuid REFERENCES auth.users(id) NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamp with time zone,
  action_notes text
);

-- モデレーション操作ログ
CREATE TABLE IF NOT EXISTS public.moderation_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  action text NOT NULL,                   -- 'keep' | 'hold' | 'delete'
  actor_id uuid REFERENCES auth.users(id) NOT NULL,
  notes text,
  created_at timestamp with time zone DEFAULT now()
);

-- 同一ユーザーが同一コンテンツを重複通報しないための制約
CREATE UNIQUE INDEX IF NOT EXISTS uniq_report_per_user_content
  ON public.reports (reported_by, content_id, content_type);

-- RLS
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moderation_actions ENABLE ROW LEVEL SECURITY;

-- is_admin ヘルパー（SQL関数）
CREATE OR REPLACE FUNCTION public.is_admin(uid uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT COALESCE((SELECT is_admin FROM public.profiles WHERE id = uid), false);
$$;

-- reports: 誰でも自分の通報を insert できる。select は管理者のみ全件、自分は自分のみ。
CREATE POLICY "reports_insert_by_authenticated"
ON public.reports FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = reported_by);

CREATE POLICY "reports_select_by_owner_or_admin"
ON public.reports FOR SELECT
TO authenticated
USING (
  is_admin(auth.uid()) OR reported_by = auth.uid()
);

-- reports: update/delete は管理者のみ
CREATE POLICY "reports_update_admin_only"
ON public.reports FOR UPDATE
TO authenticated
USING (is_admin(auth.uid()));

CREATE POLICY "reports_delete_admin_only"
ON public.reports FOR DELETE
TO authenticated
USING (is_admin(auth.uid()));

-- moderation_actions: insert/select は管理者のみ
CREATE POLICY "mod_actions_admin_only_select"
ON public.moderation_actions FOR SELECT
TO authenticated
USING (is_admin(auth.uid()));

CREATE POLICY "mod_actions_admin_only_insert"
ON public.moderation_actions FOR INSERT
TO authenticated
WITH CHECK (is_admin(auth.uid()));

-- 管理者ユーザーの作成例（実際のユーザーIDに置き換えてください）
-- UPDATE public.profiles SET is_admin = true WHERE id = 'your-user-id-here';

-- インデックス追加（パフォーマンス向上）
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_content ON public.reports(content_id, content_type);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON public.reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_moderation_actions_report_id ON public.moderation_actions(report_id);

