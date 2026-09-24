-- ============================================================================
-- School Agenda — Initial Schema
-- Multi-user school productivity PWA. Every table carries its own user_id
-- for simple, fast Row Level Security, even where it's reachable indirectly
-- through a parent row (school_years, periods, etc).
-- ============================================================================

create extension if not exists "pgcrypto";

-- ============================================================================
-- PROFILES
-- One row per auth user. Created automatically by a trigger on signup.
-- ============================================================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  school_name text,
  grade text,
  graduation_year integer,
  avatar_url text,
  avatar_shape text not null default 'circle' check (avatar_shape in ('circle','rounded','square')),
  welcome_message text,
  date_format text not null default 'MM/DD/YYYY' check (date_format in ('MM/DD/YYYY','DD/MM/YYYY','YYYY-MM-DD','Month D, YYYY')),
  time_format text not null default '12h' check (time_format in ('12h','24h')),
  active_school_year_id uuid, -- FK added after school_years exists
  setup_completed boolean not null default false,
  setup_step integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================================
-- SCHOOL YEARS
-- ============================================================================
create table public.school_years (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  is_active boolean not null default false,
  archived boolean not null default false,
  created_at timestamptz not null default now()
);
create index school_years_user_idx on public.school_years(user_id);

alter table public.profiles
  add constraint profiles_active_school_year_fkey
  foreign key (active_school_year_id) references public.school_years(id) on delete set null;

-- ============================================================================
-- PERIODS  (the permanent class/teacher/room record for "Period N")
-- ============================================================================
create table public.periods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  school_year_id uuid not null references public.school_years(id) on delete cascade,
  order_index integer not null,
  class_name text not null,
  teacher text,
  room text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index periods_school_year_idx on public.periods(school_year_id);

-- ============================================================================
-- BLOCK TIMES  (shared Block 1..6 + Lunch times for the Day 1-4 rotation)
-- ============================================================================
create table public.block_times (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  school_year_id uuid not null references public.school_years(id) on delete cascade,
  block_key text not null check (block_key in ('block1','block2','block3','lunch','block4','block5','block6')),
  start_time time not null,
  end_time time not null,
  unique (school_year_id, block_key)
);
create index block_times_school_year_idx on public.block_times(school_year_id);

-- ============================================================================
-- DAY TEMPLATES (Day 1 / Day 2 / Day 3 / Day 4) + their block->period mapping
-- ============================================================================
create table public.day_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  school_year_id uuid not null references public.school_years(id) on delete cascade,
  day_key text not null check (day_key in ('day1','day2','day3','day4')),
  unique (school_year_id, day_key)
);
create index day_templates_school_year_idx on public.day_templates(school_year_id);

create table public.day_template_blocks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  school_year_id uuid not null references public.school_years(id) on delete cascade, -- denormalized for easy "whole year" queries
  day_template_id uuid not null references public.day_templates(id) on delete cascade,
  block_key text not null check (block_key in ('block1','block2','block3','block4','block5','block6')),
  period_id uuid references public.periods(id) on delete set null, -- null = Free
  unique (day_template_id, block_key)
);
create index day_template_blocks_template_idx on public.day_template_blocks(day_template_id);
create index day_template_blocks_school_year_idx on public.day_template_blocks(school_year_id);
create index day_template_blocks_period_idx on public.day_template_blocks(period_id);

-- ============================================================================
-- ALL PERIODS MEET  (separate special-day schedule, not part of the rotation)
-- ============================================================================
create table public.all_periods_meet_schedules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  school_year_id uuid not null references public.school_years(id) on delete cascade unique
);

create table public.all_periods_meet_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  schedule_id uuid not null references public.all_periods_meet_schedules(id) on delete cascade,
  order_index integer not null default 0,
  period_id uuid references public.periods(id) on delete set null,
  label text,                 -- e.g. "Lunch/Block 3 Lab" — shown above the class/teacher/room
  name_override text,         -- used when not tied to a period (e.g. plain "Lunch")
  teacher_override text,
  room_override text,
  start_time time not null,
  end_time time not null,
  is_lunch boolean not null default false
);
create index apm_items_schedule_idx on public.all_periods_meet_items(schedule_id);

-- ============================================================================
-- ROTATION ANCHOR  (one reference date+day per school year; drives the engine)
-- ============================================================================
create table public.rotation_anchors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  school_year_id uuid not null references public.school_years(id) on delete cascade unique,
  reference_date date not null,
  reference_day text not null check (reference_day in ('day1','day2','day3','day4'))
);

-- ============================================================================
-- DATE OVERRIDES  (single-date overrides: Day X / All Periods Meet / No School)
-- ============================================================================
create table public.date_overrides (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  school_year_id uuid not null references public.school_years(id) on delete cascade,
  date date not null,
  override_type text not null check (override_type in ('day1','day2','day3','day4','all_periods_meet','no_school')),
  unique (school_year_id, date)
);
create index date_overrides_school_year_idx on public.date_overrides(school_year_id);

-- ============================================================================
-- SCHEDULE TIME OVERRIDES  (per-block time edits: single date, or from a date forward)
-- ============================================================================
create table public.schedule_time_overrides (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  school_year_id uuid not null references public.school_years(id) on delete cascade,
  block_key text not null check (block_key in ('block1','block2','block3','lunch','block4','block5','block6')),
  scope text not null check (scope in ('single_date','from_date')),
  effective_date date not null,
  start_time time not null,
  end_time time not null,
  created_at timestamptz not null default now()
);
create index sto_school_year_idx on public.schedule_time_overrides(school_year_id);

-- ============================================================================
-- ASSIGNMENTS
-- ============================================================================
create table public.assignments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  school_year_id uuid not null references public.school_years(id) on delete cascade,
  period_id uuid not null references public.periods(id) on delete cascade,
  name text not null,
  due_date date not null,
  due_time time,
  description text,
  priority text not null default 'normal' check (priority in ('low','normal','high')),
  completed boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index assignments_school_year_idx on public.assignments(school_year_id);
create index assignments_period_idx on public.assignments(period_id);
create index assignments_due_date_idx on public.assignments(due_date);

-- ============================================================================
-- CALENDAR EVENTS  (manually-added events; assignments render separately)
-- ============================================================================
create table public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  school_year_id uuid not null references public.school_years(id) on delete cascade,
  title text not null,
  date date not null,
  time time,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index calendar_events_school_year_idx on public.calendar_events(school_year_id);
create index calendar_events_date_idx on public.calendar_events(date);

-- ============================================================================
-- GRADES  (one cell per period x marking period)
-- ============================================================================
create table public.grades (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  school_year_id uuid not null references public.school_years(id) on delete cascade,
  period_id uuid not null references public.periods(id) on delete cascade,
  marking_period text not null check (marking_period in ('MP1','MP2','MP3','MP4')),
  grade_value text,
  updated_at timestamptz not null default now(),
  unique (period_id, marking_period)
);
create index grades_school_year_idx on public.grades(school_year_id);

-- ============================================================================
-- NOTES
-- ============================================================================
create table public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  school_year_id uuid not null references public.school_years(id) on delete cascade,
  type text not null check (type in ('class','general')),
  period_id uuid references public.periods(id) on delete cascade,
  title text not null default 'Untitled',
  content text not null default '',
  order_index integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index notes_school_year_idx on public.notes(school_year_id);
create index notes_period_idx on public.notes(period_id);

-- ============================================================================
-- updated_at trigger helper
-- ============================================================================
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger trg_periods_updated_at before update on public.periods
  for each row execute function public.set_updated_at();
create trigger trg_assignments_updated_at before update on public.assignments
  for each row execute function public.set_updated_at();
create trigger trg_calendar_events_updated_at before update on public.calendar_events
  for each row execute function public.set_updated_at();
create trigger trg_notes_updated_at before update on public.notes
  for each row execute function public.set_updated_at();
create trigger trg_grades_updated_at before update on public.grades
  for each row execute function public.set_updated_at();

-- ============================================================================
-- Auto-create a profile row when a new auth user signs up
-- ============================================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
-- Self-service account deletion (RPC).
-- Deleting the auth.users row cascades to every table above via ON DELETE CASCADE.
-- ============================================================================
create or replace function public.delete_user_account()
returns void language plpgsql security definer set search_path = public as $$
begin
  delete from auth.users where id = auth.uid();
end;
$$;

grant execute on function public.delete_user_account() to authenticated;

-- ============================================================================
-- ROW LEVEL SECURITY
-- Every table: a user may only see/change rows where user_id = auth.uid().
-- ============================================================================
alter table public.profiles enable row level security;
alter table public.school_years enable row level security;
alter table public.periods enable row level security;
alter table public.block_times enable row level security;
alter table public.day_templates enable row level security;
alter table public.day_template_blocks enable row level security;
alter table public.all_periods_meet_schedules enable row level security;
alter table public.all_periods_meet_items enable row level security;
alter table public.rotation_anchors enable row level security;
alter table public.date_overrides enable row level security;
alter table public.schedule_time_overrides enable row level security;
alter table public.assignments enable row level security;
alter table public.calendar_events enable row level security;
alter table public.grades enable row level security;
alter table public.notes enable row level security;

create policy "own profile" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

create policy "own school_years" on public.school_years
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own periods" on public.periods
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own block_times" on public.block_times
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own day_templates" on public.day_templates
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own day_template_blocks" on public.day_template_blocks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own apm_schedules" on public.all_periods_meet_schedules
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own apm_items" on public.all_periods_meet_items
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own rotation_anchors" on public.rotation_anchors
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own date_overrides" on public.date_overrides
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own schedule_time_overrides" on public.schedule_time_overrides
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own assignments" on public.assignments
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own calendar_events" on public.calendar_events
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own grades" on public.grades
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own notes" on public.notes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================================
-- REALTIME  (cross-device sync)
-- ============================================================================
alter publication supabase_realtime add table
  public.school_years,
  public.periods,
  public.block_times,
  public.day_templates,
  public.day_template_blocks,
  public.all_periods_meet_schedules,
  public.all_periods_meet_items,
  public.rotation_anchors,
  public.date_overrides,
  public.schedule_time_overrides,
  public.assignments,
  public.calendar_events,
  public.grades,
  public.notes,
  public.profiles;

-- ============================================================================
-- STORAGE  (profile pictures)
-- ============================================================================
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "avatar images are publicly readable"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "users upload their own avatar"
  on storage.objects for insert
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "users update their own avatar"
  on storage.objects for update
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "users delete their own avatar"
  on storage.objects for delete
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
