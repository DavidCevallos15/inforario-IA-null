-- Endurecimiento de seguridad y rendimiento (auditoría 2026-10).

-- ---------------------------------------------------------------
-- profiles: faltaba la política INSERT (el upsert del perfil fallaba)
-- ---------------------------------------------------------------
drop policy if exists "Users can view own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists profiles_select_own on public.profiles;
drop policy if exists profiles_insert_own on public.profiles;
drop policy if exists profiles_update_own on public.profiles;

create policy profiles_select_own on public.profiles
  for select to authenticated using ((select auth.uid()) = id);
create policy profiles_insert_own on public.profiles
  for insert to authenticated with check ((select auth.uid()) = id);
create policy profiles_update_own on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

-- ---------------------------------------------------------------
-- schedules: (select auth.uid()) evalúa una sola vez por consulta
-- ---------------------------------------------------------------
drop policy if exists "Users can view own schedules" on public.schedules;
drop policy if exists "Users can insert own schedules" on public.schedules;
drop policy if exists "Users can update own schedules" on public.schedules;
drop policy if exists "Users can delete own schedules" on public.schedules;
drop policy if exists schedules_select_own on public.schedules;
drop policy if exists schedules_insert_own on public.schedules;
drop policy if exists schedules_update_own on public.schedules;
drop policy if exists schedules_delete_own on public.schedules;

create policy schedules_select_own on public.schedules
  for select to authenticated using ((select auth.uid()) = user_id);
create policy schedules_insert_own on public.schedules
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy schedules_update_own on public.schedules
  for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy schedules_delete_own on public.schedules
  for delete to authenticated using ((select auth.uid()) = user_id);

create index if not exists schedules_user_id_last_updated_idx
  on public.schedules (user_id, last_updated desc);

alter table public.schedules drop constraint if exists schedules_title_length;
alter table public.schedules add constraint schedules_title_length
  check (char_length(title) between 1 and 120);
alter table public.schedules drop constraint if exists schedules_data_is_array;
alter table public.schedules add constraint schedules_data_is_array
  check (jsonb_typeof(schedule_data) = 'array');
alter table public.schedules drop constraint if exists schedules_data_size;
alter table public.schedules add constraint schedules_data_size
  check (pg_column_size(schedule_data) <= 262144);

-- Los invitados no usan la base de datos
revoke all on public.profiles, public.schedules from anon;
revoke truncate, references, trigger on public.profiles, public.schedules from authenticated;

-- ---------------------------------------------------------------
-- user_calendar_tokens: solo el servidor (service role) escribe tokens.
-- El cliente únicamente puede comprobar si su cuenta está vinculada.
-- ---------------------------------------------------------------
drop policy if exists user_calendar_tokens_insert_own on public.user_calendar_tokens;
drop policy if exists user_calendar_tokens_update_own on public.user_calendar_tokens;
revoke all on public.user_calendar_tokens from anon, authenticated;
grant select (user_id, expiry_date) on public.user_calendar_tokens to authenticated;

-- ---------------------------------------------------------------
-- handle_new_user: search_path fijo y no invocable vía API
-- ---------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, avatar_url, email)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url', new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- ---------------------------------------------------------------
-- Límite de uso de la extracción por IA (extract-schedule es pública)
-- ---------------------------------------------------------------
create table if not exists public.ai_extraction_requests (
  id bigint generated always as identity primary key,
  client_key text not null,
  created_at timestamptz not null default now()
);

create index if not exists ai_extraction_requests_key_created_idx
  on public.ai_extraction_requests (client_key, created_at desc);

-- RLS sin políticas: solo accesible con service role
alter table public.ai_extraction_requests enable row level security;
revoke all on public.ai_extraction_requests from anon, authenticated;

-- Registra una petición y devuelve false si el cliente superó el límite de la ventana
create or replace function public.consume_ai_extraction_quota(
  p_client_key text,
  p_limit integer,
  p_window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count integer;
begin
  perform pg_advisory_xact_lock(hashtext(p_client_key));

  delete from public.ai_extraction_requests where created_at < now() - interval '1 day';

  select count(*) into v_count
  from public.ai_extraction_requests
  where client_key = p_client_key
    and created_at > now() - make_interval(secs => p_window_seconds);

  if v_count >= p_limit then
    return false;
  end if;

  insert into public.ai_extraction_requests (client_key) values (p_client_key);
  return true;
end;
$$;

revoke execute on function public.consume_ai_extraction_quota(text, integer, integer) from public, anon, authenticated;
grant execute on function public.consume_ai_extraction_quota(text, integer, integer) to service_role;
