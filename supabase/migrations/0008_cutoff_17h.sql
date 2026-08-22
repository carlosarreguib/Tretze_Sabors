-- Cambia el cutoff de pedidos de 10:00 a 17:00 del día anterior.
-- El admin ya tiene bypass en tg_pedido_cutoff (is_admin() devuelve true).
update public.app_settings
set value = '{"days_before": 1, "hour": 17, "minute": 0, "timezone": "Europe/Madrid"}'
where key = 'cutoff';
