import type { Metadata } from "next"
import { EditorMenu } from "@/components/admin/editor-menu"
import { createClient } from "@/lib/supabase/server"
import {
  aFechaISO,
  diasDeLaSemana,
  lunesDeLaSemana,
  semanaISO,
  sumarSemanas,
} from "@/lib/utils"

export const metadata: Metadata = { title: "Menús" }

export default async function AdminMenusPage({
  searchParams,
}: {
  searchParams: Promise<{ semana?: string }>
}) {
  const { semana } = await searchParams
  const supabase = await createClient()

  const desplazamiento = Math.max(-8, Math.min(12, Number(semana) || 0))
  const lunes = sumarSemanas(lunesDeLaSemana(), desplazamiento)
  const dias = diasDeLaSemana(lunes)
  const { anio, semana: numeroSemana } = semanaISO(lunes)

  const [{ data: platos }, { data: menu }] = await Promise.all([
    supabase.from("platos").select("*").order("categoria").order("nombre"),
    supabase
      .from("menus_semanales")
      .select("id, is_published, menu_items(menu_date, plato_id)")
      .eq("anio", anio)
      .eq("semana_iso", numeroSemana)
      .maybeSingle(),
  ])

  const seleccionInicial: Record<string, string[]> = {}
  for (const dia of dias) seleccionInicial[dia] = []
  for (const item of menu?.menu_items ?? []) {
    if (seleccionInicial[item.menu_date]) {
      seleccionInicial[item.menu_date].push(item.plato_id)
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <header className="mb-7">
        <h1 className="font-display text-3xl sm:text-4xl">Menús</h1>
        <p className="mt-2 text-muted-foreground">
          Elige qué se cocina cada día y publica la semana cuando esté lista.
        </p>
      </header>

      <EditorMenu
        dias={dias}
        platos={platos ?? []}
        seleccionInicial={seleccionInicial}
        publicadoInicial={menu?.is_published ?? false}
        anio={anio}
        semana={numeroSemana}
        desplazamiento={desplazamiento}
        lunes={aFechaISO(lunes)}
      />
    </div>
  )
}
