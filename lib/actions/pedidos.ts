"use server"

import { revalidatePath } from "next/cache"
import { createClient, getUsuario } from "@/lib/supabase/server"
import { pedidoDiaSchema } from "@/lib/validation"

export type ResultadoPedido = {
  ok: boolean
  mensaje: string
}

/**
 * Traduce los errores que llegan de Postgres.
 *
 * Los triggers de la base de datos ya devuelven mensajes en español
 * (cierre de plazo, plato fuera del menú), así que se dejan pasar tal cual.
 */
function traducirErrorBD(mensaje: string): string {
  const m = mensaje.toLowerCase()

  if (m.includes("plazo")) return mensaje
  if (m.includes("no esta en el menu") || m.includes("no está en el menú"))
    return "Alguno de los platos ya no está disponible ese día. Actualiza la página."
  if (m.includes("pedidos_unico_por_dia"))
    return "Ya existe un pedido para ese día. Edítalo en lugar de crear otro."
  if (m.includes("pedidos_dia_laborable"))
    return "Solo repartimos de lunes a sábado."
  if (m.includes("pedidos_slot"))
    return "La franja horaria debe estar entre las 12:00 y las 15:30."
  if (m.includes("no disponible")) return mensaje

  return "No hemos podido guardar el pedido. Inténtalo de nuevo."
}

/**
 * Crea o actualiza el pedido de un día concreto.
 *
 * Las líneas se reemplazan por completo: es más simple y más seguro que
 * calcular diferencias, y el trigger de la base de datos recalcula el total.
 * El precio nunca viaja desde el cliente; lo fija un trigger BEFORE INSERT.
 */
export async function guardarPedidoDia(
  entrada: unknown,
): Promise<ResultadoPedido> {
  const usuario = await getUsuario()
  if (!usuario) {
    return { ok: false, mensaje: "Tu sesión ha caducado. Vuelve a acceder." }
  }

  const validado = pedidoDiaSchema.safeParse(entrada)
  if (!validado.success) {
    return {
      ok: false,
      mensaje: validado.error.issues[0]?.message ?? "Datos no válidos",
    }
  }

  const { delivery_date, slot_start, notes, items } = validado.data
  const supabase = await createClient()

  // Reutiliza el pedido del día si ya existe: hay una restricción única
  // (profile_id, delivery_date) que impide crear un segundo pedido.
  const { data: existente } = await supabase
    .from("pedidos")
    .select("id, estado")
    .eq("profile_id", usuario.id)
    .eq("delivery_date", delivery_date)
    .maybeSingle()

  if (existente && existente.estado !== "pendiente") {
    return {
      ok: false,
      mensaje:
        "Este pedido ya está confirmado. Llámanos si necesitas modificarlo.",
    }
  }

  let pedidoId = existente?.id

  if (pedidoId) {
    const { error } = await supabase
      .from("pedidos")
      .update({ slot_start, notes: notes || null })
      .eq("id", pedidoId)

    if (error) return { ok: false, mensaje: traducirErrorBD(error.message) }

    const { error: errorBorrado } = await supabase
      .from("pedido_items")
      .delete()
      .eq("pedido_id", pedidoId)

    if (errorBorrado)
      return { ok: false, mensaje: traducirErrorBD(errorBorrado.message) }
  } else {
    const { data, error } = await supabase
      .from("pedidos")
      .insert({
        profile_id: usuario.id,
        delivery_date,
        slot_start,
        notes: notes || null,
        estado: "pendiente",
      })
      .select("id")
      .single()

    if (error) return { ok: false, mensaje: traducirErrorBD(error.message) }
    pedidoId = data.id
  }

  // price_cents_at_order y nombre_at_order son obligatorios en el tipo, pero
  // el trigger pedido_items_snapshot los sobrescribe con los valores reales.
  const { error: errorItems } = await supabase.from("pedido_items").insert(
    items.map((i) => ({
      pedido_id: pedidoId!,
      plato_id: i.plato_id,
      quantity: i.quantity,
      price_cents_at_order: 0,
      nombre_at_order: "",
    })),
  )

  if (errorItems) {
    // Si el pedido acaba sin líneas queda un registro vacío y confuso.
    if (!existente) {
      await supabase.from("pedidos").delete().eq("id", pedidoId!)
    }
    return { ok: false, mensaje: traducirErrorBD(errorItems.message) }
  }

  revalidatePath("/panel")
  revalidatePath("/panel/pedidos")

  return { ok: true, mensaje: "Pedido guardado correctamente." }
}

/** Cancela un pedido. No se borra: el historial debe conservarse. */
export async function cancelarPedido(
  pedidoId: string,
): Promise<ResultadoPedido> {
  const usuario = await getUsuario()
  if (!usuario) {
    return { ok: false, mensaje: "Tu sesión ha caducado. Vuelve a acceder." }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from("pedidos")
    .update({ estado: "cancelado", cancelled_at: new Date().toISOString() })
    .eq("id", pedidoId)
    .eq("profile_id", usuario.id)

  if (error) return { ok: false, mensaje: traducirErrorBD(error.message) }

  revalidatePath("/panel")
  revalidatePath("/panel/pedidos")

  return { ok: true, mensaje: "Pedido cancelado." }
}
