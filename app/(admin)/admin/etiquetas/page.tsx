import { redirect } from "next/navigation"
import { createClient, exigirAdmin } from "@/lib/supabase/server"
import { EtiquetasDownload } from "@/components/admin/etiquetas-download"

export const metadata = { title: "Etiquetas del día — Admin" }

export default async function EtiquetasPage() {
  const perfil = await exigirAdmin()
  if (!perfil) redirect("/login")

  const supabase = await createClient()
  const hoy = new Date().toISOString().slice(0, 10)

  // Días que tienen pedidos activos (para sugerir fechas con pedidos)
  const { data: diasConPedidos } = await supabase
    .from("pedidos")
    .select("delivery_date")
    .neq("estado", "cancelado")
    .gte("delivery_date", hoy)
    .lte("delivery_date", new Date(Date.now() + 14 * 86400_000).toISOString().slice(0, 10))
    .order("delivery_date")

  const fechasDisponibles = [
    ...new Set((diasConPedidos ?? []).map((p) => p.delivery_date)),
  ]

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-semibold mb-1">Etiquetas del día</h1>
      <p className="text-muted-foreground text-sm mb-8">
        Genera un PDF con las etiquetas de bolsa de cada pedido. Dos etiquetas por hoja A4.
      </p>
      <EtiquetasDownload fechasDisponibles={fechasDisponibles} fechaHoy={hoy} />
    </div>
  )
}
