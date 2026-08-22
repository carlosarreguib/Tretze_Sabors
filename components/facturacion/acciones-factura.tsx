"use client"

import { useState, useTransition } from "react"
import { AlertCircle, Loader2 } from "lucide-react"
import { ConfirmarAccion } from "@/components/ui/confirmar-accion"
import { Aviso } from "@/components/ui/misc"
import {
  anularFactura,
  cerrarPeriodo,
  marcarEmitida,
  marcarPagada,
} from "@/lib/actions/facturacion"
import type { Factura } from "@/lib/database.types"

/** Botones de accion de admin, segun el estado actual de la factura del periodo. */
export function AccionesFactura({
  profileId,
  anio,
  mes,
  factura,
}: {
  profileId: string
  anio: number
  mes: number
  factura: Factura | null
}) {
  const [mostrarFormNum, setMostrarFormNum] = useState(false)
  const [numero, setNumero] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [cerrando, iniciarCierre] = useTransition()

  function handleCerrar() {
    const n = numero.trim()
    if (!n) {
      setError("Introduce el número de factura.")
      return
    }
    setError(null)
    iniciarCierre(async () => {
      const res = await cerrarPeriodo(profileId, anio, mes, n)
      if (!res.ok) setError(res.mensaje)
      else setMostrarFormNum(false)
    })
  }

  if (!factura || factura.estado === "borrador") {
    if (mostrarFormNum) {
      return (
        <div className="flex flex-col gap-3 w-full">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={numero}
              onChange={(e) => { setNumero(e.target.value); setError(null) }}
              placeholder="Ej: 2026-0001"
              autoFocus
              className="h-9 flex-1 px-3 rounded-xl border border-border bg-surface text-sm focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring"
            />
            <button
              type="button"
              onClick={handleCerrar}
              disabled={cerrando}
              className="h-9 px-4 rounded-full bg-primary text-on-primary text-sm font-medium disabled:opacity-60 cursor-pointer hover:bg-primary-hover transition-colors"
            >
              {cerrando ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirmar"}
            </button>
            <button
              type="button"
              onClick={() => { setMostrarFormNum(false); setError(null); setNumero("") }}
              className="h-9 px-3 rounded-full border border-border text-sm text-muted-foreground hover:bg-muted cursor-pointer transition-colors"
            >
              Cancelar
            </button>
          </div>
          {error && (
            <Aviso tono="error">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
              <span>{error}</span>
            </Aviso>
          )}
        </div>
      )
    }

    return (
      <button
        type="button"
        onClick={() => setMostrarFormNum(true)}
        className="h-9 px-4 rounded-full border border-border text-sm hover:bg-muted cursor-pointer transition-colors"
      >
        Cerrar periodo
      </button>
    )
  }

  if (factura.estado === "cerrada") {
    return (
      <>
        <ConfirmarAccion
          etiqueta="Marcar como emitida"
          accion={() => marcarEmitida(factura.id)}
        />
        <ConfirmarAccion
          etiqueta="Anular factura"
          etiquetaConfirmar="Sí, anular"
          destructivo
          accion={() => anularFactura(factura.id)}
        />
      </>
    )
  }

  if (factura.estado === "emitida") {
    return (
      <>
        <ConfirmarAccion etiqueta="Marcar como pagada" accion={() => marcarPagada(factura.id)} />
        <ConfirmarAccion
          etiqueta="Anular factura"
          etiquetaConfirmar="Sí, anular"
          destructivo
          accion={() => anularFactura(factura.id)}
        />
      </>
    )
  }

  return null
}
