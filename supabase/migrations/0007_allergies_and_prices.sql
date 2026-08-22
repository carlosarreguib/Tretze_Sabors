-- ============================================================
-- 0007_allergies_and_prices.sql
-- 1. Tabla user_allergies: alergenos por usuario individual
-- 2. Tabla company_prices: precio acordado por empresa
-- ============================================================

-- 1. Alergias por usuario --------------------------------
create table public.user_allergies (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  alergenos  text[] not null default '{}',
  updated_at timestamptz not null default now()
);

create trigger user_allergies_set_updated_at
  before update on public.user_allergies
  for each row execute function public.tg_set_updated_at();

alter table public.user_allergies enable row level security;

-- El usuario ve y edita solo sus propias alergias
create policy "user_allergies: lectura propia"
  on public.user_allergies for select to authenticated
  using (user_id = (select auth.uid()));

create policy "user_allergies: escritura propia"
  on public.user_allergies for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- El admin ve todo
create policy "user_allergies: admin lectura"
  on public.user_allergies for select to authenticated
  using ((select public.is_admin()));

-- 2. Precios acordados por empresa -----------------------
-- precio_menu_cents:       precio del menú completo para esta empresa
-- precio_medio_menu_cents: precio del medio menú para esta empresa
create table public.company_prices (
  profile_id              uuid primary key references public.profiles(id) on delete cascade,
  precio_menu_cents       integer not null default 0 check (precio_menu_cents >= 0),
  precio_medio_menu_cents integer not null default 0 check (precio_medio_menu_cents >= 0),
  notas                   text,
  updated_at              timestamptz not null default now(),
  updated_by              uuid references auth.users(id)
);

create trigger company_prices_set_updated_at
  before update on public.company_prices
  for each row execute function public.tg_set_updated_at();

alter table public.company_prices enable row level security;

-- El cliente puede leer sus propios precios
create policy "company_prices: cliente lectura"
  on public.company_prices for select to authenticated
  using (
    profile_id = (select auth.uid())
    or exists (
      select 1 from public.company_users cu
      where cu.user_id = (select auth.uid())
        and cu.profile_id = company_prices.profile_id
    )
  );

-- Solo admin puede crear/editar precios
create policy "company_prices: admin todo"
  on public.company_prices for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));
