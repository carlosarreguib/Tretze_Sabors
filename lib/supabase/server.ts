import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import type { Database } from "@/lib/database.types"

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

/** Perfil completo del usuario autenticado, o null si no hay sesion. */
export async function getPerfil() {
  const usuario = await getUsuario()
  if (!usuario) return null

  const supabase = await createClient()
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", usuario.id)
    .single()

  return data
}
