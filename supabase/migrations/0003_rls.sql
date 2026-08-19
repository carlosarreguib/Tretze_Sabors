-- ============================================================
-- Tretze Sabors - Row Level Security
--
-- Reglas que NO se pueden relajar:
--  * WITH CHECK en toda politica de UPDATE. Sin el, un cliente puede
--    ejecutar `update pedidos set profile_id = '<otra-empresa>'`: la fila
--    pasa el USING porque en el momento de lectura es suya.
--  * is_admin() se invoca como (select public.is_admin()) para que se
--    evalue una vez por sentencia (InitPlan) y no una vez por fila.
--  * Las politicas del mismo comando se combinan con OR. Anadir una
--    politica permisiva `using (true)` expone toda la tabla.
-- ============================================================

alter table public.profiles        enable row level security;
alter table public.platos          enable row level security;
alter table public.menus_semanales enable row level security;
alter table public.menu_items      enable row level security;
alter table public.pedidos         enable row level security;
alter table public.pedido_items    enable row level security;
alter table public.app_settings    enable row level security;

-- ------------------------------------------------------------
-- profiles
-- ------------------------------------------------------------
create policy "perfil: lectura propia"
  on public.profiles for select to authenticated
  using ( (select auth.uid()) = id );

create policy "perfil: admin lee todos"
  on public.profiles for select to authenticated
  using ( (select public.is_admin()) );

create policy "perfil: actualiza el propio"
  on public.profiles for update to authenticated
  using      ( (select auth.uid()) = id )
  with check ( (select auth.uid()) = id );

create policy "perfil: admin actualiza todos"
  on public.profiles for update to authenticated
  using      ( (select public.is_admin()) )
  with check ( (select public.is_admin()) );

-- Sin INSERT: los perfiles solo los crea el trigger on_auth_user_created.
-- Sin DELETE: se borran por cascada al borrar auth.users.

-- RLS no sabe expresar "todas las columnas menos role". Sin estos grants
-- por columna, cualquier cliente ejecuta
--   update profiles set role='admin' where id = auth.uid()
-- y se autopromociona: la politica de arriba lo permite.
revoke update on public.profiles from authenticated;
grant  update (company_name, contact_name, phone, delivery_address,
               payment_method, payment_notes)
  on public.profiles to authenticated;

-- Refuerzo: un grant futuro podria reabrir el agujero sin darse cuenta.
create or replace function public.tg_profile_role_inmutable()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.role is distinct from old.role and not public.is_admin() then
    raise exception 'No puede modificar su rol' using errcode = 'insufficient_privilege';
  end if;
  return new;
end; $$;

create trigger profiles_role_inmutable
  before update on public.profiles
  for each row execute function public.tg_profile_role_inmutable();

-- ------------------------------------------------------------
-- platos y menus: lectura para clientes, escritura solo admin
-- ------------------------------------------------------------
create policy "platos: lectura activos"
  on public.platos for select to authenticated
  using ( is_active or (select public.is_admin()) );

create policy "platos: admin escribe"
  on public.platos for all to authenticated
  using      ( (select public.is_admin()) )
  with check ( (select public.is_admin()) );

create policy "menus: lectura publicados"
  on public.menus_semanales for select to authenticated
  using ( is_published or (select public.is_admin()) );

create policy "menus: admin escribe"
  on public.menus_semanales for all to authenticated
  using      ( (select public.is_admin()) )
  with check ( (select public.is_admin()) );

create policy "menu_items: lectura si el menu esta publicado"
  on public.menu_items for select to authenticated
  using (
    (select public.is_admin())
    or exists (
      select 1 from public.menus_semanales m
      where m.id = menu_items.menu_id and m.is_published
    )
  );

create policy "menu_items: admin escribe"
  on public.menu_items for all to authenticated
  using      ( (select public.is_admin()) )
  with check ( (select public.is_admin()) );

create policy "settings: lectura"
  on public.app_settings for select to authenticated using ( true );

create policy "settings: admin escribe"
  on public.app_settings for all to authenticated
  using      ( (select public.is_admin()) )
  with check ( (select public.is_admin()) );

-- ------------------------------------------------------------
-- pedidos: aislamiento entre empresas
-- ------------------------------------------------------------
create policy "pedidos: el cliente ve los suyos"
  on public.pedidos for select to authenticated
  using ( profile_id = (select auth.uid()) );

create policy "pedidos: el admin ve todos"
  on public.pedidos for select to authenticated
  using ( (select public.is_admin()) );

create policy "pedidos: el cliente crea los suyos"
  on public.pedidos for insert to authenticated
  with check (
    profile_id = (select auth.uid())
    and estado = 'pendiente'
  );

create policy "pedidos: el cliente modifica los suyos"
  on public.pedidos for update to authenticated
  using      ( profile_id = (select auth.uid()) )
  with check ( profile_id = (select auth.uid()) );   -- impide reasignar a otra empresa

create policy "pedidos: el admin modifica todos"
  on public.pedidos for all to authenticated
  using      ( (select public.is_admin()) )
  with check ( (select public.is_admin()) );

-- Los clientes no borran pedidos: los cancelan, preservando el historico.

-- total_cents lo mantiene el trigger, nunca la aplicacion.
revoke update (total_cents) on public.pedidos from authenticated;

-- ------------------------------------------------------------
-- pedido_items: la propiedad se deriva SIEMPRE del pedido padre.
-- pedido_items no tiene profile_id a proposito: si lo tuviera y el
-- cliente pudiera fijarlo, podria colgar lineas de pedidos ajenos.
-- ------------------------------------------------------------
create policy "items: el cliente ve los de sus pedidos"
  on public.pedido_items for select to authenticated
  using (
    exists (
      select 1 from public.pedidos p
      where p.id = pedido_items.pedido_id
        and p.profile_id = (select auth.uid())
    )
  );

create policy "items: el admin ve todos"
  on public.pedido_items for select to authenticated
  using ( (select public.is_admin()) );

create policy "items: el cliente escribe en sus pedidos"
  on public.pedido_items for insert to authenticated
  with check (
    exists (
      select 1 from public.pedidos p
      where p.id = pedido_items.pedido_id
        and p.profile_id = (select auth.uid())
    )
  );

create policy "items: el cliente actualiza los suyos"
  on public.pedido_items for update to authenticated
  using ( exists (select 1 from public.pedidos p
                  where p.id = pedido_items.pedido_id and p.profile_id = (select auth.uid())) )
  with check ( exists (select 1 from public.pedidos p
                       where p.id = pedido_items.pedido_id and p.profile_id = (select auth.uid())) );

create policy "items: el cliente borra los suyos"
  on public.pedido_items for delete to authenticated
  using ( exists (select 1 from public.pedidos p
                  where p.id = pedido_items.pedido_id and p.profile_id = (select auth.uid())) );

create policy "items: el admin escribe todos"
  on public.pedido_items for all to authenticated
  using      ( (select public.is_admin()) )
  with check ( (select public.is_admin()) );
