"use server"

import { revalidatePath } from "next/cache"
import { createClient, exigirAdmin } from "@/lib/supabase/server"
import { ajusteFacturaSchema, erroresDeZod } from "@/lib/validation"
import type { EstadoFormulario } from "@/lib/actions/auth"

export type ResultadoFactura = {
  ok: boolean
  mensaje: string
}

function traducirErrorBD(mensaje: string): string {
  const m = mensaje.toLowerCase()

  if (m.includes("ya esta cerrado")) return "Este periodo ya está cerrado."
  if (m.includes("ya no esta en borrador"))
    return "Esta factura ya no está en borrador: no se puede modificar."
  if (m.includes("transicion de estado no permitida"))
    return "Ese cambio de estado no está permitido desde el estado actual."
  if (m.includes("solo un administrador")) return "No tienes permisos para realizar esta acción."

  return "No hemos podido completar la operación. Inténtalo de nuevo."
}

/**
 * Cierra el periodo de una empresa: materializa el consumo del mes en
 * lineas de factura, asigna numero secuencial y congela el tipo de IVA
 * vigente. Los ajustes ya cargados en borrador se conservan.
 */
export async function cerrarPeriodo(
  profileId: string,
  anio: number,
  mes: number,
): Promise<ResultadoFactura> {
  const perfil = await exigirAdmin()
  if (!perfil) return { ok: false, mensaje: "No tienes permisos para realizar esta acción." }

  const supabase = await createClient()
  const { error } = await supabase.rpc("cerrar_periodo_factura", {
    p_profile_id: profileId,
    p_anio: anio,
    p_mes: mes,
  })

  if (error) return { ok: false, mensaje: traducirErrorBD(error.message) }

  revalidatePath("/admin/facturas")
  revalidatePath(`/admin/facturas/${profileId}`)

  return { ok: true, mensaje: "Periodo cerrado y factura generada." }
}

/**
 * Añade una linea de ajuste manual (descuento, suplemento, correccion) a una
 * factura en borrador. El trigger factura_lineas_inmutable tambien lo
 * bloquearia si la factura ya no esta en borrador; se comprueba antes aqui
 * para dar un mensaje claro.
 *
 * Firma `(facturaId, previo, formData)` para poder usarse con
 * `useActionState` via `anadirAjuste.bind(null, facturaId)`, igual que el
 * resto de formularios de la app (ver formulario-cuenta.tsx), y devolver
 * errores por campo en vez de un unico mensaje generico.
 */
export async function anadirAjuste(
  facturaId: string,
  _previo: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  const perfil = await exigirAdmin()
  if (!perfil) return { mensaje: "No tienes permisos para realizar esta acción." }

  const validado = ajusteFacturaSchema.safeParse({
    fecha: String(formData.get("fecha") ?? ""),
    descripcion: String(formData.get("descripcion") ?? "").trim(),
    categoria: String(formData.get("categoria") ?? "") || undefined,
    quantity: Number(formData.get("quantity") ?? 0),
    precio_euros: Number(String(formData.get("precio_euros") ?? "").replace(",", ".")),
  })

  if (!validado.success) {
    return { errores: erroresDeZod(validado.error) }
  }

  const supabase = await createClient()

  const { data: factura } = await supabase
    .from("facturas")
    .select("id, estado, profile_id")
    .eq("id", facturaId)
    .maybeSingle()

  if (!factura) return { mensaje: "Factura no encontrada." }
  if (factura.estado !== "borrador") {
    return { mensaje: "Esta factura ya no está en borrador: no se puede modificar." }
  }

  const { fecha, descripcion, categoria, quantity, precio_euros } = validado.data
  const price_cents = Math.round(precio_euros * 100)

  const { error } = await supabase.from("factura_lineas").insert({
    factura_id: facturaId,
    tipo: "ajuste",
    fecha,
    categoria: categoria ?? null,
    descripcion,
    quantity,
    price_cents,
    subtotal_cents: quantity * price_cents,
    created_by: perfil.id,
  })

  if (error) return { mensaje: traducirErrorBD(error.message) }

  revalidatePath(`/admin/facturas/${factura.profile_id}`)

  return { ok: true, mensaje: "Ajuste añadido." }
}

/** Elimina una linea de ajuste (nunca una linea de consumo). */
export async function eliminarAjuste(lineaId: string): Promise<ResultadoFactura> {
  const perfil = await exigirAdmin()
  if (!perfil) return { ok: false, mensaje: "No tienes permisos para realizar esta acción." }

  const supabase = await createClient()

  const { data: linea } = await supabase
    .from("factura_lineas")
    .select("id, factura_id, tipo, facturas(profile_id)")
    .eq("id", lineaId)
    .maybeSingle()

  if (!linea || linea.tipo !== "ajuste") {
    return { ok: false, mensaje: "Ese ajuste no existe o no se puede eliminar." }
  }

  const { error } = await supabase
    .from("factura_lineas")
    .delete()
    .eq("id", lineaId)
    .eq("tipo", "ajuste")

  if (error) return { ok: false, mensaje: traducirErrorBD(error.message) }

  const profileId = (linea.facturas as unknown as { profile_id: string } | null)?.profile_id
  if (profileId) revalidatePath(`/admin/facturas/${profileId}`)

  return { ok: true, mensaje: "Ajuste eliminado." }
}

async function cambiarEstadoFactura(
  facturaId: string,
  estado: "emitida" | "pagada" | "anulada",
  mensajeExito: string,
): Promise<ResultadoFactura> {
  const perfil = await exigirAdmin()
  if (!perfil) return { ok: false, mensaje: "No tienes permisos para realizar esta acción." }

  const supabase = await createClient()

  const { data: factura } = await supabase
    .from("facturas")
    .select("id, profile_id")
    .eq("id", facturaId)
    .maybeSingle()

  if (!factura) return { ok: false, mensaje: "Factura no encontrada." }

  const { error } = await supabase.from("facturas").update({ estado }).eq("id", facturaId)

  if (error) return { ok: false, mensaje: traducirErrorBD(error.message) }

  revalidatePath("/admin/facturas")
  revalidatePath(`/admin/facturas/${factura.profile_id}`)
  revalidatePath("/panel/facturacion")

  return { ok: true, mensaje: mensajeExito }
}

export async function marcarEmitida(facturaId: string): Promise<ResultadoFactura> {
  return cambiarEstadoFactura(facturaId, "emitida", "Factura marcada como emitida.")
}

export async function marcarPagada(facturaId: string): Promise<ResultadoFactura> {
  return cambiarEstadoFactura(facturaId, "pagada", "Factura marcada como pagada.")
}

export async function anularFactura(facturaId: string): Promise<ResultadoFactura> {
  return cambiarEstadoFactura(facturaId, "anulada", "Factura anulada.")
}
