import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import type { CompanyUser, Database } from "@/lib/database.types"

/**
 * Cliente de Supabase para Server Components, Server Actions y Route Handlers.
 *
 * Es asincrono a proposito: en Next.js 15+ `cookies()` devuelve una promesa.
 * Olvidar el `await` en la llamada (`const supabase = await createClient()`)
 * produce un cliente sin sesion, y el sintoma es que todas las consultas
 * devuelven [] como si fuera un fallo de RLS.
 *
 * Se implementan solo getAll/setAll: la pareja get/set/remove antigua rompe
 * las cookies troceadas que Supabase usa cuando el JWT es grande.
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            )
          } catch {
            // Los Server Components no pueden escribir cookies. Se ignora:
            // el middleware es quien refresca la sesion.
          }
        },
      },
    },
  )
}

/**
 * Usuario verificado o null.
 *
 * Usa getClaims(), que valida la firma del JWT. getSession() se limita a leer
 * la cookie sin revalidarla, y las cookies son falsificables: nunca debe
 * usarse para decidir permisos en el servidor.
 */
export async function getUsuario() {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getClaims()
  if (error || !data?.claims) return null
  return { id: data.claims.sub as string, email: data.claims.email as string | undefined }
}

/**
 * Perfil completo del usuario autenticado, o null si no hay sesion.
 *
 * Resolucion en dos pasos para soportar tanto el modelo antiguo (un auth.user
 * = un profile de empresa) como el nuevo (usuario individual en company_users
 * que apunta al profile de su empresa):
 *
 *  1. Si auth.uid() coincide con un profiles.id → retorna ese profile directamente
 *     (admins y empresas creadas antes del nuevo modelo).
 *  2. Si no, busca en company_users y retorna el profile de la empresa.
 *
 * Con esto, todo el resto del codigo (pedidos, facturacion, panel) sigue
 * usando perfil.id como el profile_id de la empresa sin cambios.
 */
export async function getPerfil() {
  const usuario = await getUsuario()
  if (!usuario) return null

  const supabase = await createClient()

  const { data: perfilDirecto } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", usuario.id)
    .maybeSingle()

  if (perfilDirecto) return perfilDirecto

  const { data: cu } = await supabase
    .from("company_users")
    .select("profile_id")
    .eq("user_id", usuario.id)
    .maybeSingle()

  if (!cu) return null

  const { data: perfilEmpresa } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", cu.profile_id)
    .maybeSingle()

  return perfilEmpresa ?? null
}

/**
 * Datos del usuario individual (company_users) del usuario autenticado,
 * o null si es un admin o un perfil de empresa directo (sin company_users).
 */
export async function getCompanyUser(): Promise<CompanyUser | null> {
  const usuario = await getUsuario()
  if (!usuario) return null

  const supabase = await createClient()
  const { data } = await supabase
    .from("company_users")
    .select("*")
    .eq("user_id", usuario.id)
    .maybeSingle()

  return data ?? null
}

/**
 * Perfil del usuario si es administrador, o null en caso contrario.
 *
 * Las politicas RLS ya bloquean cualquier escritura de un cliente; esta
 * comprobacion sirve para devolver un mensaje claro en lugar de un error
 * generico de permisos, y es el unico punto donde se comprueba `role`.
 */
export async function exigirAdmin() {
  const perfil = await getPerfil()
  if (!perfil || perfil.role !== "admin") return null
  return perfil
}
