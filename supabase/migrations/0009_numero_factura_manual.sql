-- ============================================================
-- 0009_numero_factura_manual.sql
-- Permite asignar el número de factura manualmente al cerrar el periodo.
-- Si p_numero es NULL, se genera automáticamente (compatibilidad).
-- ============================================================

create or replace function public.cerrar_periodo_factura(
  p_profile_id uuid,
  p_anio       integer,
  p_mes        integer,
  p_numero     text default null
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

  -- Validar número si se proporciona: no vacío y no duplicado
  if p_numero is not null then
    p_numero := trim(p_numero);
    if p_numero = '' then
      raise exception 'El número de factura no puede estar vacío' using errcode = 'check_violation';
    end if;
    if exists (select 1 from public.facturas where numero = p_numero) then
      raise exception 'El número de factura "%" ya existe', p_numero using errcode = 'unique_violation';
    end if;
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

  -- Número: manual si se proporcionó, automático si no
  v_numero := coalesce(p_numero, public.siguiente_numero_factura(p_anio));

  update public.facturas
     set estado       = 'cerrada',
         iva_rate_bps = v_iva_rate,
         numero       = v_numero,
         fecha_cierre = now()
   where id = v_factura_id;

  return v_factura_id;
end;
$$;

-- Mantener los mismos permisos
revoke execute on function public.cerrar_periodo_factura(uuid, integer, integer, text) from public, anon;
grant  execute on function public.cerrar_periodo_factura(uuid, integer, integer, text) to authenticated;
