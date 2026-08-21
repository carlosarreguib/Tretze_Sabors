"use client"

import { useState } from "react"
import { Card } from "@/components/ui/misc"
import { CATEGORIAS, ORDEN_CATEGORIAS } from "@/lib/constants"
import { cn, formatearPrecio } from "@/lib/utils"
import type { ResumenMensual } from "@/lib/facturacion/consumo"

/** Resumen final del periodo, con toggle entre vista por categoria y por producto. */
export function ResumenCategoriaProducto({ resumen }: { resumen: ResumenMensual }) {
  const [vista, setVista] = useState<"categoria" | "producto">("categoria")

  if (resumen.lineas.length === 0) return null

  const filasCategoria = ORDEN_CATEGORIAS.filter((c) => resumen.porCategoria.has(c)).map((c) => ({
    key: c,
    etiqueta: CATEGORIAS[c],
    esAjuste: false,
    ...resumen.porCategoria.get(c)!,
  }))
  const filasProducto = [...resumen.porProducto.entries()]
    .sort(([, a], [, b]) => b.total_cents - a.total_cents)
    .map(([key, datos]) => ({ key, etiqueta: datos.descripcion, ...datos }))

  const filas = vista === "categoria" ? filasCategoria : filasProducto
  const total = filas.reduce((s, f) => s + f.total_cents, 0)

  return (
    <Card className="p-5 mb-6">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h2 className="font-display text-lg">Resumen del periodo</h2>
        <div className="flex gap-1 text-xs">
          {(["categoria", "producto"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setVista(v)}
              className={cn(
                "px-3 py-1.5 rounded-full border transition-colors duration-200 cursor-pointer",
                vista === v
                  ? "border-primary bg-primary/12 text-primary font-medium"
                  : "border-border hover:bg-muted",
              )}
            >
              {v === "categoria" ? "Por categoría" : "Por producto"}
            </button>
          ))}
        </div>
      </div>

      <ul className="space-y-2">
        {filas.map((f) => (
          <li key={f.key} className="flex justify-between gap-3 text-sm">
            <span className="min-w-0">
              {f.etiqueta}
              {f.esAjuste && (
                <span className="ml-2 text-xs text-muted-foreground">(Ajuste)</span>
              )}
              {vista === "producto" && !f.esAjuste && (
                <span className="ml-2 text-xs text-muted-foreground tabular-nums">
                  {f.cantidad} uds.
                </span>
              )}
            </span>
            <span className="shrink-0 tabular-nums">{formatearPrecio(f.total_cents)}</span>
          </li>
        ))}
      </ul>

      <div className="mt-4 pt-3 border-t border-border flex justify-between items-baseline font-medium">
        <span>Total</span>
        <span className="tabular-nums">{formatearPrecio(total)}</span>
      </div>
    </Card>
  )
}
