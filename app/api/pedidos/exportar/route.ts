import { createClient, exigirAdmin } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

/**
 * GET /api/pedidos/exportar?fecha=YYYY-MM-DD
 *
 * Exporta un CSV con los pedidos del día agrupados por plato:
 * - Total de raciones por plato
 * - Número de usuarios con alguna intolerancia para ese plato
 *   (cruce de alergenos del plato con user_allergies de cada usuario)
 *
 * Solo accesible por administradores.
 */
export async function GET(req: Request) {
  try {
    await exigirAdmin()
  } catch {
    return new Response("No autorizado", { status: 401 })
  }

  const url = new URL(req.url)
  const fecha = url.searchParams.get("fecha")
  if (!fecha || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    return new Response("Parámetro fecha no válido", { status: 400 })
  }

  const supabase = await createClient()
  const admin = createAdminClient()

  // 1. Todos los pedidos del día con sus ítems y el plato completo
  const { data: pedidos, error } = await supabase
    .from("pedidos")
    .select("id, profile_id, notes, pedido_items(plato_id, quantity, nombre_at_order), profiles(company_name)")
    .eq("delivery_date", fecha)
    .neq("estado", "cancelado")

  if (error) {
    return new Response("Error al consultar pedidos", { status: 500 })
  }

  if (!pedidos || pedidos.length === 0) {
    const csv = "﻿Plato;Raciones;Intolerancias\r\nNo hay pedidos para esta fecha\r\n"
    return new Response(csv, {
      headers: csvHeaders(`pedidos-${fecha}.csv`),
    })
  }

  // 2. Obtener los platos con sus alergenos para los ítems del día
  const platoIds = [...new Set(
    pedidos.flatMap((p) => p.pedido_items.map((i) => i.plato_id))
  )]
  const { data: platos } = await supabase
    .from("platos")
    .select("id, nombre, alergenos")
    .in("id", platoIds)

  const alergenosPorPlato = new Map<string, string[]>(
    (platos ?? []).map((p) => [p.id, p.alergenos])
  )

  // 3. Para cada perfil del día, obtener el user_id (a través de company_users)
  //    para después cruzar con user_allergies.
  const profileIds = [...new Set(pedidos.map((p) => p.profile_id))]

  // Mapeo profile_id -> lista de user_ids activos
  const profileToUsers = new Map<string, string[]>()

  // Caso 1: usuarios en company_users
  const { data: companyUsers } = await admin
    .from("company_users")
    .select("profile_id, user_id")
    .in("profile_id", profileIds)
    .eq("is_active", true)

  for (const cu of companyUsers ?? []) {
    const lista = profileToUsers.get(cu.profile_id) ?? []
    lista.push(cu.user_id)
    profileToUsers.set(cu.profile_id, lista)
  }

  // Caso 2: admin/perfil directo — el profile_id ES el user_id
  for (const pid of profileIds) {
    if (!profileToUsers.has(pid)) {
      profileToUsers.set(pid, [pid])
    }
  }

  // 4. Obtener alergias de todos los usuarios implicados
  const todosUserIds = [...new Set([...profileToUsers.values()].flat())]
  const { data: alergias } = await supabase
    .from("user_allergies")
    .select("user_id, alergenos")
    .in("user_id", todosUserIds)

  const alergiasDeUsuario = new Map<string, string[]>(
    (alergias ?? []).map((a) => [a.user_id, a.alergenos])
  )

  // 5. Agrupar ítems por plato_id
  type ResumenPlato = {
    nombre: string
    raciones: number
    perfilesConPedido: Set<string>  // para cruzar intolerancias por pedido
    intolerancias: number
  }

  const resumen = new Map<string, ResumenPlato>()

  for (const pedido of pedidos) {
    const userIds = profileToUsers.get(pedido.profile_id) ?? []

    for (const item of pedido.pedido_items) {
      if (!resumen.has(item.plato_id)) {
        resumen.set(item.plato_id, {
          nombre: item.nombre_at_order,
          raciones: 0,
          perfilesConPedido: new Set(),
          intolerancias: 0,
        })
      }
      const r = resumen.get(item.plato_id)!
      r.raciones += item.quantity

      // Contar intolerancias: cuántos usuarios que tienen este pedido
      // tienen algún alergeno que coincide con el plato.
      // Solo contamos una vez por usuario (aunque haya pedido varias raciones).
      if (!r.perfilesConPedido.has(pedido.profile_id)) {
        r.perfilesConPedido.add(pedido.profile_id)
        const alergenosDelPlato = alergenosPorPlato.get(item.plato_id) ?? []

        for (const uid of userIds) {
          const alergenosUsuario = alergiasDeUsuario.get(uid) ?? []
          const tieneIntolerancia = alergenosUsuario.some((a) =>
            alergenosDelPlato.includes(a)
          )
          if (tieneIntolerancia) r.intolerancias++
        }
      }
    }
  }

  // 6. Construir CSV ordenado por nombre de plato
  const filas = [...resumen.values()]
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"))
    .map((r) => `${escaparCsv(r.nombre)};${r.raciones};${r.intolerancias}`)

  const csv =
    "﻿" +
    `Fecha exportación: ${fecha}\r\n` +
    `Total pedidos: ${pedidos.length}\r\n\r\n` +
    "Plato;Raciones;Intolerancias\r\n" +
    filas.join("\r\n") +
    "\r\n"

  return new Response(csv, {
    headers: csvHeaders(`pedidos-${fecha}.csv`),
  })
}

function escaparCsv(valor: string): string {
  if (valor.includes(";") || valor.includes('"') || valor.includes("\n")) {
    return `"${valor.replace(/"/g, '""')}"`
  }
  return valor
}

function csvHeaders(filename: string): HeadersInit {
  return {
    "Content-Type": "text/csv; charset=utf-8",
    "Content-Disposition": `attachment; filename="${filename}"`,
  }
}
