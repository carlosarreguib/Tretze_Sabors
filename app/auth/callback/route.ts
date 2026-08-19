import { NextResponse, type NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * Punto de retorno de los enlaces enviados por correo: confirmación de cuenta
 * y restablecimiento de contraseña. Intercambia el código PKCE por una sesión.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/panel"
  const errorDescripcion = searchParams.get("error_description")

  if (errorDescripcion) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent("El enlace no es válido o ha caducado. Solicita uno nuevo.")}`,
    )
  }

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Solo destinos internos: `next` llega desde la URL y es manipulable.
      const destino = next.startsWith("/") && !next.startsWith("//") ? next : "/panel"
      return NextResponse.redirect(`${origin}${destino}`)
    }
  }

  return NextResponse.redirect(
    `${origin}/login?error=${encodeURIComponent("No hemos podido validar el enlace. Inténtalo de nuevo.")}`,
  )
}
