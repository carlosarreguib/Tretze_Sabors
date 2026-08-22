"use client"

import { useState } from "react"
import { Download } from "lucide-react"

export function EtiquetasDownload({
  fechasDisponibles,
  fechaHoy,
}: {
  fechasDisponibles: string[]
  fechaHoy: string
}) {
  // Seleccionar por defecto la primera fecha disponible, o hoy si no hay ninguna
  const [fecha, setFecha] = useState<string>(fechasDisponibles[0] ?? fechaHoy)

  const urlDescarga = `/api/etiquetas/pdf?fecha=${fecha}`

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <label htmlFor="fecha-etiquetas" className="text-sm font-medium">
          Fecha del menú
        </label>
        <input
          id="fecha-etiquetas"
          type="date"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
          min={fechaHoy}
          className="h-10 px-3 rounded-xl border border-border bg-surface text-sm focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring w-48"
        />
        {fechasDisponibles.length > 0 && (
          <p className="text-xs text-muted-foreground">
            Días con pedidos en las próximas 2 semanas:{" "}
            {fechasDisponibles.map((f) => formatearFechaCorta(f)).join(", ")}
          </p>
        )}
      </div>

      <a
        href={urlDescarga}
        download={`etiquetas-${fecha}.pdf`}
        className="inline-flex items-center gap-2 h-10 px-5 rounded-full bg-primary text-on-primary text-sm font-medium hover:bg-primary-hover transition-colors w-fit"
      >
        <Download className="w-4 h-4" aria-hidden="true" />
        Descargar etiquetas PDF
      </a>
    </div>
  )
}

function formatearFechaCorta(fecha: string): string {
  const [, m, d] = fecha.split("-")
  return `${d}/${m}`
}
