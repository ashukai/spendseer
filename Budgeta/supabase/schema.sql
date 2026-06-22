-- ============================================================
-- Budgeta schema
-- Apply this in the Supabase SQL editor (Project > SQL editor)
-- ============================================================

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- settings  (one row per user)
-- period_start_day: 1 = calendar month, 2-28 = salary-day cycle
-- ------------------------------------------------------------
create table if not exists settings (
  user_id            uuid primary key references auth.users(id) on delete cascade,
  home_currency      text        not null default 'AED',
  pinned_currencies  text[]      not null default '{AED,USD,EUR,JPY,GBP}',
  period_start_day   int         not null default 1
                                 check (period_start_day between 1 and 28),
  updated_at         timestamptz not null default now()
);

alter table settings enable row level security;

create policy "users own their settings"
  on settings for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ------------------------------------------------------------
-- categories
-- ------------------------------------------------------------
create table if not exists categories (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references auth.users(id) on delete cascade,
  name        text        not null,
  color       text        not null,
  icon        text        not null,
  sort_order  int         not null default 0,
  created_at  timestamptz not null default now(),
  deleted_at  timestamptz
);

alter table categories enable row level security;

create policy "users own their categories"
  on categories for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ------------------------------------------------------------
-- transactions
-- rate = home_currency per 1 unit of foreign currency
-- home_amount = amount * rate  (stored at save time, never re-calculated)
-- ------------------------------------------------------------
create table if not exists transactions (
  id          uuid           primary key default gen_random_uuid(),
  user_id     uuid           not null references auth.users(id) on delete cascade,
  amount      numeric(14,2)  not null,
  currency    text           not null,
  rate        numeric(18,8)  not null,
  home_amount numeric(14,2)  not null,
  category_id uuid           references categories(id) on delete set null,
  note        text,
  spent_at    timestamptz    not null default now(),
  created_at  timestamptz    not null default now(),
  deleted_at  timestamptz
);

alter table transactions enable row level security;

create policy "users own their transactions"
  on transactions for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ------------------------------------------------------------
-- Seed defaults on signup
-- ------------------------------------------------------------
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into settings (user_id) values (new.id);

  insert into categories (user_id, name, color, icon, sort_order) values
    (new.id, 'Food & Drink',  '#FF6B6B', 'tools-kitchen-2', 0),
    (new.id, 'Transport',     '#00B5A5', 'bus',              1),
    (new.id, 'Shopping',      '#F5A623', 'shopping-bag',     2),
    (new.id, 'Entertainment', '#7C6FFF', 'confetti',         3),
    (new.id, 'Health',        '#2DC88A', 'heart',            4),
    (new.id, 'Travel',        '#E8558A', 'plane',            5),
    (new.id, 'Other',         '#8A8AB0', 'box',              6);

  return new;
end;
$$;

-- Drop and recreate so re-running this script is safe
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();
