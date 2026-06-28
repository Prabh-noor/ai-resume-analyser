-- Create tables using Supabase SQL editor

create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  email text,
  avatar_url text,
  created_at timestamptz default now()
);

-- Table stores one row per analysis, scoped to auth.users via user_id
create table if not exists public.resume_analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  file_name text not null,
  storage_path text not null,
  storage_full_path text not null,
  job_description text not null,
  resume_text text not null,
  page_count integer not null default 0,
  text_length integer not null default 0,
  ats_score integer not null check (ats_score >= 0 and ats_score <= 100),
  analysis jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.resume_analyses enable row level security;

comment on table public.resume_analyses is 'ATS resume analysis results keyed by Supabase auth user id';
comment on column public.resume_analyses.analysis is 'Structured Groq output: score, keywords, improvements, section scores';
