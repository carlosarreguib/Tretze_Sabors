import { type NextRequest } from "next/server"
import { updateSession } from "@/lib/supabase/middleware"

export default async function proxy(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Todas las rutas excepto ficheros estaticos e imagenes.
     * Ejecutar el proxy sobre /_next/static desperdicia una llamada
     * de red por cada recurso.
     */
    "/((?!_next/static|_next/image|favicon.ico|img/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico)$).*)",
  ],
}
