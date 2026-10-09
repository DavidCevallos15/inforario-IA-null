-- Esquema base de Inforario tal como existía en producción antes de versionarlo.
-- Idempotente: se puede ejecutar sobre una base vacía o sobre la existente.

create table if not exists public.profiles (
  id uuid primary key references auth.users (id),
  full_name text,
  avatar_url text,
  email text,
  updated_at timestamptz default now()
);

create table if not exists public.schedules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id),
  title text not null default 'Mi Horario',
  academic_period text,
  faculty text,
  schedule_data jsonb not null,
  is_public boolean default false,
  created_at timestamptz default now(),
  last_updated timestamptz default now()
);

create table if not exists public.user_calendar_tokens (
  user_id uuid primary key references auth.users (id),
  access_token text,
  refresh_token text,
  expiry_date timestamptz
);

alter table public.profiles enable row level security;
alter table public.schedules enable row level security;
alter table public.user_calendar_tokens enable row level security;

-- Crea el perfil al registrarse un usuario
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.profiles (id, full_name, avatar_url, email)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url', new.email);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
