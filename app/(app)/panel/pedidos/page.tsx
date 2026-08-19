import type { Metadata } from "next"
import Link from "next/link"
import { ClipboardList, Clock, StickyNote } from "lucide-react"
import { ButtonLink } from "@/components/ui/button"
import { Card, EstadoBadge, Vacio } from "@/components/ui/misc"
import { CancelarPedido } from "@/components/pedido/cancelar"
import { createClient, getPerfil } from "@/lib/supabase/server"
import {
  aFechaISO,
  formatearFechaLarga,
  formatearHora,
  formatearPrecio,
} from "@/lib/utils"

export const metadata: Metadata = { title: "Mis pedidos" }

export default async function PedidosPage() {
  const perfil = await getPerfil()
  const supabase = await createClient()

  const { data: pedidos } = await supabase
    .from("pedidos")
    .select("*, pedido_items(*)")
    .eq("profile_id", perfil!.id)
    .order("delivery_date", { ascending: false })
    .limit(60)

  const hoy = aFechaISO(new Date())
  const proximos = (pedidos ?? []).filter((p) => p.delivery_date >= hoy)
  const pasados = (pedidos ?? []).filter((p) => p.delivery_date < hoy)

  return (
    <div className="max-w-3xl mx-auto">
      <header className="mb-7">
        <h1 className="font-display text-3xl sm:text-4xl">Mis pedidos</h1>
        <p className="mt-2 text-muted-foreground">
          Consulta lo que has pedido y lo que está por llegar.
        </p>
      </header>

      {(pedidos ?? []).length === 0 ? (
        <Card>
          <Vacio
            icono={<ClipboardList className="w-5 h-5" />}
            titulo="Todavía no has hecho ningún pedido"
            descripcion="Cuando hagas tu primer pedido aparecerá aquí, junto con todo el histórico."
          >
            <ButtonLink href="/panel">Ver el menú de esta semana</ButtonLink>
          </Vacio>
        </Card>
      ) : (
        <div className="space-y-10">
          {proximos.length > 0 && (
            <section>
              <h2 className="font-display text-xl mb-4">Próximas entregas</h2>
              <ul className="space-y-3">
                {proximos.map((pedido) => (
                  <li key={pedido.id}>
                    <TarjetaPedido pedido={pedido} permitirCancelar />
                  </li>
                ))}
              </ul>
            </section>
          )}

          {pasados.length > 0 && (
            <section>
              <h2 className="font-display text-xl mb-4">Historial</h2>
              <ul className="space-y-3">
                {pasados.map((pedido) => (
                  <li key={pedido.id}>
                    <TarjetaPedido pedido={pedido} />
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </div>
  )
}

type PedidoConItems = {
  id: string
  delivery_date: string
  slot_start: string
  estado: "pendiente" | "confirmado" | "entregado" | "cancelado"
  notes: string | null
  total_cents: number
  pedido_items: {
    id: string
    nombre_at_order: string
    quantity: number
    subtotal_cents: number | null
  }[]
}

function TarjetaPedido({
  pedido,
  permitirCancelar = false,
}: {
  pedido: PedidoConItems
  permitirCancelar?: boolean
}) {
  const cancelable =
    permitirCancelar &&
    (pedido.estado === "pendiente" || pedido.estado === "confirmado")

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-display text-lg leading-snug first-letter:uppercase">
            {formatearFechaLarga(pedido.delivery_date)}
          </p>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
            <Clock className="w-3.5 h-3.5" aria-hidden="true" />
            Entrega a las {formatearHora(pedido.slot_start)} h
          </p>
        </div>

        <div className="flex items-center gap-3">
          <EstadoBadge estado={pedido.estado} />
          <span className="font-display text-xl tabular-nums">
            {formatearPrecio(pedido.total_cents)}
          </span>
        </div>
      </div>

      {pedido.pedido_items.length > 0 && (
        <ul className="mt-4 pt-4 border-t border-border space-y-1.5">
          {pedido.pedido_items.map((item) => (
            <li key={item.id} className="flex justify-between gap-3 text-sm">
              <span className="min-w-0">
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
        <p className="mt-4 flex items-start gap-2 text-sm text-muted-foreground bg-muted rounded-xl px-3.5 py-2.5">
          <StickyNote className="w-3.5 h-3.5 mt-0.5 shrink-0" aria-hidden="true" />
          {pedido.notes}
        </p>
      )}

      {cancelable && (
        <div className="mt-4 pt-4 border-t border-border flex flex-wrap gap-2 justify-end">
          <Link
            href="/panel"
            className="inline-flex items-center h-9 px-3 rounded-full text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors duration-200 cursor-pointer"
          >
            Modificar
          </Link>
          <CancelarPedido pedidoId={pedido.id} />
        </div>
      )}
    </Card>
  )
}
