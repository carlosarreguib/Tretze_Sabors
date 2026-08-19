-- ============================================================
-- Tretze Sabors - precios congelados, totales y cierre de pedidos
-- ============================================================

-- ------------------------------------------------------------
-- 1. El precio lo fija el servidor, NUNCA el cliente.
--    La tabla es accesible por PostgREST con la clave anonima
--    (que viaja en el bundle del navegador), asi que calcular
--    el precio en una Server Action no protege nada.
-- ------------------------------------------------------------
create or replace function public.tg_pedido_item_snapshot()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  p record;
begin
  select price_cents, nombre, is_active into p
  from public.platos where id = new.plato_id;

  if not found then
    raise exception 'Plato inexistente' using errcode = 'foreign_key_violation';
  end if;

  if tg_op = 'INSERT' and not p.is_active then
    raise exception 'El plato "%" no esta disponible', p.nombre using errcode = 'check_violation';
  end if;

  -- Se ignora cualquier precio enviado por el cliente.
  new.price_cents_at_order := p.price_cents;
  new.nombre_at_order      := p.nombre;
  return new;
end;
$$;

create trigger pedido_items_snapshot
  before insert on public.pedido_items
  for each row execute function public.tg_pedido_item_snapshot();

-- Congelado tras la creacion: ni el cliente ni el admin reescriben el historico.
create or replace function public.tg_pedido_item_precio_inmutable()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.price_cents_at_order := old.price_cents_at_order;
  new.nombre_at_order      := old.nombre_at_order;
  new.plato_id             := old.plato_id;
  return new;
end;
$$;

create trigger pedido_items_precio_inmutable
  before update on public.pedido_items
  for each row execute function public.tg_pedido_item_precio_inmutable();

-- ------------------------------------------------------------
-- 2. Total del pedido.
--    No puede ser columna generada porque cruza tablas.
--    SECURITY DEFINER: debe poder escribir en pedidos aunque la
--    politica del cliente ya este cerrada por el cutoff.
-- ------------------------------------------------------------
create or replace function public.tg_recalcular_total()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_pedido uuid := coalesce(new.pedido_id, old.pedido_id);
begin
  update public.pedidos p
     set total_cents = coalesce(
           (select sum(i.subtotal_cents) from public.pedido_items i where i.pedido_id = v_pedido), 0)
   where p.id = v_pedido;
  return null;
end;
$$;

create trigger pedido_items_recalcula_total
  after insert or update or delete on public.pedido_items
  for each row execute function public.tg_recalcular_total();

-- ------------------------------------------------------------
-- 3. Configuracion de la aplicacion (cutoff editable sin migracion)
-- ------------------------------------------------------------
create table public.app_settings (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz not null default now()
);

insert into public.app_settings (key, value) values
  ('cutoff', '{"days_before": 1, "hour": 10, "minute": 0, "timezone": "Europe/Madrid"}')
on conflict (key) do nothing;

create trigger app_settings_set_updated_at
  before update on public.app_settings
  for each row execute function public.tg_set_updated_at();

-- ------------------------------------------------------------
-- 4. Cierre de pedidos (cutoff)
--    'at time zone Europe/Madrid' mantiene el corte a las 10:00
--    hora local al cambiar de CET a CEST.
-- ------------------------------------------------------------
create or replace function public.cutoff_para(p_delivery_date date)
returns timestamptz
language sql
stable
set search_path = ''
as $$
  select ((p_delivery_date - ((value->>'days_before')::int))
          + make_time((value->>'hour')::int, (value->>'minute')::int, 0))
         at time zone (value->>'timezone')
  from public.app_settings where key = 'cutoff';
$$;

create or replace function public.pedido_editable(p_delivery_date date)
returns boolean
language sql
stable
set search_path = ''
as $$
  select now() < public.cutoff_para(p_delivery_date);
$$;

grant execute on function public.cutoff_para(date), public.pedido_editable(date) to authenticated;

create or replace function public.tg_pedido_cutoff()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_date date := coalesce(new.delivery_date, old.delivery_date);
begin
  if public.is_admin() then          -- el admin siempre puede corregir
    return coalesce(new, old);
  end if;

  if not public.pedido_editable(v_date) then
    raise exception
      'El plazo para pedidos del % finalizo el %',
      v_date, to_char(public.cutoff_para(v_date), 'DD/MM/YYYY HH24:MI')
      using errcode = 'check_violation';
  end if;

  -- un cliente no puede cambiar el estado mas alla de cancelar
  if tg_op = 'UPDATE' and new.estado is distinct from old.estado
     and new.estado <> 'cancelado' then
    raise exception 'No puede modificar el estado del pedido' using errcode = 'insufficient_privilege';
  end if;

  return coalesce(new, old);
end;
$$;

create trigger pedidos_cutoff
  before insert or update or delete on public.pedidos
  for each row execute function public.tg_pedido_cutoff();

-- El cutoff debe cubrir tambien las lineas: si no, el cliente congela
-- la cabecera antes del corte y sigue anadiendo platos despues.
create or replace function public.tg_pedido_item_cutoff()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_date date;
begin
  if public.is_admin() then return coalesce(new, old); end if;

  select delivery_date into v_date
  from public.pedidos where id = coalesce(new.pedido_id, old.pedido_id);

  if not public.pedido_editable(v_date) then
    raise exception 'El plazo para modificar el pedido del % ha finalizado', v_date
      using errcode = 'check_violation';
  end if;
  return coalesce(new, old);
end;
$$;

create trigger pedido_items_cutoff
  before insert or update or delete on public.pedido_items
  for each row execute function public.tg_pedido_item_cutoff();

-- ------------------------------------------------------------
-- 5. Solo se pueden pedir platos que esten en el menu publicado de ese dia
-- ------------------------------------------------------------
create or replace function public.tg_pedido_item_en_menu()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_date date;
begin
  select delivery_date into v_date from public.pedidos where id = new.pedido_id;
  if not exists (
    select 1 from public.menu_items mi
    join public.menus_semanales m on m.id = mi.menu_id
    where mi.plato_id = new.plato_id and mi.menu_date = v_date and m.is_published
  ) then
    raise exception 'Ese plato no esta en el menu del %', v_date using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

create trigger pedido_items_en_menu
  before insert on public.pedido_items
  for each row execute function public.tg_pedido_item_en_menu();
