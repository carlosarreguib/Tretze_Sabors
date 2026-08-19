"use server"

import { revalidatePath } from "next/cache"
import { createClient, getPerfil } from "@/lib/supabase/server"
import { erroresDeZod, platoSchema } from "@/lib/validation"
import type { EstadoFormulario } from "@/lib/actions/auth"
import type { EstadoPedido } from "@/lib/database.types"

/**
 * Comprueba que quien llama es administrador.
 *
 * Las políticas RLS ya bloquean cualquier escritura de un cliente; esta
 * comprobación sirve para devolver un mensaje claro en lugar de un error
 * genérico de permisos.
 */
async function exigirAdmin() {
  const perfil = await getPerfil()
  if (!perfil || perfil.role !== "admin") return null
  return perfil
}

const SIN_PERMISO: EstadoFormulario = {
  mensaje: "No tienes permisos para realizar esta acción.",
}

export async function guardarPlato(
  _previo: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  if (!(await exigirAdmin())) return SIN_PERMISO

  const id = String(formData.get("id") ?? "")
  const precioTexto = String(formData.get("precio_euros") ?? "0").replace(",", ".")

  const validado = platoSchema.safeParse({
    nombre: String(formData.get("nombre") ?? "").trim(),
    descripcion: String(formData.get("descripcion") ?? "").trim(),
    categoria: String(formData.get("categoria") ?? "primer"),
    precio_euros: Number(precioTexto),
    alergenos: formData.getAll("alergenos").map(String),
    is_active: formData.get("is_active") === "on",
  })

  if (!validado.success) {
    return { errores: erroresDeZod(validado.error) }
  }

  const supabase = await createClient()
  const fila = {
    nombre: validado.data.nombre,
    descripcion: validado.data.descripcion || null,
    categoria: validado.data.categoria,
    // Los precios se guardan en céntimos: en euros con decimales, la aritmética
    // en coma flotante acaba produciendo totales de 12,299999999 €.
    price_cents: Math.round(validado.data.precio_euros * 100),
    alergenos: validado.data.alergenos,
    is_active: validado.data.is_active,
  }

  const { error } = id
    ? await supabase.from("platos").update(fila).eq("id", id)
    : await supabase.from("platos").insert(fila)

  if (error) {
    return { mensaje: "No hemos podido guardar el plato. Inténtalo de nuevo." }
  }

  revalidatePath("/admin/platos")
  revalidatePath("/admin/menus")
  revalidatePath("/panel")
  revalidatePath("/")

  return { ok: true, mensaje: id ? "Plato actualizado." : "Plato creado." }
}

/** Activa o desactiva un plato. No se borra: puede estar en pedidos antiguos. */
export async function alternarPlato(id: string, activo: boolean) {
  if (!(await exigirAdmin())) return { ok: false }

  const supabase = await createClient()
  const { error } = await supabase
    .from("platos")
    .update({ is_active: activo })
    .eq("id", id)

  revalidatePath("/admin/platos")
  revalidatePath("/")

  return { ok: !error }
}

/** Crea el menú de una semana (si no existe) y fija sus platos por día. */
export async function guardarMenuSemana(entrada: {
  anio: number
  semana: number
  publicado: boolean
  items: { menu_date: string; plato_id: string }[]
}): Promise<{ ok: boolean; mensaje: string }> {
  const perfil = await exigirAdmin()
  if (!perfil) {
    return { ok: false, mensaje: "No tienes permisos para realizar esta acción." }
  }

  const supabase = await createClient()

  const { data: existente } = await supabase
    .from("menus_semanales")
    .select("id")
    .eq("anio", entrada.anio)
    .eq("semana_iso", entrada.semana)
    .maybeSingle()

  let menuId = existente?.id

  if (menuId) {
    const { error } = await supabase
      .from("menus_semanales")
      .update({
        is_published: entrada.publicado,
        published_at: entrada.publicado ? new Date().toISOString() : null,
      })
      .eq("id", menuId)

    if (error) return { ok: false, mensaje: "No hemos podido guardar el menú." }
  } else {
    const { data, error } = await supabase
      .from("menus_semanales")
      .insert({
        anio: entrada.anio,
        semana_iso: entrada.semana,
        is_published: entrada.publicado,
        published_at: entrada.publicado ? new Date().toISOString() : null,
        created_by: perfil.id,
      })
      .select("id")
      .single()

    if (error) return { ok: false, mensaje: "No hemos podido crear el menú." }
    menuId = data.id
  }

  // Se reemplazan todas las líneas: más simple que calcular diferencias.
  await supabase.from("menu_items").delete().eq("menu_id", menuId)

  if (entrada.items.length > 0) {
    const { error } = await supabase.from("menu_items").insert(
      entrada.items.map((i, indice) => ({
        menu_id: menuId!,
        plato_id: i.plato_id,
        menu_date: i.menu_date,
        sort_order: indice,
      })),
    )

    if (error) {
      return {
        ok: false,
        mensaje:
          "No hemos podido guardar los platos del menú. Revisa que las fechas sean de esta semana.",
      }
    }
  }

  revalidatePath("/admin/menus")
  revalidatePath("/panel")

  return {
    ok: true,
    mensaje: entrada.publicado
      ? "Menú guardado y publicado."
      : "Menú guardado como borrador.",
  }
}

export async function cambiarEstadoPedido(
  pedidoId: string,
  estado: EstadoPedido,
): Promise<{ ok: boolean; mensaje: string }> {
  if (!(await exigirAdmin())) {
    return { ok: false, mensaje: "No tienes permisos para realizar esta acción." }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from("pedidos")
    .update({
      estado,
      cancelled_at: estado === "cancelado" ? new Date().toISOString() : null,
    })
    .eq("id", pedidoId)

  if (error) {
    return { ok: false, mensaje: "No hemos podido actualizar el pedido." }
  }

  revalidatePath("/admin/pedidos")

  return { ok: true, mensaje: "Pedido actualizado." }
}
