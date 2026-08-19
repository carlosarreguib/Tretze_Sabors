import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import type { Database } from "@/lib/database.types"

/** Rutas privadas: exigen sesion iniciada. */
const RUTAS_PRIVADAS = ["/panel", "/admin"]

/** Rutas de autenticacion: si ya hay sesion, sobran. */
const RUTAS_AUTH = ["/login", "/registro", "/recuperar"]

/**
 * Refresca la sesion en cada peticion y protege las rutas privadas.
 *
 * Detalles que no se pueden cambiar sin romper la sesion:
 *  - Se devuelve el mismo objeto `supabaseResponse`. Si se construye un
 *    NextResponse nuevo hay que copiarle las cookies, o el token renovado
 *    no llega al navegador y el usuario sufre cierres de sesion aleatorios.
 *  - `setAll` recibe cabeceras de cache que deben aplicarse a la respuesta:
 *    sin ellas una CDN puede cachear una respuesta autenticada y servirle
 *    la sesion de una empresa a otra.
 *  - No debe ejecutarse codigo entre createServerClient y getClaims().
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          )
          // Cache-Control / Expires / Pragma: impiden que una CDN cachee una
          // respuesta autenticada y sirva la sesion de un usuario a otro.
          Object.entries(headers ?? {}).forEach(([clave, valor]) =>
            supabaseResponse.headers.set(clave, valor),
          )
        },
      },
    },
  )

  const { data } = await supabase.auth.getClaims()
  const usuario = data?.claims ?? null

  const { pathname } = request.nextUrl

  const esPrivada = RUTAS_PRIVADAS.some((r) => pathname.startsWith(r))
  const esAuth = RUTAS_AUTH.some((r) => pathname.startsWith(r))

  if (!usuario && esPrivada) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    url.searchParams.set("redirect", pathname)
    return NextResponse.redirect(url)
  }

  if (usuario && esAuth) {
    const url = request.nextUrl.clone()
    url.pathname = "/panel"
    url.search = ""
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
