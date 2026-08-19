"use client"

import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { Loader2 } from "lucide-react"
import { cancelarPedido } from "@/lib/actions/pedidos"

/**
 * Cancelar con confirmación en dos pasos.
 *
 * Cancelar un pedido no se puede deshacer desde la interfaz, así que el
 * primer clic solo pide confirmación; nunca cancela a la primera.
 */
export function CancelarPedido({ pedidoId }: { pedidoId: string }) {
  const router = useRouter()
  const [confirmando, setConfirmando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pendiente, iniciar] = useTransition()

  function cancelar() {
    setError(null)
    iniciar(async () => {
      const resultado = await cancelarPedido(pedidoId)
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
        className="inline-flex items-center h-9 px-3 rounded-full text-sm text-destructive hover:bg-destructive-soft transition-colors duration-200 cursor-pointer"
      >
        Cancelar pedido
      </button>
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-2 justify-end">
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
        onClick={cancelar}
        disabled={pendiente}
        className="inline-flex items-center gap-1.5 h-9 px-3 rounded-full text-sm bg-destructive-soft text-destructive border border-destructive/30 hover:bg-destructive/10 disabled:opacity-50 transition-colors duration-200 cursor-pointer"
      >
        {pendiente && (
          <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
        )}
        Sí, cancelar
      </button>
    </div>
  )
}
