-- VisionMates Phase 0: Database Migration (Fixed)
-- 既存のテーブル構造を考慮した修正版

-- 0) プロフィール拡張（既存のprofilesテーブルがある場合はスキップ）
create table if not exists profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text,
  bio text,
  skills text[],                -- ['Next.js','TypeScript']
  links jsonb,                  -- { github:'', portfolio:'', linkedin:'' }
  location text,                -- 都道府県/国
  role text,                    -- student / pro / founder など
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 既存のprofilesテーブルにカラムを追加（存在する場合）
DO $$ 
BEGIN
    -- display_nameカラムを追加（存在しない場合）
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'display_name') THEN
        ALTER TABLE profiles ADD COLUMN display_name text;
    END IF;
    
    -- bioカラムを追加（存在しない場合）
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'bio') THEN
        ALTER TABLE profiles ADD COLUMN bio text;
    END IF;
    
    -- skillsカラムを追加（存在しない場合）
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'skills') THEN
        ALTER TABLE profiles ADD COLUMN skills text[];
    END IF;
    
    -- linksカラムを追加（存在しない場合）
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'links') THEN
        ALTER TABLE profiles ADD COLUMN links jsonb;
    END IF;
    
    -- locationカラムを追加（存在しない場合）
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'location') THEN
        ALTER TABLE profiles ADD COLUMN location text;
    END IF;
    
    -- roleカラムを追加（存在しない場合）
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'role') THEN
        ALTER TABLE profiles ADD COLUMN role text;
    END IF;
    
    -- avatar_urlカラムを追加（存在しない場合）
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'avatar_url') THEN
        ALTER TABLE profiles ADD COLUMN avatar_url text;
    END IF;
    
    -- updated_atカラムを追加（存在しない場合）
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'updated_at') THEN
        ALTER TABLE profiles ADD COLUMN updated_at timestamptz default now();
    END IF;
END $$;

-- 1) 進捗ストリーク（計算はRPCで。履歴はupdatesテーブルで足りる）

-- 2) バッジ（初コメント/初進捗/初シェア など）
create table if not exists badges (
  id serial primary key,
  code text unique,        -- 'first_comment','first_update','first_share'
  label text               -- 表示名
);

insert into badges (code,label) values
  ('first_comment','初コメント'),
  ('first_update','初進捗'),
  ('first_share','初シェア')
on conflict (code) do nothing;

create table if not exists user_badges (
  user_id uuid references auth.users on delete cascade,
  badge_code text references badges(code),
  earned_at timestamptz default now(),
  primary key (user_id, badge_code)
);

-- 3) リアクション（👏）
create table if not exists reactions (
  id bigserial primary key,
  target_type text check (target_type in ('update','comment')),
  target_id uuid not null,      -- updates.id or comments.id
  user_id uuid not null references auth.users on delete cascade,
  kind text default 'clap',
  created_at timestamptz default now(),
  unique (target_type, target_id, user_id, kind)
);

-- 4) DM / グループ
create table if not exists rooms (
  id uuid primary key default gen_random_uuid(),
  name text,
  project_id uuid,              -- プロジェクト紐付けも可（null許容）
  created_by uuid references auth.users,
  created_at timestamptz default now()
);

create table if not exists room_members (
  room_id uuid references rooms on delete cascade,
  user_id uuid references auth.users on delete cascade,
  joined_at timestamptz default now(),
  primary key (room_id, user_id)
);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references rooms on delete cascade,
  user_id uuid references auth.users on delete cascade,
  body text,
  created_at timestamptz default now()
);

-- 5) プロジェクトのカバー（既存のprojectsテーブルに追加）
DO $$ 
BEGIN
    -- cover_urlカラムを追加（存在しない場合）
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'cover_url') THEN
        ALTER TABLE projects ADD COLUMN cover_url text;
    END IF;
END $$;

-- 6) おすすめ＆ランキング用の簡易ビュー
create or replace view project_popularity_weekly as
select
  project_id,
  count(*) filter (where intent='watch') as watch_cnt,
  count(*) filter (where intent='raise') as raise_cnt,
  count(*) filter (where intent='commit') as commit_cnt
from intents
where created_at >= date_trunc('week', now())
group by project_id;

-- タグベース推薦はクエリで実装（スキーマ追加不要）

-- 7) ストリークRPC（連続日数）
create or replace function get_streak_days(p_user uuid)
returns int language sql stable as $$
with days as (
  select distinct date(created_at) d
  from progress_updates
  where user_id = p_user
),
r as (
  select d, lag(d) over(order by d) prev
  from days
),
grp as (
  select d, case when prev = d - interval '1 day' then 0 else 1 end as br
  from r
),
grp2 as (
  select d, sum(br) over(order by d) g
  from grp
),
latest_group as (
  select g from grp2 order by d desc limit 1
)
select count(*) from grp2 where g = (select g from latest_group);
$$;

-- RLS (Row Level Security) の設定
alter table profiles enable row level security;
alter table user_badges enable row level security;
alter table reactions enable row level security;
alter table rooms enable row level security;
alter table room_members enable row level security;
alter table messages enable row level security;

-- profiles: 自分のプロフィールのみ更新可能、全員が閲覧可能
create policy "profiles_select_all" on profiles for select to authenticated using (true);
create policy "profiles_update_own" on profiles for update to authenticated using (auth.uid() = id);
create policy "profiles_insert_own" on profiles for insert to authenticated with check (auth.uid() = id);

-- user_badges: 自分のバッジのみ閲覧可能
create policy "user_badges_select_own" on user_badges for select to authenticated using (auth.uid() = user_id);
create policy "user_badges_insert_admin" on user_badges for insert to authenticated with check (true); -- システムが挿入

-- reactions: 全員が閲覧可能、自分のリアクションのみ操作可能
create policy "reactions_select_all" on reactions for select to authenticated using (true);
create policy "reactions_insert_own" on reactions for insert to authenticated with check (auth.uid() = user_id);
create policy "reactions_delete_own" on reactions for delete to authenticated using (auth.uid() = user_id);

-- rooms: 参加者のみ閲覧可能
create policy "rooms_select_members" on rooms for select to authenticated using (
  exists (select 1 from room_members where room_id = rooms.id and user_id = auth.uid())
);

-- room_members: 参加者のみ閲覧可能
create policy "room_members_select_members" on room_members for select to authenticated using (
  room_id in (select room_id from room_members where user_id = auth.uid())
);

-- messages: 参加者のみ閲覧・投稿可能
create policy "messages_select_members" on messages for select to authenticated using (
  room_id in (select room_id from room_members where user_id = auth.uid())
);
create policy "messages_insert_members" on messages for insert to authenticated with check (
  auth.uid() = user_id and 
  room_id in (select room_id from room_members where user_id = auth.uid())
);
