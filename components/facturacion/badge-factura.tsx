import { cn } from "@/lib/utils"
import { ESTADOS_FACTURA } from "@/lib/constants"
import type { EstadoFactura } from "@/lib/database.types"

export function FacturaBadge({ estado }: { estado: EstadoFactura }) {
  const { etiqueta, clase } = ESTADOS_FACTURA[estado]
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium",
        clase,
      )}
    >
      {etiqueta}
    </span>
  )
}
