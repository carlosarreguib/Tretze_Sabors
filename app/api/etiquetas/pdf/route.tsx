import { createClient, exigirAdmin } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { renderToBuffer } from "@react-pdf/renderer"
import { EtiquetasPdf, type DatosEtiqueta } from "@/lib/pdf/etiquetas-pdf"

/**
 * GET /api/etiquetas/pdf?fecha=YYYY-MM-DD
 *
 * Genera un PDF con etiquetas de bolsa para todos los pedidos del día.
 * Una etiqueta por persona (perfil), con: fecha, empresa, nombre persona,
 * alergenos, comentarios y platos escogidos.
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

  // 1. Pedidos del día con ítems y perfil de empresa
  const { data: pedidos, error } = await supabase
    .from("pedidos")
    .select(
      "id, profile_id, notes, pedido_items(plato_id, quantity, nombre_at_order), profiles(company_name)"
    )
    .eq("delivery_date", fecha)
    .neq("estado", "cancelado")
    .order("profile_id")

  if (error) return new Response("Error al consultar pedidos", { status: 500 })
  if (!pedidos || pedidos.length === 0) {
    return new Response("No hay pedidos para esta fecha", { status: 404 })
  }

  // 2. Nombre de la persona por pedido — buscar en company_users
  const profileIds = [...new Set(pedidos.map((p) => p.profile_id))]

  const { data: companyUsers } = await admin
    .from("company_users")
    .select("profile_id, user_id, first_name, last_name_1, last_name_2")
    .in("profile_id", profileIds)
    .eq("is_active", true)

  // Mapa profile_id → primer company_user activo encontrado
  const usuarioPorPerfil = new Map<string, { nombre: string; userId: string }>()
  for (const cu of companyUsers ?? []) {
    if (!usuarioPorPerfil.has(cu.profile_id)) {
      const nombre = [cu.first_name, cu.last_name_1, cu.last_name_2]
        .filter(Boolean)
        .join(" ")
      usuarioPorPerfil.set(cu.profile_id, { nombre, userId: cu.user_id })
    }
  }

  // Para perfiles directos (admin o empresa sin company_user), user_id = profile_id
  const userIdPorPerfil = new Map<string, string>()
  for (const pid of profileIds) {
    const cu = usuarioPorPerfil.get(pid)
    userIdPorPerfil.set(pid, cu ? cu.userId : pid)
  }

  // 3. Alergias de los usuarios
  const userIds = [...new Set([...userIdPorPerfil.values()])]
  const { data: alergias } = await supabase
    .from("user_allergies")
    .select("user_id, alergenos")
    .in("user_id", userIds)

  const alergiasDeUsuario = new Map<string, string[]>(
    (alergias ?? []).map((a) => [a.user_id, a.alergenos])
  )

  // 4. Fecha legible en español
  const fechaLegible = new Date(fecha + "T12:00:00")
    .toLocaleDateString("es-ES", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    })
    .replace(/^\w/, (c) => c.toUpperCase())

  // 5. Construir datos de etiqueta por pedido
  const etiquetas: DatosEtiqueta[] = pedidos.map((pedido) => {
    const empresa =
      (pedido.profiles as unknown as { company_name: string } | null)
        ?.company_name ?? "—"

    const infoPersona = usuarioPorPerfil.get(pedido.profile_id)
    const persona = infoPersona?.nombre ?? null

    const userId = userIdPorPerfil.get(pedido.profile_id) ?? pedido.profile_id
    const alergenos = alergiasDeUsuario.get(userId) ?? []

    const platos = pedido.pedido_items.map((item) =>
      item.quantity > 1
        ? `${item.nombre_at_order} ×${item.quantity}`
        : item.nombre_at_order
    )

    return {
      fecha: fechaLegible,
      empresa,
      persona,
      alergenos,
      notas: pedido.notes ?? null,
      platos,
    }
  })

  // 6. Renderizar PDF
  const buffer = await renderToBuffer(<EtiquetasPdf etiquetas={etiquetas} />)

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="etiquetas-${fecha}.pdf"`,
    },
  })
}
