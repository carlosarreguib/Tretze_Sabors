"use client"

import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

type ResultadoAccion = { ok: boolean; mensaje: string }

/**
 * Boton con confirmacion en dos pasos, para acciones dificiles de deshacer
 * (cancelar pedido, cerrar periodo, anular factura). El primer clic solo
 * pide confirmacion; nunca ejecuta la accion a la primera.
 */
export function ConfirmarAccion({
  etiqueta,
  etiquetaConfirmar = "Sí, continuar",
  accion,
  destructivo = false,
}: {
  etiqueta: string
  etiquetaConfirmar?: string
  accion: () => Promise<ResultadoAccion>
  destructivo?: boolean
}) {
  const router = useRouter()
  const [confirmando, setConfirmando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pendiente, iniciar] = useTransition()

  function ejecutar() {
    setError(null)
    iniciar(async () => {
      const resultado = await accion()
      if (resultado.ok) {
        setConfirmando(false)
        router.refresh()
      } else {
        setError(resultado.mensaje)
      }
    })
  }

  if (!confirmando) {
    return (
      <button
        type="button"
        onClick={() => setConfirmando(true)}
        className={cn(
          "inline-flex items-center h-9 px-3 rounded-full text-sm transition-colors duration-200 cursor-pointer",
          destructivo
            ? "text-destructive hover:bg-destructive-soft"
            : "border border-border hover:bg-muted",
        )}
      >
        {etiqueta}
      </button>
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {error ? (
        <span role="alert" className="text-xs text-destructive">
          {error}
        </span>
      ) : (
        <span className="text-sm text-muted-foreground">¿Seguro?</span>
      )}

      <button
        type="button"
        onClick={() => {
          setConfirmando(false)
          setError(null)
        }}
        className="inline-flex items-center h-9 px-3 rounded-full text-sm border border-border hover:bg-muted transition-colors duration-200 cursor-pointer"
      >
        No
      </button>

      <button
        type="button"
        onClick={ejecutar}
        disabled={pendiente}
        className={cn(
          "inline-flex items-center gap-1.5 h-9 px-3 rounded-full text-sm border disabled:opacity-50 transition-colors duration-200 cursor-pointer",
          destructivo
            ? "bg-destructive-soft text-destructive border-destructive/30 hover:bg-destructive/10"
            : "bg-primary text-on-primary border-transparent hover:bg-primary-hover",
        )}
      >
        {pendiente && <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />}
        {etiquetaConfirmar}
      </button>
    </div>
  )
}
