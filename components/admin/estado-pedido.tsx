"use client"

import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { Loader2 } from "lucide-react"
import { cambiarEstadoPedido } from "@/lib/actions/admin"
import { ESTADOS_PEDIDO } from "@/lib/constants"
import type { EstadoPedido } from "@/lib/database.types"

const ORDEN: EstadoPedido[] = [
  "pendiente",
  "confirmado",
  "entregado",
  "cancelado",
]

export function SelectorEstado({
  pedidoId,
  estado,
}: {
  pedidoId: string
  estado: EstadoPedido
}) {
  const router = useRouter()
  const [pendiente, iniciar] = useTransition()
  const [error, setError] = useState<string | null>(null)

  return (
    <div className="flex items-center gap-2">
      {pendiente && (
        <Loader2
          className="w-3.5 h-3.5 animate-spin text-muted-foreground"
          aria-hidden="true"
        />
      )}

      <label className="solo-lectores" htmlFor={`estado-${pedidoId}`}>
        Estado del pedido
      </label>

      <select
        id={`estado-${pedidoId}`}
        value={estado}
        disabled={pendiente}
        onChange={(e) => {
          const nuevo = e.target.value as EstadoPedido
          setError(null)
          iniciar(async () => {
            const resultado = await cambiarEstadoPedido(pedidoId, nuevo)
            if (resultado.ok) router.refresh()
            else setError(resultado.mensaje)
          })
        }}
        className={
          "h-9 pl-3 pr-8 rounded-full text-xs font-medium cursor-pointer border-0 disabled:opacity-60 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring " +
          ESTADOS_PEDIDO[estado].clase
        }
      >
        {ORDEN.map((e) => (
          <option key={e} value={e}>
            {ESTADOS_PEDIDO[e].etiqueta}
          </option>
        ))}
      </select>

      {error && (
        <span role="alert" className="text-xs text-destructive">
          {error}
        </span>
      )}
    </div>
  )
}
