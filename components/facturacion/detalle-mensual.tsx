"use client"

import { useState, type ReactNode } from "react"
import { ChevronDown } from "lucide-react"
import { Card, Vacio } from "@/components/ui/misc"
import { CATEGORIAS } from "@/lib/constants"
import { cn, formatearFechaCorta, formatearPrecio } from "@/lib/utils"
import type { ResumenMensual } from "@/lib/facturacion/consumo"

/**
 * Lista expandible por dia. No hay libreria de acordeon en el proyecto: se
 * usa un Set local de fechas abiertas y un boton con aria-expanded, igual de
 * ligero que el patron de pestañas ya usado en pedido-semanal.tsx.
 */
export function DetalleMensual({
  resumen,
  accionesPorDia,
}: {
  resumen: ResumenMensual
  /** Acciones extra (admin) a mostrar bajo el detalle de un dia concreto. */
  accionesPorDia?: (fecha: string) => ReactNode
}) {
  const [abiertos, setAbiertos] = useState<Set<string>>(new Set())
  const dias = [...resumen.porDia.entries()].sort(([a], [b]) => a.localeCompare(b))

  if (dias.length === 0) {
    return (
      <Card className="mb-6">
        <Vacio titulo="Sin consumo este mes" descripcion="No hay pedidos registrados para este periodo." />
      </Card>
    )
  }

  function alternar(fecha: string) {
    setAbiertos((prev) => {
      const siguiente = new Set(prev)
      if (siguiente.has(fecha)) siguiente.delete(fecha)
      else siguiente.add(fecha)
      return siguiente
    })
  }

  return (
    <Card className="mb-6">
      <ul className="divide-y divide-border">
        {dias.map(([fecha, { lineas, total_cents }]) => {
          const abierto = abiertos.has(fecha)
          return (
            <li key={fecha}>
              <button
                type="button"
                aria-expanded={abierto}
                aria-controls={`dia-${fecha}`}
                onClick={() => alternar(fecha)}
                className="w-full flex items-center justify-between gap-3 px-5 py-4 hover:bg-muted transition-colors duration-200 cursor-pointer"
              >
                <span className="font-medium uppercase text-sm">
                  {formatearFechaCorta(fecha)}
                </span>
                <span className="flex items-center gap-3">
                  <span className="tabular-nums font-display">
                    {formatearPrecio(total_cents)}
                  </span>
                  <ChevronDown
                    className={cn(
                      "w-4 h-4 text-muted-foreground transition-transform duration-200",
                      abierto && "rotate-180",
                    )}
                    aria-hidden="true"
                  />
                </span>
              </button>

              {abierto && (
                <div id={`dia-${fecha}`} className="px-5 pb-5 space-y-3">
                  <ul className="space-y-2">
                    {lineas.map((l, i) => (
                      <li
                        key={i}
                        className="flex items-center justify-between gap-3 text-sm py-1.5 border-b border-border/60 last:border-0"
                      >
                        <span className="min-w-0">
                          <span className="tabular-nums text-muted-foreground">
                            {l.quantity}×{" "}
                          </span>
                          {l.descripcion}
                          <span className="ml-2 text-xs text-muted-foreground">
                            {l.tipo === "ajuste"
                              ? "Ajuste"
                              : l.categoria
                                ? CATEGORIAS[l.categoria]
                                : ""}
                          </span>
                        </span>
                        <span className="shrink-0 tabular-nums">
                          {formatearPrecio(l.subtotal_cents)}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <div className="flex justify-between items-baseline pt-1 text-sm font-medium">
                    <span>Total del día</span>
                    <span className="tabular-nums">{formatearPrecio(total_cents)}</span>
                  </div>

                  {accionesPorDia?.(fecha)}
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </Card>
  )
}
