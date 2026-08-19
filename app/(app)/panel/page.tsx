import type { Metadata } from "next"
import { CalendarOff } from "lucide-react"
import { PedidoSemanal } from "@/components/pedido/pedido-semanal"
import { Vacio } from "@/components/ui/misc"
import { createClient, getPerfil } from "@/lib/supabase/server"
import {
  aFechaISO,
  diasDeLaSemana,
  lunesDeLaSemana,
  rangoSemana,
  semanaISO,
  sumarSemanas,
} from "@/lib/utils"
import type { Plato } from "@/lib/database.types"

export const metadata: Metadata = { title: "Pedido semanal" }

export type PlatoDelDia = { fecha: string; plato: Plato }

export default async function PanelPage({
  searchParams,
}: {
  searchParams: Promise<{ semana?: string }>
}) {
  const { semana } = await searchParams
  const perfil = await getPerfil()
  const supabase = await createClient()

  // `semana` es un desplazamiento en semanas respecto a la actual.
  // Se acota para que nadie pueda pedir la semana 900 y forzar consultas absurdas.
  const desplazamiento = Math.max(-4, Math.min(8, Number(semana) || 0))
  const lunes = sumarSemanas(lunesDeLaSemana(), desplazamiento)
  const dias = diasDeLaSemana(lunes)
  const { anio, semana: numeroSemana } = semanaISO(lunes)

  // Menú publicado de la semana con sus platos.
  const { data: menu } = await supabase
    .from("menus_semanales")
    .select("id, is_published, menu_items(menu_date, sort_order, platos(*))")
    .eq("anio", anio)
    .eq("semana_iso", numeroSemana)
    .eq("is_published", true)
    .maybeSingle()

  const platosPorDia: PlatoDelDia[] = (menu?.menu_items ?? [])
    .filter((mi) => mi.platos)
    .map((mi) => ({
      fecha: mi.menu_date,
      plato: mi.platos as unknown as Plato,
    }))

  // Pedidos ya existentes de esta semana, para precargar el formulario.
  const { data: pedidos } = await supabase
    .from("pedidos")
    .select("*, pedido_items(*)")
    .eq("profile_id", perfil!.id)
    .gte("delivery_date", dias[0])
    .lte("delivery_date", dias[dias.length - 1])

  // Cierre de pedidos por día: lo calcula la base de datos, que es la que manda.
  const editables: Record<string, boolean> = {}
  await Promise.all(
    dias.map(async (dia) => {
      const { data } = await supabase.rpc("pedido_editable", {
        p_delivery_date: dia,
      })
      editables[dia] = data ?? false
    }),
  )

  const sinMenu = platosPorDia.length === 0

  return (
    <div className="max-w-5xl mx-auto">
      <header className="mb-7">
        <h1 className="font-display text-3xl sm:text-4xl">Pedido semanal</h1>
        <p className="mt-2 text-muted-foreground">
          Elige los platos de cada día y la hora en que quieres recibirlos.
        </p>
      </header>

      {sinMenu ? (
        <SinMenu desplazamiento={desplazamiento} lunes={lunes} />
      ) : (
        <PedidoSemanal
          dias={dias}
          platosPorDia={platosPorDia}
          pedidos={pedidos ?? []}
          editables={editables}
          desplazamiento={desplazamiento}
          lunes={aFechaISO(lunes)}
          direccion={perfil!.delivery_address}
        />
      )}
    </div>
  )
}

function SinMenu({
  desplazamiento,
  lunes,
}: {
  desplazamiento: number
  lunes: Date
}) {
  return (
    <div className="bg-surface border border-border rounded-card">
      <Vacio
        icono={<CalendarOff className="w-5 h-5" />}
        titulo="Todavía no hay menú para esta semana"
        descripcion={
          desplazamiento > 0
            ? "Publicamos el menú de cada semana con unos días de antelación. Vuelve a mirar en breve."
            : "Si necesitas hacer un pedido para estos días, llámanos y lo organizamos contigo."
        }
      >
        <NavegacionSemana desplazamiento={desplazamiento} lunes={lunes} />
      </Vacio>
    </div>
  )
}

function NavegacionSemana({
  desplazamiento,
  lunes,
}: {
  desplazamiento: number
  lunes: Date
}) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3 text-sm">
      <a
        href={`/panel?semana=${desplazamiento - 1}`}
        className="px-3.5 h-11 inline-flex items-center rounded-full border border-border hover:bg-muted transition-colors duration-200 cursor-pointer"
      >
        Semana anterior
      </a>
      <span className="text-muted-foreground">{rangoSemana(lunes)}</span>
      <a
        href={`/panel?semana=${desplazamiento + 1}`}
        className="px-3.5 h-11 inline-flex items-center rounded-full border border-border hover:bg-muted transition-colors duration-200 cursor-pointer"
      >
        Semana siguiente
      </a>
    </div>
  )
}
