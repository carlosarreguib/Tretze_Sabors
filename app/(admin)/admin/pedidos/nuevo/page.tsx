import type { Metadata } from "next"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { FormularioPedidoManual } from "@/components/admin/formulario-pedido-manual"
import { createClient } from "@/lib/supabase/server"
import {
  aFechaISO,
  diasDeLaSemana,
  lunesDeLaSemana,
  semanaISO,
} from "@/lib/utils"
import type { Plato } from "@/lib/database.types"

export const metadata: Metadata = { title: "Nuevo pedido manual" }

export default async function NuevoPedidoPage() {
  const supabase = await createClient()

  // Empresas clientes para el selector
  const { data: empresas } = await supabase
    .from("profiles")
    .select("id, company_name")
    .eq("role", "client")
    .eq("is_active", true)
    .order("company_name")

  // Menú de esta semana + la siguiente (permite entrar pedidos de mañana)
  // Cargamos dos semanas para que el admin pueda anticiparse.
  const lunes = lunesDeLaSemana()
  const lunesSiguiente = new Date(lunes)
  lunesSiguiente.setDate(lunes.getDate() + 7)

  const semanaActual = semanaISO(lunes)
  const semanaSiguiente = semanaISO(lunesSiguiente)

  const { data: menus } = await supabase
    .from("menus_semanales")
    .select("id, anio, semana_iso, menu_items(menu_date, sort_order, platos(*))")
    .eq("is_published", true)
    .or(
      `and(anio.eq.${semanaActual.anio},semana_iso.eq.${semanaActual.semana}),` +
      `and(anio.eq.${semanaSiguiente.anio},semana_iso.eq.${semanaSiguiente.semana})`
    )

  type PlatoDelDia = { fecha: string; plato: Plato }
  const platosPorDia: PlatoDelDia[] = (menus ?? [])
    .flatMap((m) => m.menu_items)
    .filter((mi) => mi.platos)
    .map((mi) => ({
      fecha: mi.menu_date,
      plato: mi.platos as unknown as Plato,
    }))

  // Días disponibles únicos ordenados (lunes-sábado de esta semana y la siguiente)
  const diasActual = diasDeLaSemana(lunes)
  const diasSiguiente = diasDeLaSemana(lunesSiguiente)
  const todosLosDias = [...diasActual, ...diasSiguiente]

  // Solo mostrar los días que tienen menú publicado
  const diasConMenu = [...new Set(platosPorDia.map((p) => p.fecha))].sort()
  const diasDisponibles = todosLosDias.filter((d) => diasConMenu.includes(d))

  // Si no hay nada de las semanas próximas, al menos mostramos hoy
  if (diasDisponibles.length === 0) {
    diasDisponibles.push(aFechaISO(new Date()))
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Link
        href="/admin/pedidos"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 mb-6 cursor-pointer"
      >
        <ChevronLeft className="w-4 h-4" aria-hidden="true" />
        Volver a Pedidos
      </Link>

      <header className="mb-7">
        <h1 className="font-display text-3xl sm:text-4xl">Nuevo pedido manual</h1>
        <p className="mt-2 text-muted-foreground">
          Entra un pedido en nombre de una empresa. El administrador puede hacerlo
          para cualquier día, incluso fuera del plazo habitual.
        </p>
      </header>

      <FormularioPedidoManual
        empresas={empresas ?? []}
        platosPorDia={platosPorDia}
        diasDisponibles={diasDisponibles}
      />
    </div>
  )
}
