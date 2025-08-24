-- Users are managed by Supabase Auth; we store profile and subscription

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamp with time zone default now()
);

create table if not exists public.subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  status text not null,
  current_period_end timestamp with time zone,
  stripe_customer_id text,
  stripe_subscription_id text,
  updated_at timestamp with time zone default now()
);

-- Optional usage tracking (per day)
create table if not exists public.usage (
  user_id uuid references auth.users(id) on delete cascade,
  day date not null,
  requests integer not null default 0,
  primary key (user_id, day)
);

-- RLS policies
alter table public.profiles enable row level security;
alter table public.subscriptions enable row level security;
alter table public.usage enable row level security;

-- Profiles: users can read/update own row
create policy if not exists profiles_select_self on public.profiles
  for select using (auth.uid() = user_id);
create policy if not exists profiles_upsert_self on public.profiles
  for insert with check (auth.uid() = user_id);
create policy if not exists profiles_update_self on public.profiles
  for update using (auth.uid() = user_id);

-- Subscriptions: users can read own row
create policy if not exists subscriptions_select_self on public.subscriptions
  for select using (auth.uid() = user_id);

-- Usage: users can read own row
create policy if not exists usage_select_self on public.usage
  for select using (auth.uid() = user_id);

