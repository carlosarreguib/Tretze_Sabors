-- ============================================================
-- Tretze Sabors - Gestion de usuarios por empresa
-- ============================================================

-- ------------------------------------------------------------
-- 1. Tabla company_users
--    Un usuario individual (auth.users) pertenece a exactamente
--    una empresa (profiles). El email es fuente de verdad de
--    auth.users, no se duplica aqui.
-- ------------------------------------------------------------
create table public.company_users (
  id          uuid primary key default gen_random_uuid(),
  profile_id  uuid not null references public.profiles(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  first_name  text not null,
  last_name_1 text not null,
  last_name_2 text,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint company_users_user_unique unique (user_id)
);

comment on table public.company_users is
  'Usuarios individuales de cada empresa. Un usuario pertenece a exactamente '
  'una empresa (profile). El email vive en auth.users, no aqui.';

comment on column public.company_users.profile_id is
  'Empresa a la que pertenece el usuario. Pedidos y facturas siguen '
  'vinculados a este profile_id, no al user_id individual.';

create index company_users_profile_idx on public.company_users (profile_id);
create index company_users_user_idx    on public.company_users (user_id);

create trigger company_users_set_updated_at
  before update on public.company_users
  for each row execute function public.tg_set_updated_at();

-- ------------------------------------------------------------
-- 2. Modificar handle_new_user para saltarse la creacion de
--    profile cuando el usuario viene de una invite de empresa.
--    La invite pasa skip_profile_creation=true en raw_user_meta_data.
-- ------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Invites de usuarios de empresa: no crear profile (la empresa ya existe)
  if (new.raw_user_meta_data->>'skip_profile_creation')::boolean is true then
    return new;
  end if;

  insert into public.profiles (id, role, company_name, contact_name, phone)
  values (
    new.id,
    'client',
    coalesce(new.raw_user_meta_data ->> 'company_name', ''),
    coalesce(new.raw_user_meta_data ->> 'contact_name', ''),
    nullif(new.raw_user_meta_data ->> 'phone', '')
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

-- ------------------------------------------------------------
-- 3. RLS en company_users
-- ------------------------------------------------------------
alter table public.company_users enable row level security;

-- El usuario ve solo su propia fila (para saber a que empresa pertenece)
create policy "company_users: lectura propia"
  on public.company_users for select to authenticated
  using (user_id = (select auth.uid()));

-- El admin ve y gestiona todos (pero los writes van via service_role en las actions)
create policy "company_users: admin lee todos"
  on public.company_users for select to authenticated
  using ((select public.is_admin()));

create policy "company_users: admin escribe todos"
  on public.company_users for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- Los usuarios autenticados no pueden escribir directamente:
-- todo INSERT/UPDATE/DELETE pasa por Server Actions con exigirAdmin()
-- que usan el cliente service_role (bypassea RLS).
-- La policy de admin escribe cubre el caso de que en el futuro
-- se permita acceso vía PostgREST con token de admin.
