-- Academic profile (one per user)
create table public.academic_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  lang text not null default 'ar',
  scale_id text not null default 'benha',
  is_benha boolean not null default true,
  total_req integer not null default 136,
  uni_name text default '',
  major text default '',
  prev_gpa numeric(5,3) not null default 0,
  prev_cr integer not null default 0,
  semester text not null default '1',
  has_failed boolean not null default false,
  min_prev_sem_gpa numeric(5,3) not null default 0,
  grad_target numeric(5,3) not null default 3.0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.academic_profiles enable row level security;

create policy "Users view own profile"   on public.academic_profiles for select using (auth.uid() = user_id);
create policy "Users insert own profile" on public.academic_profiles for insert with check (auth.uid() = user_id);
create policy "Users update own profile" on public.academic_profiles for update using (auth.uid() = user_id);
create policy "Users delete own profile" on public.academic_profiles for delete using (auth.uid() = user_id);

-- Semesters
create table public.semesters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  label text not null,
  sem_type text not null default '1', -- '1' | '2' | 'summer'
  year integer,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index semesters_user_idx on public.semesters(user_id);

alter table public.semesters enable row level security;

create policy "Users view own semesters"   on public.semesters for select using (auth.uid() = user_id);
create policy "Users insert own semesters" on public.semesters for insert with check (auth.uid() = user_id);
create policy "Users update own semesters" on public.semesters for update using (auth.uid() = user_id);
create policy "Users delete own semesters" on public.semesters for delete using (auth.uid() = user_id);

-- Courses
create table public.courses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  semester_id uuid not null references public.semesters(id) on delete cascade,
  code text default '',
  name text not null,
  credits integer not null default 3,
  grade_letter text,           -- e.g. 'A+', 'B', 'F'
  grade_pts numeric(5,3),      -- corresponding points
  percentage numeric(5,2),     -- optional raw %
  is_failed boolean not null default false,
  created_at timestamptz not null default now()
);

create index courses_user_idx on public.courses(user_id);
create index courses_semester_idx on public.courses(semester_id);

alter table public.courses enable row level security;

create policy "Users view own courses"   on public.courses for select using (auth.uid() = user_id);
create policy "Users insert own courses" on public.courses for insert with check (auth.uid() = user_id);
create policy "Users update own courses" on public.courses for update using (auth.uid() = user_id);
create policy "Users delete own courses" on public.courses for delete using (auth.uid() = user_id);

-- updated_at trigger for academic_profiles
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create trigger academic_profiles_updated_at
  before update on public.academic_profiles
  for each row execute function public.set_updated_at();
