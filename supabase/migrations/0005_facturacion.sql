-- ============================================================
-- Tretze Sabors - Facturacion
-- ============================================================

create type public.factura_estado      as enum ('borrador', 'cerrada', 'emitida', 'pagada', 'anulada');
create type public.factura_linea_tipo  as enum ('consumo', 'ajuste');

-- ------------------------------------------------------------
-- 1. Datos fiscales en profiles.
--    Nullable: las empresas existentes no los tienen todavia.
--    Se exigen en la aplicacion al generar el PDF, no aqui.
-- ------------------------------------------------------------
alter table public.profiles
  add column nif             text,
  add column legal_name      text,
  add column billing_address text;

comment on column public.profiles.nif is
  'NIF/CIF de la empresa cliente. Obligatorio para generar factura, no para usar la app.';
comment on column public.profiles.legal_name is
  'Razon social si difiere de company_name. Si es null, la factura usa company_name.';

-- Las columnas nuevas no son escribibles por el cliente hasta concederlo:
-- 0003_rls.sql revoco "update" generico sobre profiles.
grant update (nif, legal_name, billing_address) on public.profiles to authenticated;

-- ------------------------------------------------------------
-- 2. Configuracion de IVA. Tabla propia (no app_settings): el trigger
--    de recalculo la lee en cada operacion sobre lineas de factura y
--    un entero tipado evita castear jsonb en cada fila.
-- ------------------------------------------------------------
create table public.facturacion_config (
  id           smallint primary key default 1,
  iva_rate_bps integer not null default 1000,  -- basis points: 1000 = 10.00%
  constraint facturacion_config_singleton check (id = 1),
  constraint facturacion_config_iva_rango check (iva_rate_bps between 0 and 10000)
);

insert into public.facturacion_config (id, iva_rate_bps) values (1, 1000);

comment on table public.facturacion_config is
  'Fila unica (id=1). Tipo de IVA vigente en basis points (1000 = 10%). '
  'Cambiarlo no afecta a facturas ya generadas: el tipo se congela en facturas.iva_rate_bps.';

-- ------------------------------------------------------------
-- 3. Numeracion secuencial anual, segura ante condiciones de carrera:
--    fila por anio con UPDATE bloqueante, nunca max()+1.
-- ------------------------------------------------------------
create table public.factura_numero_seq (
  anio   integer primary key,
  ultimo integer not null default 0
);

create or replace function public.siguiente_numero_factura(p_anio integer)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_num integer;
begin
  insert into public.factura_numero_seq (anio, ultimo)
  values (p_anio, 0)
  on conflict (anio) do nothing;

  update public.factura_numero_seq
     set ultimo = ultimo + 1
   where anio = p_anio
  returning ultimo into v_num;

  return p_anio || '-' || lpad(v_num::text, 4, '0');
end;
$$;

-- Solo la invoca cerrar_periodo_factura(); llamarla suelta desde fuera
-- podria dejar huecos en la secuencia si el INSERT de facturas fallara despues.
revoke execute on function public.siguiente_numero_factura(integer) from public, anon, authenticated;

-- ------------------------------------------------------------
-- 4. facturas: una fila por empresa y mes.
-- ------------------------------------------------------------
create table public.facturas (
  id                    uuid primary key default gen_random_uuid(),
  profile_id            uuid not null references public.profiles (id) on delete restrict,
  anio                  integer not null,
  mes                   integer not null,
  numero                text,
  estado                public.factura_estado not null default 'borrador',
  iva_rate_bps          integer,
  base_cents            integer not null default 0,
  iva_cents             integer not null default 0,
  total_cents           integer not null default 0,
  fecha_cierre          timestamptz,
  fecha_emision         timestamptz,
  fecha_pago            timestamptz,
  factura_rectifica_id  uuid references public.facturas (id) on delete restrict,
  notes                 text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  constraint facturas_mes_valido check (mes between 1 and 12),
  constraint facturas_anio_valido check (anio between 2024 and 2100),
  constraint facturas_totales_no_negativos check (base_cents >= 0 and iva_cents >= 0 and total_cents >= 0),
  constraint facturas_unico_periodo unique (profile_id, anio, mes),
  constraint facturas_numero_solo_si_cerrada check (
    (estado = 'borrador' and numero is null)
    or (estado <> 'borrador' and numero is not null)
  )
);

create unique index facturas_numero_uk on public.facturas (numero) where numero is not null;
create index facturas_profile_periodo_idx on public.facturas (profile_id, anio desc, mes desc);
create index facturas_estado_idx on public.facturas (estado);

create trigger facturas_set_updated_at
  before update on public.facturas
  for each row execute function public.tg_set_updated_at();

comment on table public.facturas is
  'Una fila por empresa y mes. Nace en borrador (sin numero); cerrar_periodo_factura() '
  'la congela y le asigna numero secuencial anual.';

-- ------------------------------------------------------------
-- 5. factura_lineas: lineas de consumo (una por pedido_item, snapshot
--    trazable) y lineas de ajuste (manuales, admin, precio con o sin
--    signo para descuento/recargo).
-- ------------------------------------------------------------
create table public.factura_lineas (
  id             uuid primary key default gen_random_uuid(),
  factura_id     uuid not null references public.facturas (id) on delete cascade,
  tipo           public.factura_linea_tipo not null,
  fecha          date not null,
  categoria      public.plato_categoria,
  descripcion    text not null,
  quantity       integer not null default 1,
  price_cents    integer not null,
  subtotal_cents integer not null,
  pedido_id      uuid references public.pedidos (id) on delete restrict,
  pedido_item_id uuid references public.pedido_items (id) on delete restrict,
  created_by     uuid references public.profiles (id) on delete set null,
  created_at     timestamptz not null default now(),
  constraint factura_lineas_qty_positiva check (quantity > 0),
  constraint factura_lineas_consumo_trazable check (
    tipo <> 'consumo' or (pedido_id is not null and pedido_item_id is not null)
  ),
  constraint factura_lineas_ajuste_sin_traza check (
    tipo <> 'ajuste' or (pedido_id is null and pedido_item_id is null)
  ),
  constraint factura_lineas_precio_consumo_no_negativo check (
    tipo <> 'consumo' or price_cents >= 0
  )
);

create index factura_lineas_factura_idx on public.factura_lineas (factura_id, fecha);
create index factura_lineas_pedido_item_idx on public.factura_lineas (pedido_item_id);

comment on table public.factura_lineas is
  'Lineas de consumo (snapshot inmutable via triggers) y de ajuste manual. '
  'price_cents puede ser negativo solo en tipo=ajuste (descuentos).';

-- ------------------------------------------------------------
-- 6. Vista de agregacion: fuente de verdad del consumo facturable.
--    Excluye pedidos cancelados y usa siempre price_cents_at_order,
--    nunca platos.price_cents.
-- ------------------------------------------------------------
create or replace view public.v_consumo_mensual as
select
  p.profile_id,
  extract(year  from p.delivery_date)::int as anio,
  extract(month from p.delivery_date)::int as mes,
  p.delivery_date,
  p.id            as pedido_id,
  pi.id           as pedido_item_id,
  pi.plato_id,
  pl.categoria,
  pi.nombre_at_order,
  pi.quantity,
  pi.price_cents_at_order,
  pi.subtotal_cents
from public.pedidos p
join public.pedido_items pi on pi.pedido_id = p.id
join public.platos pl       on pl.id = pi.plato_id
where p.estado <> 'cancelado';

comment on view public.v_consumo_mensual is
  'Consumo facturable: excluye pedidos cancelados. Nunca usar platos.price_cents '
  'para importes, solo pedido_items.price_cents_at_order.';

-- ------------------------------------------------------------
-- 7. Recalculo de totales de factura (mismo estilo que tg_recalcular_total
--    de pedidos). Redondeo: por linea, medio hacia arriba; el IVA de la
--    factura es la SUMA de los IVA por linea, nunca round(base_total * tipo).
--    Asi el detalle impreso siempre cuadra con el total impreso.
-- ------------------------------------------------------------
create or replace function public.tg_recalcular_factura()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_factura  uuid := coalesce(new.factura_id, old.factura_id);
  v_base     integer;
  v_iva_rate integer;
  v_iva      integer;
begin
  select coalesce(sum(subtotal_cents), 0) into v_base
  from public.factura_lineas where factura_id = v_factura;

  select iva_rate_bps into v_iva_rate from public.facturas where id = v_factura;
  v_iva_rate := coalesce(v_iva_rate, 0);

  select coalesce(sum(round(fl.subtotal_cents * v_iva_rate / 10000.0)), 0)::integer
    into v_iva
  from public.factura_lineas fl where fl.factura_id = v_factura;

  update public.facturas
     set base_cents  = v_base,
         iva_cents   = v_iva,
         total_cents = v_base + v_iva
   where id = v_factura;

  return null;
end;
$$;

create trigger factura_lineas_recalcula
  after insert or update or delete on public.factura_lineas
  for each row execute function public.tg_recalcular_factura();

-- ------------------------------------------------------------
-- 8. Inmutabilidad: una factura fuera de 'borrador' no admite tocar sus
--    lineas. cerrar_periodo_factura() inserta las lineas de consumo
--    ANTES de cambiar el estado a 'cerrada', asi que no le afecta.
-- ------------------------------------------------------------
create or replace function public.tg_factura_lineas_inmutable()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_estado public.factura_estado;
begin
  select estado into v_estado from public.facturas
   where id = coalesce(new.factura_id, old.factura_id);

  if v_estado <> 'borrador' then
    raise exception 'La factura ya no esta en borrador: no se pueden modificar sus lineas'
      using errcode = 'check_violation';
  end if;
  return coalesce(new, old);
end;
$$;

create trigger factura_lineas_inmutable
  before insert or update or delete on public.factura_lineas
  for each row execute function public.tg_factura_lineas_inmutable();

-- ------------------------------------------------------------
-- 9. facturas: una vez cerrada, los campos economicos y de identidad
--    solo cambian a traves de las funciones de esta migracion, nunca
--    por UPDATE directo.
-- ------------------------------------------------------------
create or replace function public.tg_factura_campos_inmutables()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.estado <> 'borrador' then
    if new.profile_id is distinct from old.profile_id
       or new.anio is distinct from old.anio
       or new.mes is distinct from old.mes
       or new.base_cents is distinct from old.base_cents
       or new.iva_cents is distinct from old.iva_cents
       or new.total_cents is distinct from old.total_cents
       or new.iva_rate_bps is distinct from old.iva_rate_bps
       or new.numero is distinct from old.numero then
      raise exception 'Factura % ya cerrada: esos campos son inmutables', old.numero
        using errcode = 'check_violation';
    end if;
  end if;
  return new;
end;
$$;

create trigger facturas_campos_inmutables
  before update on public.facturas
  for each row execute function public.tg_factura_campos_inmutables();

-- ------------------------------------------------------------
-- 10. Cierre de periodo (admin-only). Materializa v_consumo_mensual en
--     factura_lineas (snapshot fisico, no solo una vista), asigna
--     numero, congela el tipo de IVA vigente y flipa a 'cerrada'.
--     No reprocesa un periodo ya cerrado: falla explicitamente.
-- ------------------------------------------------------------
create or replace function public.cerrar_periodo_factura(
  p_profile_id uuid,
  p_anio       integer,
  p_mes        integer
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_factura_id uuid;
  v_estado     public.factura_estado;
  v_iva_rate   integer;
  v_numero     text;
begin
  if not public.is_admin() then
    raise exception 'Solo un administrador puede cerrar un periodo' using errcode = 'insufficient_privilege';
  end if;

  select id, estado into v_factura_id, v_estado
  from public.facturas
  where profile_id = p_profile_id and anio = p_anio and mes = p_mes;

  if v_factura_id is null then
    insert into public.facturas (profile_id, anio, mes)
    values (p_profile_id, p_anio, p_mes)
    returning id, estado into v_factura_id, v_estado;
  end if;

  if v_estado <> 'borrador' then
    raise exception 'Este periodo ya esta cerrado (estado: %)', v_estado
      using errcode = 'check_violation';
  end if;

  -- Reemplaza las lineas de consumo; los ajustes ya cargados en borrador
  -- se conservan intactos.
  delete from public.factura_lineas
   where factura_id = v_factura_id and tipo = 'consumo';

  insert into public.factura_lineas
    (factura_id, tipo, fecha, categoria, descripcion, quantity, price_cents,
     subtotal_cents, pedido_id, pedido_item_id)
  select
    v_factura_id, 'consumo', v.delivery_date, v.categoria, v.nombre_at_order,
    v.quantity, v.price_cents_at_order, v.subtotal_cents, v.pedido_id, v.pedido_item_id
  from public.v_consumo_mensual v
  where v.profile_id = p_profile_id and v.anio = p_anio and v.mes = p_mes;

  select iva_rate_bps into v_iva_rate from public.facturacion_config where id = 1;
  v_numero := public.siguiente_numero_factura(p_anio);

  update public.facturas
     set estado       = 'cerrada',
         iva_rate_bps = v_iva_rate,
         numero       = v_numero,
         fecha_cierre = now()
   where id = v_factura_id;

  return v_factura_id;
end;
$$;

revoke execute on function public.cerrar_periodo_factura(uuid, integer, integer) from public, anon;
grant  execute on function public.cerrar_periodo_factura(uuid, integer, integer) to authenticated;
-- is_admin() se revalida dentro de la funcion; el grant a authenticated es
-- necesario para invocarla via RPC, pero solo un admin pasa la comprobacion.

-- ------------------------------------------------------------
-- 11. Transiciones de estado validas (emitida / pagada / anulada).
-- ------------------------------------------------------------
create or replace function public.tg_factura_transicion_valida()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.estado = old.estado then return new; end if;

  if not public.is_admin() then
    raise exception 'Solo un administrador puede cambiar el estado de una factura'
      using errcode = 'insufficient_privilege';
  end if;

  if (old.estado, new.estado) not in (
       ('borrador', 'cerrada'),
       ('cerrada', 'emitida'),
       ('emitida', 'pagada'),
       ('cerrada', 'anulada'),
       ('emitida', 'anulada')
     ) then
    raise exception 'Transicion de estado no permitida: % -> %', old.estado, new.estado
      using errcode = 'check_violation';
  end if;

  if new.estado = 'emitida' then new.fecha_emision := now(); end if;
  if new.estado = 'pagada'  then new.fecha_pago    := now(); end if;

  return new;
end;
$$;

create trigger facturas_transicion_valida
  before update of estado on public.facturas
  for each row execute function public.tg_factura_transicion_valida();

-- ------------------------------------------------------------
-- 12. RLS
-- ------------------------------------------------------------
alter table public.facturacion_config enable row level security;
alter table public.factura_numero_seq enable row level security;
alter table public.facturas           enable row level security;
alter table public.factura_lineas     enable row level security;

create policy "config iva: lectura autenticados"
  on public.facturacion_config for select to authenticated using (true);

create policy "config iva: admin escribe"
  on public.facturacion_config for all to authenticated
  using      ( (select public.is_admin()) )
  with check ( (select public.is_admin()) );

-- factura_numero_seq: RLS activada sin ninguna policy = nadie accede
-- directamente por PostgREST (ni siquiera el admin); solo la funcion
-- SECURITY DEFINER siguiente_numero_factura() la toca.

create policy "facturas: el cliente ve las suyas"
  on public.facturas for select to authenticated
  using ( profile_id = (select auth.uid()) );

create policy "facturas: el admin ve todas"
  on public.facturas for select to authenticated
  using ( (select public.is_admin()) );

create policy "facturas: el admin escribe todas"
  on public.facturas for all to authenticated
  using      ( (select public.is_admin()) )
  with check ( (select public.is_admin()) );

-- Sin policy de insert/update para clientes: nunca escriben facturas
-- directamente. Todo pasa por las funciones SQL admin-only de arriba,
-- que ya revalidan is_admin() por su cuenta.

create policy "lineas: el cliente ve las de sus facturas"
  on public.factura_lineas for select to authenticated
  using (
    exists (select 1 from public.facturas f
            where f.id = factura_lineas.factura_id and f.profile_id = (select auth.uid()))
  );

create policy "lineas: el admin ve y escribe todas"
  on public.factura_lineas for all to authenticated
  using      ( (select public.is_admin()) )
  with check ( (select public.is_admin()) );

-- base_cents/iva_cents/total_cents los mantiene el trigger; numero e
-- iva_rate_bps solo los fija cerrar_periodo_factura(). Nunca la app.
revoke update (base_cents, iva_cents, total_cents, numero, iva_rate_bps)
  on public.facturas from authenticated;
