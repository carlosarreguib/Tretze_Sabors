"use client"

import { ConfirmarAccion } from "@/components/ui/confirmar-accion"
import { cancelarPedido } from "@/lib/actions/pedidos"

/**
 * Cancelar con confirmación en dos pasos.
 *
 * Cancelar un pedido no se puede deshacer desde la interfaz, así que el
 * primer clic solo pide confirmación; nunca cancela a la primera.
 */
export function CancelarPedido({ pedidoId }: { pedidoId: string }) {
  return (
    <div className="flex justify-end">
      <ConfirmarAccion
        etiqueta="Cancelar pedido"
        etiquetaConfirmar="Sí, cancelar"
        destructivo
        accion={() => cancelarPedido(pedidoId)}
      />
    </div>
  )
}
