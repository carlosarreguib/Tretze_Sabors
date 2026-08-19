# Tretze Sabors

Web y aplicación de pedidos de catering para empresas. Next.js 16 (App Router) +
Supabase (autenticación, base de datos con RLS y almacenamiento).

## Poner en marcha el proyecto

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000). Las variables de entorno ya
están en `.env.local` (no se suben al repositorio; ver `.env.example` si necesitas
recrearlas en otro equipo o para producción).

## Fotografías

La web está lista para fotografías reales pero no incluye ninguna todavía. Sin
fotografía se ve un degradado cálido de respaldo, así que la web nunca se rompe
por una imagen que falta.

- **Hero** (portada y fondo del panel de acceso): `public/img/hero.jpg`
  Formato apaisado, mínimo 1920×1080, buena luz, que deje espacio para el texto
  en la mitad izquierda.
- **Platos**: se suben desde `/admin/platos` al bucket `platos` de Supabase
  Storage. Formato 16:10 recomendado.

## Primer administrador

No existe ningún usuario administrador por defecto. Para crear el primero:

1. Regístrate normalmente desde `/registro` con la cuenta que quieras usar como
   administración.
2. En el panel de Supabase (SQL Editor) o vía MCP, ejecuta:

   ```sql
   update public.profiles set role = 'admin' where id =
     (select id from auth.users where email = 'tu-correo@ejemplo.com');
   ```

3. Vuelve a iniciar sesión. Verás la opción "Panel de gestión" en el menú lateral.

## Estructura

```
app/
  page.tsx                 # Landing pública
  (auth)/                  # Login, registro, recuperar contraseña
  (app)/panel/             # Área de cliente (pedido semanal, historial, cuenta)
  (admin)/admin/           # Gestión de platos, menús y pedidos
  auth/callback/           # Retorno de los enlaces de confirmación/recuperación
components/
  landing/  ui/  auth/  panel/  pedido/  admin/
lib/
  supabase/                # Clientes de Supabase (browser, server, middleware/proxy)
  actions/                 # Server Actions (mutaciones)
  validation.ts            # Esquemas Zod compartidos
  constants.ts             # Datos de contacto, franjas horarias, categorías…
supabase/migrations/       # Historial de migraciones SQL, en orden
```

## Base de datos

Las migraciones en `supabase/migrations/` documentan el esquema completo:
perfiles, platos, menús semanales, pedidos y sus líneas. Puntos que no deben
tocarse sin entender por qué están así:

- El precio de cada línea de pedido lo fija un trigger en la base de datos a
  partir del precio actual del plato — nunca se confía en lo que envía el
  cliente.
- El cierre de pedidos (10:00 del día anterior, hora de Madrid) se aplica en
  la base de datos, no solo en la interfaz.
- `is_admin()` es la única fuente de verdad sobre permisos y está escrita para
  evitar recursión infinita en las políticas de seguridad (RLS).

Para aplicar cambios de esquema, añade una nueva migración numerada en
`supabase/migrations/` y aplícala con el MCP de Supabase o el CLI de Supabase.

## Comandos

```bash
npm run dev      # Servidor de desarrollo
npm run build    # Build de producción
npm run lint     # ESLint
npx tsc --noEmit # Comprobación de tipos
```
