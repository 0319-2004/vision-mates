-- 招待・紹介機能のデータベーススキーマ

-- 1) 招待記録
create table if not exists invitations (
  id uuid primary key default gen_random_uuid(),
  referrer_user_id uuid not null,
  invited_user_id uuid not null,
  project_id uuid null,
  source text not null check (source in ('line','instagram','linkedin','copy','webshare')),
  created_at timestamptz not null default now()
);

-- 制約・インデックス
create unique index if not exists invitations_unique_invited on invitations(invited_user_id);
create index if not exists invitations_referrer_idx on invitations(referrer_user_id);
alter table invitations add constraint invitations_no_self_ref
  check (referrer_user_id <> invited_user_id);

-- 2) バッジ
create table if not exists referral_badges (
  user_id uuid primary key,
  level text not null check (level in ('bronze','silver','gold')),
  updated_at timestamptz not null default now()
);

-- 3) 集計とバッジ付与関数
create or replace function award_referral_badges(p_referrer uuid)
returns void
language plpgsql
security definer
as $$
declare
  cnt int;
  new_level text;
begin
  select count(*) into cnt from invitations where referrer_user_id = p_referrer;

  if cnt >= 30 then new_level := 'gold';
  elsif cnt >= 10 then new_level := 'silver';
  elsif cnt >= 3 then new_level := 'bronze';
  else return;
  end if;

  insert into referral_badges(user_id, level)
  values (p_referrer, new_level)
  on conflict (user_id) do update set level = excluded.level, updated_at = now();
end;
$$;

-- 4) 紹介確定（招待クレーム）関数
create or replace function claim_referral(p_referrer uuid, p_project uuid, p_source text)
returns void
language plpgsql
security definer
as $$
declare
  v_invited uuid := auth.uid();
begin
  if v_invited is null then
    raise exception 'must be authenticated';
  end if;

  if p_referrer is null or p_referrer = v_invited then
    return; -- 無効 or 自己紹介は無視
  end if;

  -- 1人につき1回だけ
  insert into invitations(referrer_user_id, invited_user_id, project_id, source)
  values (p_referrer, v_invited, p_project, p_source)
  on conflict (invited_user_id) do nothing;

  perform award_referral_badges(p_referrer);
end;
$$;

-- RLS（例：閲覧はanon可、書き込みは認証ユーザーのみ）
alter table invitations enable row level security;
create policy "inv_select" on invitations for select using (true);
create policy "inv_insert_auth" on invitations for insert to authenticated with check (auth.uid() = invited_user_id);

alter table referral_badges enable row level security;
create policy "badges_select" on referral_badges for select using (true);
create policy "badges_upsert_sys" on referral_badges for all to service_role using (true) with check (true);
-- ※ SECURITY DEFINER関数経由で更新される前提。必要に応じて調整。 