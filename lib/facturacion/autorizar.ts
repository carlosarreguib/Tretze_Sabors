import { createClient, getPerfil } from "@/lib/supabase/server"
import type { Factura, Perfil } from "@/lib/database.types"

export type FacturaAutorizada = {
  factura: Factura
  perfilCliente: Perfil
}

export type ResultadoAutorizacion =
  | { ok: true; datos: FacturaAutorizada }
  | { ok: false; status: 401 | 404 }

/**
 * Comprueba sesion y propiedad de una factura antes de generar PDF/CSV.
 *
 * RLS ya impide leer la fila de otra empresa, pero se comprueba tambien aqui
 * de forma explicita para devolver un 404 documentado (nunca 403, para no
 * revelar si el id pertenece a otra empresa) en lugar de una fila vacia
 * silenciosa.
 */
export async function autorizarFactura(facturaId: string): Promise<ResultadoAutorizacion> {
  const perfil = await getPerfil()
  if (!perfil) return { ok: false, status: 401 }

  const supabase = await createClient()
  const { data: factura } = await supabase
    .from("facturas")
    .select("*")
    .eq("id", facturaId)
    .maybeSingle()

  if (!factura) return { ok: false, status: 404 }
  if (perfil.id !== factura.profile_id && perfil.role !== "admin") {
    return { ok: false, status: 404 }
  }

  const { data: perfilCliente } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", factura.profile_id)
    .single()

  if (!perfilCliente) return { ok: false, status: 404 }

  return { ok: true, datos: { factura, perfilCliente } }
}
