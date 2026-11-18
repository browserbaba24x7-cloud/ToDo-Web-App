create table if not exists public.device_sessions (
  user_id uuid not null references auth.users(id) on delete cascade,
  session_id uuid not null,
  device_label text not null,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  primary key (user_id, session_id)
);

create index if not exists device_sessions_user_last_seen_idx
  on public.device_sessions(user_id, last_seen_at desc);

alter table public.device_sessions enable row level security;

create or replace function public.set_device_session_timestamps()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    new.created_at := now();
  else
    new.created_at := old.created_at;
  end if;
  new.last_seen_at := now();
  return new;
end;
$$;

drop trigger if exists set_device_session_timestamps on public.device_sessions;
create trigger set_device_session_timestamps
  before insert or update on public.device_sessions
  for each row execute function public.set_device_session_timestamps();

drop policy if exists "Users can view own device sessions" on public.device_sessions;
create policy "Users can view own device sessions"
  on public.device_sessions for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own device sessions" on public.device_sessions;
create policy "Users can insert own device sessions"
  on public.device_sessions for insert
  with check (
    auth.uid() = user_id
    and session_id = (auth.jwt() ->> 'session_id')::uuid
  );

drop policy if exists "Users can update own device sessions" on public.device_sessions;
create policy "Users can update own device sessions"
  on public.device_sessions for update
  using (
    auth.uid() = user_id
    and session_id = (auth.jwt() ->> 'session_id')::uuid
  )
  with check (
    auth.uid() = user_id
    and session_id = (auth.jwt() ->> 'session_id')::uuid
  );

drop policy if exists "Users can delete own device sessions" on public.device_sessions;
create policy "Users can delete own device sessions"
  on public.device_sessions for delete
  using (auth.uid() = user_id);
