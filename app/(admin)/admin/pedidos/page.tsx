import type { Metadata } from "next"
import Link from "next/link"
import { ClipboardList, Clock, Download, MapPin, Phone, Plus, StickyNote } from "lucide-react"
import { SelectorEstado } from "@/components/admin/estado-pedido"
import { Card, Vacio } from "@/components/ui/misc"
import { createClient } from "@/lib/supabase/server"
import {
  aFechaISO,
  formatearFechaLarga,
  formatearHora,
  formatearPrecio,
  lunesDeLaSemana,
  sumarSemanas,
} from "@/lib/utils"

export const metadata: Metadata = { title: "Pedidos" }

const FILTROS = [
  { clave: "hoy", texto: "Hoy" },
  { clave: "semana", texto: "Esta semana" },
  { clave: "todos", texto: "Todos" },
] as const

export default async function AdminPedidosPage({
  searchParams,
}: {
  searchParams: Promise<{ filtro?: string }>
}) {
  const { filtro = "semana" } = await searchParams
  const supabase = await createClient()

  const hoy = aFechaISO(new Date())
  const lunes = aFechaISO(lunesDeLaSemana())
  const domingo = aFechaISO(sumarSemanas(lunesDeLaSemana(), 1))

  let consulta = supabase
    .from("pedidos")
    .select("*, pedido_items(*), profiles(company_name, contact_name, phone, delivery_address)")
    .order("delivery_date", { ascending: true })
    .order("slot_start", { ascending: true })

  if (filtro === "hoy") {
    consulta = consulta.eq("delivery_date", hoy)
  } else if (filtro === "semana") {
    consulta = consulta.gte("delivery_date", lunes).lt("delivery_date", domingo)
  } else {
    consulta = consulta.limit(100)
  }

  const { data: pedidos } = await consulta

  // Agrupa por día de entrega: es como se organiza el reparto.
  const porDia = new Map<string, NonNullable<typeof pedidos>>()
  for (const pedido of pedidos ?? []) {
    const lista = porDia.get(pedido.delivery_date) ?? []
    lista.push(pedido)
    porDia.set(pedido.delivery_date, lista)
  }

  const totalUnidades = (pedidos ?? []).reduce(
    (suma, p) =>
      suma + p.pedido_items.reduce((s: number, i) => s + i.quantity, 0),
    0,
  )

  return (
    <div className="max-w-4xl mx-auto">
      <header className="mb-7">
        <h1 className="font-display text-3xl sm:text-4xl">Pedidos</h1>
        <p className="mt-2 text-muted-foreground">
          {pedidos?.length ?? 0} pedidos · {totalUnidades} raciones en total
        </p>
      </header>

      <div className="flex flex-wrap gap-2 mb-6 items-center justify-between">
        <div className="flex gap-2">
          {FILTROS.map(({ clave, texto }) => (
            <Link
              key={clave}
              href={`/admin/pedidos?filtro=${clave}`}
              className={
                "px-4 h-10 inline-flex items-center rounded-full text-sm border transition-colors duration-200 cursor-pointer " +
                (filtro === clave
                  ? "border-primary bg-primary/12 text-primary font-medium"
                  : "border-border hover:bg-muted")
              }
            >
              {texto}
            </Link>
          ))}
        </div>

        <div className="flex gap-2">
          {filtro === "hoy" && (
            <a
              href={`/api/pedidos/exportar?fecha=${hoy}`}
              download
              className="px-4 h-10 inline-flex items-center gap-2 rounded-full text-sm border border-border hover:bg-muted transition-colors duration-200 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" aria-hidden="true" />
              Exportar CSV
            </a>
          )}
          <Link
            href="/admin/pedidos/nuevo"
            className="px-4 h-10 inline-flex items-center gap-2 rounded-full text-sm bg-primary text-on-primary hover:bg-primary-hover transition-colors duration-200 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
            Nuevo pedido
          </Link>
        </div>
      </div>

      {(pedidos ?? []).length === 0 ? (
        <Card>
          <Vacio
            icono={<ClipboardList className="w-5 h-5" />}
            titulo="No hay pedidos en este periodo"
            descripcion="Cuando los clientes hagan sus pedidos aparecerán aquí, agrupados por día de entrega."
          />
        </Card>
      ) : (
        <div className="space-y-8">
          {[...porDia.entries()].map(([dia, delDia]) => (
            <section key={dia}>
              <h2 className="font-display text-xl mb-3 first-letter:uppercase">
                {formatearFechaLarga(dia)}
                <span className="ml-2 text-sm font-sans text-muted-foreground">
                  ({delDia.length})
                </span>
              </h2>

              <ul className="space-y-3">
                {delDia.map((pedido) => {
                  const perfil = pedido.profiles as unknown as {
                    company_name: string
                    contact_name: string
                    phone: string | null
                    delivery_address: string | null
                  } | null

                  return (
                    <li key={pedido.id}>
                      <Card className="p-5">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-medium">
                              {perfil?.company_name || "Empresa sin nombre"}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {perfil?.contact_name}
                            </p>
                          </div>

                          <div className="flex items-center gap-3">
                            <SelectorEstado
                              pedidoId={pedido.id}
                              estado={pedido.estado}
                            />
                            <span className="font-display text-lg tabular-nums">
                              {formatearPrecio(pedido.total_cents)}
                            </span>
                          </div>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-muted-foreground">
                          <span className="inline-flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                            {formatearHora(pedido.slot_start)} h
                          </span>

                          {perfil?.phone && (
                            <a
                              href={`tel:${perfil.phone}`}
                              className="inline-flex items-center gap-1.5 hover:text-primary transition-colors duration-200 cursor-pointer"
                            >
                              <Phone className="w-3.5 h-3.5" aria-hidden="true" />
                              {perfil.phone}
                            </a>
                          )}

                          {perfil?.delivery_address && (
                            <span className="inline-flex items-start gap-1.5">
                              <MapPin
                                className="w-3.5 h-3.5 mt-0.5 shrink-0"
                                aria-hidden="true"
                              />
                              {perfil.delivery_address}
                            </span>
                          )}
                        </div>

                        {pedido.pedido_items.length > 0 && (
                          <ul className="mt-4 pt-4 border-t border-border space-y-1.5">
                            {pedido.pedido_items.map((item) => (
                              <li
                                key={item.id}
                                className="flex justify-between gap-3 text-sm"
                              >
                                <span>
                                  <span className="text-muted-foreground tabular-nums">
                                    {item.quantity}×{" "}
                                  </span>
                                  {item.nombre_at_order}
                                </span>
                                <span className="shrink-0 tabular-nums text-muted-foreground">
                                  {formatearPrecio(item.subtotal_cents ?? 0)}
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}

                        {pedido.notes && (
                          <p className="mt-4 flex items-start gap-2 text-sm bg-muted rounded-xl px-3.5 py-2.5">
                            <StickyNote
                              className="w-3.5 h-3.5 mt-0.5 shrink-0 text-primary"
                              aria-hidden="true"
                            />
                            {pedido.notes}
                          </p>
                        )}
                      </Card>
                    </li>
                  )
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
