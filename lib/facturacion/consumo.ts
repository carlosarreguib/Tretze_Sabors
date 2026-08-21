import { createClient } from "@/lib/supabase/server"
import { limitesDelMes } from "@/lib/utils"
import type { Categoria, Factura } from "@/lib/database.types"

/**
 * Capa de agregacion de facturacion: fuente unica de datos para la pantalla
 * de cliente, la de admin, el PDF y el CSV. Ninguno de esos cuatro debe leer
 * pedido_items/v_consumo_mensual/factura_lineas por su cuenta: todos pasan
 * por aqui, para que nunca puedan divergir entre si.
 */

export type LineaConsumo = {
  fecha: string
  categoria: Categoria | null
  descripcion: string
  quantity: number
  price_cents: number
  subtotal_cents: number
  tipo: "consumo" | "ajuste"
}

export type ResumenMensual = {
  profileId: string
  anio: number
  mes: number
  lineas: LineaConsumo[]
  porDia: Map<string, { lineas: LineaConsumo[]; total_cents: number }>
  porCategoria: Map<Categoria, { cantidad: number; total_cents: number }>
  porProducto: Map<
    string,
    { cantidad: number; total_cents: number; descripcion: string; esAjuste: boolean }
  >
  totalPedidos: number
  diasDeServicio: number
  base_cents: number
  iva_cents: number
  total_cents: number
}

function resumenVacio(profileId: string, anio: number, mes: number): ResumenMensual {
  return {
    profileId,
    anio,
    mes,
    lineas: [],
    porDia: new Map(),
    porCategoria: new Map(),
    porProducto: new Map(),
    totalPedidos: 0,
    diasDeServicio: 0,
    base_cents: 0,
    iva_cents: 0,
    total_cents: 0,
  }
}

/**
 * Factura (si existe) de una empresa para un periodo concreto. `null` si el
 * periodo aun no se ha cerrado nunca (mes en curso, sin facturar todavia).
 */
export async function obtenerFacturaDelPeriodo(
  profileId: string,
  anio: number,
  mes: number,
): Promise<Factura | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("facturas")
    .select("*")
    .eq("profile_id", profileId)
    .eq("anio", anio)
    .eq("mes", mes)
    .maybeSingle()

  return data
}

/**
 * Consumo de una empresa en un mes.
 *
 * Si ya existe una factura para el periodo (borrador con ajustes, o ya
 * cerrada), se lee de factura_lineas: es la fuente congelada, la unica
 * correcta una vez que el periodo tiene ajustes o esta cerrado. Si no existe
 * factura todavia (mes en curso), se lee directamente de v_consumo_mensual,
 * que ya excluye pedidos cancelados y usa siempre price_cents_at_order.
 */
export async function obtenerResumenMensual(
  profileId: string,
  anio: number,
  mes: number,
): Promise<ResumenMensual> {
  const supabase = await createClient()
  const factura = await obtenerFacturaDelPeriodo(profileId, anio, mes)

  let lineas: LineaConsumo[]

  if (factura) {
    const { data } = await supabase
      .from("factura_lineas")
      .select("fecha, categoria, descripcion, quantity, price_cents, subtotal_cents, tipo")
      .eq("factura_id", factura.id)
      .order("fecha")

    lineas = (data ?? []).map((l) => ({
      fecha: l.fecha,
      categoria: l.categoria,
      descripcion: l.descripcion,
      quantity: l.quantity,
      price_cents: l.price_cents,
      subtotal_cents: l.subtotal_cents,
      tipo: l.tipo,
    }))
  } else {
    const { desde, hasta } = limitesDelMes(new Date(anio, mes - 1, 1))
    const { data } = await supabase
      .from("v_consumo_mensual")
      .select("delivery_date, categoria, nombre_at_order, quantity, price_cents_at_order, subtotal_cents")
      .eq("profile_id", profileId)
      .eq("anio", anio)
      .eq("mes", mes)
      .gte("delivery_date", desde)
      .lte("delivery_date", hasta)
      .order("delivery_date")

    lineas = (data ?? []).map((l) => ({
      fecha: l.delivery_date!,
      categoria: l.categoria,
      descripcion: l.nombre_at_order!,
      quantity: l.quantity!,
      price_cents: l.price_cents_at_order!,
      subtotal_cents: l.subtotal_cents!,
      tipo: "consumo" as const,
    }))
  }

  if (lineas.length === 0 && !factura) {
    return resumenVacio(profileId, anio, mes)
  }

  const porDia = new Map<string, { lineas: LineaConsumo[]; total_cents: number }>()
  const porCategoria = new Map<Categoria, { cantidad: number; total_cents: number }>()
  const porProducto = new Map<
    string,
    { cantidad: number; total_cents: number; descripcion: string; esAjuste: boolean }
  >()
  const pedidosPorDia = new Set<string>()

  for (const l of lineas) {
    const dia = porDia.get(l.fecha) ?? { lineas: [], total_cents: 0 }
    dia.lineas.push(l)
    dia.total_cents += l.subtotal_cents
    porDia.set(l.fecha, dia)
    pedidosPorDia.add(l.fecha)

    if (l.categoria) {
      const cat = porCategoria.get(l.categoria) ?? { cantidad: 0, total_cents: 0 }
      cat.cantidad += l.quantity
      cat.total_cents += l.subtotal_cents
      porCategoria.set(l.categoria, cat)
    }

    // Se prefija con el tipo para que un ajuste cuyo texto coincida con el
    // nombre de un plato real (p.ej. un descuento titulado "Menú del día")
    // nunca se fusione con el total de ese plato.
    const claveProducto = l.tipo === "ajuste" ? `ajuste:${l.descripcion}` : l.descripcion
    const prod = porProducto.get(claveProducto) ?? {
      cantidad: 0,
      total_cents: 0,
      descripcion: l.descripcion,
      esAjuste: l.tipo === "ajuste",
    }
    prod.cantidad += l.quantity
    prod.total_cents += l.subtotal_cents
    porProducto.set(claveProducto, prod)
  }

  const base_cents = factura?.base_cents ?? lineas.reduce((s, l) => s + l.subtotal_cents, 0)
  const iva_cents = factura?.iva_cents ?? 0
  const total_cents = factura?.total_cents ?? base_cents

  return {
    profileId,
    anio,
    mes,
    lineas,
    porDia,
    porCategoria,
    porProducto,
    totalPedidos: pedidosPorDia.size,
    diasDeServicio: pedidosPorDia.size,
    base_cents,
    iva_cents,
    total_cents,
  }
}

/** Resumen de todas las empresas activas para un periodo, para la lista de admin. */
export async function obtenerResumenGlobal(anio: number, mes: number) {
  const supabase = await createClient()

  const { data: empresas } = await supabase
    .from("profiles")
    .select("id, company_name")
    .eq("role", "client")
    .eq("is_active", true)
    .order("company_name")

  const { data: facturas } = await supabase
    .from("facturas")
    .select("*")
    .eq("anio", anio)
    .eq("mes", mes)

  const { desde, hasta } = limitesDelMes(new Date(anio, mes - 1, 1))
  const { data: consumo } = await supabase
    .from("v_consumo_mensual")
    .select("profile_id, delivery_date, subtotal_cents")
    .eq("anio", anio)
    .eq("mes", mes)
    .gte("delivery_date", desde)
    .lte("delivery_date", hasta)

  const facturaPorEmpresa = new Map((facturas ?? []).map((f) => [f.profile_id, f]))
  const consumoPorEmpresa = new Map<string, { total_cents: number; dias: Set<string> }>()

  for (const c of consumo ?? []) {
    const entry = consumoPorEmpresa.get(c.profile_id!) ?? { total_cents: 0, dias: new Set<string>() }
    entry.total_cents += c.subtotal_cents ?? 0
    entry.dias.add(c.delivery_date!)
    consumoPorEmpresa.set(c.profile_id!, entry)
  }

  const filas = (empresas ?? []).map((empresa) => {
    const factura = facturaPorEmpresa.get(empresa.id) ?? null
    const consumoEmpresa = consumoPorEmpresa.get(empresa.id)
    // Antes del cierre no hay IVA congelado: este total es solo la base de
    // consumo, no un importe facturado. Se muestra igualmente en la fila de
    // la empresa (para que se vea su actividad del mes), pero NO se suma al
    // agregado "Total facturado" de mas abajo: mezclar un total con IVA
    // (factura cerrada) con uno sin IVA (consumo en curso) produce una cifra
    // sin sentido contable.
    const total_cents = factura?.total_cents ?? consumoEmpresa?.total_cents ?? 0
    const pedidos = consumoEmpresa?.dias.size ?? 0

    return { empresa, factura, total_cents, pedidos }
  })

  const totalFacturado = filas.reduce((s, f) => s + (f.factura?.total_cents ?? 0), 0)
  const totalPedidos = filas.reduce((s, f) => s + f.pedidos, 0)
  const pendientes = filas.filter((f) => !f.factura || f.factura.estado === "borrador").length

  return { filas, totalFacturado, totalPedidos, pendientes, totalEmpresas: filas.length }
}
