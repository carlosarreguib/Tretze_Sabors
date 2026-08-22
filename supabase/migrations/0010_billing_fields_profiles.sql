-- Añade los campos de facturación a profiles que faltaban en producción.
alter table public.profiles
  add column if not exists nif                 text,
  add column if not exists legal_name          text,
  add column if not exists billing_address     text,
  add column if not exists billing_postal_code text,
  add column if not exists billing_city        text;
