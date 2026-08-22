import { createClient, exigirAdmin } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

/**
 * GET /api/pedidos/exportar?fecha=YYYY-MM-DD
 *
 * Exporta un CSV con dos secciones:
 *  1. Platos del día agrupados: raciones totales + nombres de personas
 *     con alguna intolerancia para ese plato.
 *  2. Comentarios del día: empresa, persona y texto del comentario.
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

  // 1. Todos los pedidos del día con sus ítems
  const { data: pedidos, error } = await supabase
    .from("pedidos")
    .select(
      "id, profile_id, notes, pedido_items(plato_id, quantity, nombre_at_order), profiles(company_name)"
    )
    .eq("delivery_date", fecha)
    .neq("estado", "cancelado")

  if (error) return new Response("Error al consultar pedidos", { status: 500 })

  if (!pedidos || pedidos.length === 0) {
    const csv = "﻿Plato;Raciones;Personas con intolerancia\r\nNo hay pedidos para esta fecha\r\n"
    return new Response(csv, { headers: csvHeaders(`pedidos-${fecha}.csv`) })
  }

  // 2. Alergenos de los platos del día
  const platoIds = [...new Set(pedidos.flatMap((p) => p.pedido_items.map((i) => i.plato_id)))]
  const { data: platos } = await supabase
    .from("platos")
    .select("id, alergenos")
    .in("id", platoIds)

  const alergenosPorPlato = new Map<string, string[]>(
    (platos ?? []).map((p) => [p.id, p.alergenos])
  )

  // 3. Nombre de persona por profile_id (vía company_users)
  const profileIds = [...new Set(pedidos.map((p) => p.profile_id))]

  const { data: companyUsers } = await admin
    .from("company_users")
    .select("profile_id, user_id, first_name, last_name_1")
    .in("profile_id", profileIds)
    .eq("is_active", true)

  // Mapa profile_id → { nombre, userId } (primer usuario activo)
  const infoPersona = new Map<string, { nombre: string; userId: string }>()
  for (const cu of companyUsers ?? []) {
    if (!infoPersona.has(cu.profile_id)) {
      infoPersona.set(cu.profile_id, {
        nombre: [cu.first_name, cu.last_name_1].filter(Boolean).join(" "),
        userId: cu.user_id,
      })
    }
  }

  // Para perfiles directos sin company_user, user_id = profile_id
  const userIdPorPerfil = new Map<string, string>()
  for (const pid of profileIds) {
    const cu = infoPersona.get(pid)
    userIdPorPerfil.set(pid, cu ? cu.userId : pid)
  }

  // 4. Alergias de los usuarios
  const userIds = [...new Set([...userIdPorPerfil.values()])]
  const { data: alergias } = await supabase
    .from("user_allergies")
    .select("user_id, alergenos")
    .in("user_id", userIds)

  const alergiasDeUsuario = new Map<string, string[]>(
    (alergias ?? []).map((a) => [a.user_id, a.alergenos])
  )

  // Helper: nombre legible de la persona de un pedido
  function nombrePersona(profileId: string): string {
    const empresa =
      ((pedidos ?? []).find((p) => p.profile_id === profileId)?.profiles as
        | { company_name: string }
        | null)?.company_name ?? ""
    const persona = infoPersona.get(profileId)
    return persona ? persona.nombre : empresa || profileId
  }

  // 5. Agrupar ítems por plato_id
  type ResumenPlato = {
    nombre: string
    raciones: number
    personasIntolerantes: string[]   // nombres, sin repetir por pedido
    perfilesContados: Set<string>
  }

  const resumen = new Map<string, ResumenPlato>()

  for (const pedido of pedidos) {
    const userId = userIdPorPerfil.get(pedido.profile_id) ?? pedido.profile_id
    const alergenosUsuario = alergiasDeUsuario.get(userId) ?? []

    for (const item of pedido.pedido_items) {
      if (!resumen.has(item.plato_id)) {
        resumen.set(item.plato_id, {
          nombre: item.nombre_at_order,
          raciones: 0,
          personasIntolerantes: [],
          perfilesContados: new Set(),
        })
      }
      const r = resumen.get(item.plato_id)!
      r.raciones += item.quantity

      // Una sola vez por perfil: ¿tiene alguna intolerancia con este plato?
      if (!r.perfilesContados.has(pedido.profile_id)) {
        r.perfilesContados.add(pedido.profile_id)
        const alergenosPlato = alergenosPorPlato.get(item.plato_id) ?? []
        const tieneIntolerancia = alergenosUsuario.some((a) =>
          alergenosPlato.includes(a)
        )
        if (tieneIntolerancia) {
          r.personasIntolerantes.push(nombrePersona(pedido.profile_id))
        }
      }
    }
  }

  // 6. Sección 1: platos
  const filasCabecera = "Plato;Raciones;Personas con intolerancia"
  const filasPlatos = [...resumen.values()]
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"))
    .map(
      (r) =>
        `${esc(r.nombre)};${r.raciones};${esc(r.personasIntolerantes.join(", "))}`
    )

  // 7. Sección 2: comentarios
  const pedidosConNotas = pedidos.filter((p) => p.notes && p.notes.trim())
  const filasComentarios: string[] = []
  if (pedidosConNotas.length > 0) {
    filasComentarios.push("")
    filasComentarios.push("Empresa;Persona;Comentario")
    for (const pedido of pedidosConNotas) {
      const empresa =
        (pedido.profiles as { company_name: string } | null)?.company_name ?? ""
      const persona = infoPersona.get(pedido.profile_id)?.nombre ?? ""
      filasComentarios.push(
        `${esc(empresa)};${esc(persona)};${esc(pedido.notes ?? "")}`
      )
    }
  }

  const csv =
    "﻿" +
    `Fecha exportación: ${fecha}\r\n` +
    `Total pedidos: ${pedidos.length}\r\n\r\n` +
    filasCabecera + "\r\n" +
    filasPlatos.join("\r\n") +
    (filasComentarios.length > 0 ? "\r\n" + filasComentarios.join("\r\n") : "") +
    "\r\n"

  return new Response(csv, { headers: csvHeaders(`pedidos-${fecha}.csv`) })
}

function esc(valor: string): string {
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
