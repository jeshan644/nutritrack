import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const supabase =
  supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

export const isSupabaseReady = !!supabase;

// ─── Session ID ───────────────────────────────────────────────────────────────
// One tiny UUID in localStorage identifies this user's data in Supabase.
// No account / login needed. User can write it down and restore data on any device.

const SESSION_KEY = 'nt_session_id';

export function getSessionId(): string {
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

export function setSessionId(id: string): void {
  localStorage.setItem(SESSION_KEY, id.trim());
}

// ─── SQL setup (run once in Supabase SQL editor) ──────────────────────────────
/*
-- food_log
create table food_log (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  date date not null,
  meal_type text not null,
  name text not null,
  calories float not null default 0,
  protein float not null default 0,
  carbs float not null default 0,
  fat float not null default 0,
  fiber float not null default 0,
  quantity_g float,
  source text,
  logged_at timestamptz not null default now()
);
alter table food_log enable row level security;
create policy "public access" on food_log for all using (true) with check (true);
create index on food_log (session_id, date);

-- recipes
create table recipes (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  name text not null,
  servings int not null default 1,
  ingredients jsonb not null default '[]',
  nutrition_per_serving jsonb,
  created_at timestamptz not null default now()
);
alter table recipes enable row level security;
create policy "public access" on recipes for all using (true) with check (true);

-- settings
create table settings (
  session_id text primary key,
  name text default '',
  sex text default 'male',
  age int default 25,
  weight_kg float default 75,
  height_cm float default 175,
  activity_level text default 'moderate',
  calorie_goal int default 2000,
  protein_goal int default 150,
  carbs_goal int default 200,
  fat_goal int default 65,
  fiber_goal int default 30,
  updated_at timestamptz not null default now()
);
alter table settings enable row level security;
create policy "public access" on settings for all using (true) with check (true);
*/
