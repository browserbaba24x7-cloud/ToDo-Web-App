alter table public.device_sessions
  add column if not exists revoked_at timestamptz;

create table if not exists public.device_session_revocations (
  user_id uuid primary key references auth.users(id) on delete cascade,
  revoked_before timestamptz not null,
  kept_session_id uuid not null
);

alter table public.device_session_revocations enable row level security;
revoke all on table public.device_session_revocations from anon, authenticated;

drop policy if exists "Users can insert own device sessions" on public.device_sessions;
drop policy if exists "Users can update own device sessions" on public.device_sessions;
drop policy if exists "Users can delete own device sessions" on public.device_sessions;

create or replace function public.register_device_session(p_device_label text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_session_id uuid := (auth.jwt() ->> 'session_id')::uuid;
  v_rows integer;
begin
  if v_user_id is null or v_session_id is null then
    raise exception 'Authenticated device session is required';
  end if;

  if exists (
    select 1
    from public.device_session_revocations
    where user_id = v_user_id
      and kept_session_id <> v_session_id
      and (
        auth.jwt() ->> 'iat' is null
        or pg_catalog.to_timestamp((auth.jwt() ->> 'iat')::double precision) <= revoked_before
      )
  ) then
    return false;
  end if;

  insert into public.device_sessions (user_id, session_id, device_label)
  values (v_user_id, v_session_id, left(p_device_label, 120))
  on conflict (user_id, session_id) do update
    set device_label = excluded.device_label
    where public.device_sessions.revoked_at is null;

  get diagnostics v_rows = row_count;
  return v_rows = 1;
end;
$$;

create or replace function public.revoke_other_device_sessions()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_session_id uuid := (auth.jwt() ->> 'session_id')::uuid;
  v_rows integer;
begin
  if v_user_id is null or v_session_id is null then
    raise exception 'Authenticated device session is required';
  end if;

  insert into public.device_session_revocations (user_id, revoked_before, kept_session_id)
  values (v_user_id, now(), v_session_id)
  on conflict (user_id) do update
    set revoked_before = excluded.revoked_before,
        kept_session_id = excluded.kept_session_id;

  update public.device_sessions
  set revoked_at = now()
  where user_id = v_user_id
    and session_id <> v_session_id
    and revoked_at is null;

  get diagnostics v_rows = row_count;
  return v_rows;
end;
$$;

create or replace function public.is_current_device_session_active()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when auth.uid() is null or (auth.jwt() ->> 'session_id') is null then false
    else not exists (
      select 1
      from public.device_sessions
      where user_id = auth.uid()
        and session_id = (auth.jwt() ->> 'session_id')::uuid
        and revoked_at is not null
    )
    and not exists (
      select 1
      from public.device_session_revocations
      where user_id = auth.uid()
        and kept_session_id <> (auth.jwt() ->> 'session_id')::uuid
        and (
          auth.jwt() ->> 'iat' is null
          or pg_catalog.to_timestamp((auth.jwt() ->> 'iat')::double precision) <= revoked_before
        )
    )
  end;
$$;

revoke all on function public.register_device_session(text) from public, anon;
revoke all on function public.revoke_other_device_sessions() from public, anon;
revoke all on function public.is_current_device_session_active() from public, anon;
grant execute on function public.register_device_session(text) to authenticated;
grant execute on function public.revoke_other_device_sessions() to authenticated;
grant execute on function public.is_current_device_session_active() to authenticated;

drop policy if exists "Users can view own projects" on public.projects;
create policy "Users can view own projects"
  on public.projects for select
  using (auth.uid() = user_id and public.is_current_device_session_active());

drop policy if exists "Users can insert own projects" on public.projects;
create policy "Users can insert own projects"
  on public.projects for insert
  with check (auth.uid() = user_id and public.is_current_device_session_active());

drop policy if exists "Users can update own projects" on public.projects;
create policy "Users can update own projects"
  on public.projects for update
  using (auth.uid() = user_id and public.is_current_device_session_active())
  with check (auth.uid() = user_id and public.is_current_device_session_active());

drop policy if exists "Users can delete own projects" on public.projects;
create policy "Users can delete own projects"
  on public.projects for delete
  using (auth.uid() = user_id and public.is_current_device_session_active());

drop policy if exists "Users can view own tasks" on public.tasks;
create policy "Users can view own tasks"
  on public.tasks for select
  using (auth.uid() = user_id and public.is_current_device_session_active());

drop policy if exists "Users can insert own tasks" on public.tasks;
create policy "Users can insert own tasks"
  on public.tasks for insert
  with check (
    auth.uid() = user_id
    and public.is_current_device_session_active()
    and (
      project_id is null
      or exists (
        select 1
        from public.projects
        where projects.id = tasks.project_id
          and projects.user_id = auth.uid()
      )
    )
  );

drop policy if exists "Users can update own tasks" on public.tasks;
create policy "Users can update own tasks"
  on public.tasks for update
  using (auth.uid() = user_id and public.is_current_device_session_active())
  with check (
    auth.uid() = user_id
    and public.is_current_device_session_active()
    and (
      project_id is null
      or exists (
        select 1
        from public.projects
        where projects.id = tasks.project_id
          and projects.user_id = auth.uid()
      )
    )
  );

drop policy if exists "Users can delete own tasks" on public.tasks;
create policy "Users can delete own tasks"
  on public.tasks for delete
  using (auth.uid() = user_id and public.is_current_device_session_active());
