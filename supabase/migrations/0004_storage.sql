-- ============================================================
-- Tretze Sabors - Storage para imagenes de platos
--
-- Las politicas del bucket son independientes de las de la tabla:
-- una tabla platos solo-admin con un bucket abierto a escritura
-- es un fallo habitual.
-- ============================================================

insert into storage.buckets (id, name, public)
values ('platos', 'platos', true)
on conflict (id) do nothing;

-- Lectura publica: las fotos de los platos se muestran en la web publica.
create policy "platos img: lectura publica"
  on storage.objects for select
  using ( bucket_id = 'platos' );

-- Escritura solo para administradores.
create policy "platos img: admin sube"
  on storage.objects for insert to authenticated
  with check ( bucket_id = 'platos' and (select public.is_admin()) );

create policy "platos img: admin actualiza"
  on storage.objects for update to authenticated
  using      ( bucket_id = 'platos' and (select public.is_admin()) )
  with check ( bucket_id = 'platos' and (select public.is_admin()) );

create policy "platos img: admin borra"
  on storage.objects for delete to authenticated
  using ( bucket_id = 'platos' and (select public.is_admin()) );
