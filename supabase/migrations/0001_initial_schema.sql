-- ============================================================
-- Tretze Sabors - esquema inicial
-- ============================================================
create extension if not exists "pgcrypto";

-- ---------- Enums ----------
create type public.app_role        as enum ('client', 'admin');
create type public.plato_categoria as enum ('primer', 'segundo', 'postre', 'bebida');
create type public.pedido_estado   as enum ('pendiente', 'confirmado', 'entregado', 'cancelado');
create type public.metodo_pago     as enum ('transferencia', 'efectivo', 'domiciliacion');

-- ---------- updated_at helper ----------
create or replace function public.tg_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------- profiles ----------
create table public.profiles (
  id                 uuid primary key references auth.users (id) on delete cascade,
  role               public.app_role not null default 'client',
  company_name       text not null default '',
  contact_name       text not null default '',
  phone              text,
  delivery_address   text,
  payment_method     public.metodo_pago not null default 'transferencia',
  payment_notes      text,
  is_active          boolean not null default true,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  constraint profiles_phone_len check (phone is null or length(phone) between 6 and 30)
);

comment on table public.profiles is
  'Perfil de empresa/oficina. 1:1 con auth.users. role es la fuente de verdad de autorizacion.';

create index profiles_role_idx on public.profiles (role) where role = 'admin';

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.tg_set_updated_at();

-- ---------- creacion automatica de perfil al registrarse ----------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, role, company_name, contact_name, phone)
  values (
    new.id,
    'client',                                       -- NUNCA desde metadata del usuario
    coalesce(new.raw_user_meta_data ->> 'company_name', ''),
    coalesce(new.raw_user_meta_data ->> 'contact_name', ''),
    nullif(new.raw_user_meta_data ->> 'phone', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- helper de rol admin (evita recursion infinita en RLS) ----------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.role = 'admin'
      and p.is_active
  );
$$;

revoke execute on function public.is_admin() from public, anon;
grant  execute on function public.is_admin() to authenticated;

-- ---------- platos ----------
create table public.platos (
  id           uuid primary key default gen_random_uuid(),
  nombre       text not null,
  descripcion  text,
  image_path   text,
  categoria    public.plato_categoria not null,
  price_cents  integer not null,
  alergenos    text[] not null default '{}',
  is_active    boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint platos_nombre_no_vacio check (length(btrim(nombre)) > 0),
  constraint platos_price_positivo  check (price_cents >= 0),
  constraint platos_price_sano      check (price_cents <= 1000000)
);

create index platos_categoria_idx on public.platos (categoria) where is_active;
create index platos_alergenos_idx on public.platos using gin (alergenos);

create trigger platos_set_updated_at
  before update on public.platos
  for each row execute function public.tg_set_updated_at();

-- ---------- menus semanales ----------
create table public.menus_semanales (
  id           uuid primary key default gen_random_uuid(),
  anio         integer not null,
  semana_iso   integer not null,
  is_published boolean not null default false,
  published_at timestamptz,
  notes        text,
  created_by   uuid references public.profiles (id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint menus_semana_valida check (semana_iso between 1 and 53),
  constraint menus_anio_valido   check (anio between 2024 and 2100),
  constraint menus_anio_semana_uk unique (anio, semana_iso)
);

create index menus_publicados_idx
  on public.menus_semanales (anio desc, semana_iso desc)
  where is_published;

create trigger menus_set_updated_at
  before update on public.menus_semanales
  for each row execute function public.tg_set_updated_at();

create table public.menu_items (
  id         uuid primary key default gen_random_uuid(),
  menu_id    uuid not null references public.menus_semanales (id) on delete cascade,
  plato_id   uuid not null references public.platos (id)          on delete restrict,
  menu_date  date not null,
  sort_order smallint not null default 0,
  created_at timestamptz not null default now(),
  constraint menu_items_dia_laborable check (extract(isodow from menu_date) between 1 and 6),
  constraint menu_items_unico unique (menu_id, menu_date, plato_id)
);

create index menu_items_menu_idx  on public.menu_items (menu_id, menu_date);
create index menu_items_fecha_idx on public.menu_items (menu_date);
create index menu_items_plato_idx on public.menu_items (plato_id);

-- La fecha debe pertenecer a la semana ISO del menu padre.
-- Un CHECK no puede consultar la fila padre, por eso es un trigger.
create or replace function public.tg_menu_item_valida_semana()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  m record;
begin
  select anio, semana_iso into m
  from public.menus_semanales where id = new.menu_id;

  -- isoyear, no year: 2026-12-31 es la semana 1 de 2027
  if extract(isoyear from new.menu_date)::int <> m.anio
     or extract(week   from new.menu_date)::int <> m.semana_iso then
    raise exception
      'La fecha % no pertenece a la semana ISO %-%', new.menu_date, m.anio, m.semana_iso
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

create trigger menu_items_valida_semana
  before insert or update of menu_date, menu_id on public.menu_items
  for each row execute function public.tg_menu_item_valida_semana();

-- ---------- pedidos ----------
create table public.pedidos (
  id             uuid primary key default gen_random_uuid(),
  profile_id     uuid not null references public.profiles (id) on delete restrict,
  delivery_date  date not null,
  slot_start     time not null,
  estado         public.pedido_estado not null default 'pendiente',
  notes          text,
  total_cents    integer not null default 0,
  cancelled_at   timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  -- 12:00-16:00 en tramos de 30 min => 12:00, 12:30, ..., 15:30
  constraint pedidos_slot_rango check (slot_start >= time '12:00' and slot_start <= time '15:30'),
  constraint pedidos_slot_media_hora check (
    extract(minute from slot_start) in (0, 30)
    and extract(second from slot_start) = 0
  ),
  constraint pedidos_dia_laborable check (extract(isodow from delivery_date) between 1 and 6),
  constraint pedidos_total_no_negativo check (total_cents >= 0),
  constraint pedidos_unico_por_dia unique (profile_id, delivery_date)
);

create index pedidos_profile_fecha_idx on public.pedidos (profile_id, delivery_date desc);
create index pedidos_fecha_estado_idx  on public.pedidos (delivery_date, estado);
create index pedidos_estado_idx        on public.pedidos (estado) where estado = 'pendiente';

create trigger pedidos_set_updated_at
  before update on public.pedidos
  for each row execute function public.tg_set_updated_at();

create table public.pedido_items (
  id                   uuid primary key default gen_random_uuid(),
  pedido_id            uuid not null references public.pedidos (id) on delete cascade,
  plato_id             uuid not null references public.platos (id)  on delete restrict,
  quantity             integer not null,
  price_cents_at_order integer not null,
  nombre_at_order      text not null,
  subtotal_cents       integer generated always as (quantity * price_cents_at_order) stored,
  created_at           timestamptz not null default now(),
  constraint pedido_items_qty_positivo check (quantity > 0 and quantity <= 500),
  constraint pedido_items_precio_no_negativo check (price_cents_at_order >= 0),
  constraint pedido_items_unico unique (pedido_id, plato_id)
);

create index pedido_items_pedido_idx on public.pedido_items (pedido_id);
create index pedido_items_plato_idx  on public.pedido_items (plato_id);
