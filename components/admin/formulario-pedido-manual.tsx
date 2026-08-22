"use client"

import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { AlertCircle, CheckCircle2, Loader2, Minus, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Aviso, Card } from "@/components/ui/misc"
import { crearPedidoAdmin } from "@/lib/actions/pedidos"
import { FRANJAS, CATEGORIAS, ORDEN_CATEGORIAS, type Franja } from "@/lib/constants"
import type { Perfil, Plato } from "@/lib/database.types"

type PlatoDelDia = { fecha: string; plato: Plato }

export function FormularioPedidoManual({
  empresas,
  platosPorDia,
  diasDisponibles,
}: {
  empresas: Pick<Perfil, "id" | "company_name">[]
  platosPorDia: PlatoDelDia[]
  diasDisponibles: string[]
}) {
  const router = useRouter()
  const [guardando, iniciarGuardado] = useTransition()

  const [profileId, setProfileId] = useState(empresas[0]?.id ?? "")
  const [fecha, setFecha] = useState(diasDisponibles[0] ?? "")
  const [franja, setFranja] = useState<Franja>("13:00")
  const [notas, setNotas] = useState("")
  const [cantidades, setCantidades] = useState<Record<string, number>>({})
  const [resultado, setResultado] = useState<{ ok: boolean; mensaje: string } | null>(null)

  const platosDelDia = platosPorDia
    .filter((p) => p.fecha === fecha)
    .map((p) => p.plato)

  // Agrupar por categoría
  const porCategoria = new Map<string, Plato[]>()
  for (const plato of platosDelDia) {
    const lista = porCategoria.get(plato.categoria) ?? []
    lista.push(plato)
    porCategoria.set(plato.categoria, lista)
  }

  function cambiarCantidad(platoId: string, delta: number) {
    setResultado(null)
    setCantidades((prev) => {
      const actual = prev[platoId] ?? 0
      const nueva = Math.max(0, Math.min(500, actual + delta))
      const siguiente = { ...prev }
      if (nueva === 0) delete siguiente[platoId]
      else siguiente[platoId] = nueva
      return siguiente
    })
  }

  // Al cambiar fecha, limpiar cantidades
  function cambiarFecha(nuevaFecha: string) {
    setFecha(nuevaFecha)
    setCantidades({})
    setResultado(null)
  }

  const items = Object.entries(cantidades).map(([plato_id, quantity]) => ({
    plato_id,
    quantity,
  }))

  const totalRaciones = items.reduce((s, i) => s + i.quantity, 0)

  function guardar() {
    setResultado(null)
    iniciarGuardado(async () => {
      const res = await crearPedidoAdmin({
        profile_id: profileId,
        delivery_date: fecha,
        slot_start: franja,
        notes: notas || undefined,
        items,
      })
      setResultado(res)
      if (res.ok) {
        setCantidades({})
        router.push("/admin/pedidos?filtro=hoy")
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Empresa y fecha */}
      <Card className="p-6 space-y-5">
        <h2 className="font-display text-xl">Empresa y día</h2>

        <div className="grid sm:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <label htmlFor="empresa" className="block text-sm font-medium">
              Empresa
            </label>
            <select
              id="empresa"
              value={profileId}
              onChange={(e) => {
                setProfileId(e.target.value)
                setCantidades({})
                setResultado(null)
              }}
              className="w-full h-11 px-3.5 rounded-xl bg-surface border border-border cursor-pointer focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring"
            >
              {empresas.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.company_name || "Empresa sin nombre"}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="fecha" className="block text-sm font-medium">
              Día del menú
            </label>
            <select
              id="fecha"
              value={fecha}
              onChange={(e) => cambiarFecha(e.target.value)}
              className="w-full h-11 px-3.5 rounded-xl bg-surface border border-border cursor-pointer focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring"
            >
              {diasDisponibles.length === 0 ? (
                <option value="">Sin menú publicado esta semana</option>
              ) : (
                diasDisponibles.map((d) => (
                  <option key={d} value={d}>
                    {new Intl.DateTimeFormat("es-ES", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    }).format(new Date(d + "T12:00:00"))}
                  </option>
                ))
              )}
            </select>
          </div>
        </div>
      </Card>

      {/* Platos del día */}
      {platosDelDia.length === 0 ? (
        <Aviso>
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
          <span>No hay menú publicado para este día.</span>
        </Aviso>
      ) : (
        <Card className="p-6">
          <h2 className="font-display text-xl mb-5">Platos</h2>
          <div className="space-y-6">
            {ORDEN_CATEGORIAS.filter((c) => porCategoria.has(c)).map((categoria) => (
              <section key={categoria}>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  {CATEGORIAS[categoria]}
                </h3>
                <ul className="space-y-2">
                  {porCategoria.get(categoria)!.map((plato) => {
                    const cantidad = cantidades[plato.id] ?? 0
                    return (
                      <li key={plato.id}>
                        <div className="flex items-center justify-between gap-4 py-2">
                          <div className="min-w-0">
                            <p className="font-medium leading-snug">{plato.nombre}</p>
                            {plato.alergenos.length > 0 && (
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {plato.alergenos.join(", ")}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => cambiarCantidad(plato.id, -1)}
                              disabled={cantidad === 0}
                              aria-label={`Quitar ${plato.nombre}`}
                              className="w-8 h-8 grid place-items-center rounded-lg border border-border hover:bg-muted disabled:opacity-35 disabled:cursor-not-allowed transition-colors cursor-pointer"
                            >
                              <Minus className="w-3.5 h-3.5" aria-hidden="true" />
                            </button>
                            <span className="w-8 text-center text-sm font-medium tabular-nums">
                              {cantidad}
                            </span>
                            <button
                              type="button"
                              onClick={() => cambiarCantidad(plato.id, 1)}
                              aria-label={`Añadir ${plato.nombre}`}
                              className="w-8 h-8 grid place-items-center rounded-lg border border-border hover:bg-muted transition-colors cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                            </button>
                          </div>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </section>
            ))}
          </div>
        </Card>
      )}

      {/* Hora y notas */}
      {platosDelDia.length > 0 && (
        <Card className="p-6 space-y-5">
          <h2 className="font-display text-xl">Entrega</h2>

          <div className="space-y-1.5">
            <label htmlFor="franja" className="block text-sm font-medium">
              Hora de entrega
            </label>
            <select
              id="franja"
              value={franja}
              onChange={(e) => setFranja(e.target.value as Franja)}
              className="w-full h-11 px-3.5 rounded-xl bg-surface border border-border cursor-pointer focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring"
            >
              {FRANJAS.map((f) => (
                <option key={f} value={f}>
                  {f} h
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="notas" className="block text-sm font-medium">
              Notas para la cocina
            </label>
            <textarea
              id="notas"
              rows={2}
              maxLength={500}
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Alergias, sala de entrega, instrucciones especiales…"
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border resize-y placeholder:text-muted-foreground/60 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring"
            />
          </div>

          {resultado && (
            <Aviso tono={resultado.ok ? "exito" : "error"}>
              {resultado.ok ? (
                <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
              ) : (
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
              )}
              <span>{resultado.mensaje}</span>
            </Aviso>
          )}

          <Button
            onClick={guardar}
            disabled={guardando || items.length === 0}
            className="w-full"
          >
            {guardando ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                Guardando…
              </>
            ) : (
              `Confirmar pedido${totalRaciones > 0 ? ` (${totalRaciones} raciones)` : ""}`
            )}
          </Button>
        </Card>
      )}
    </div>
  )
}
