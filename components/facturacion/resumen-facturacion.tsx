import { Card } from "@/components/ui/misc"
import { FacturaBadge } from "@/components/facturacion/badge-factura"
import { formatearPrecio } from "@/lib/utils"
import type { Factura } from "@/lib/database.types"
import type { ResumenMensual } from "@/lib/facturacion/consumo"

/** Tarjetas de resumen superior: total del mes, pedidos, dias de servicio, estado. */
export function ResumenFacturacion({
  resumen,
  factura,
}: {
  resumen: ResumenMensual
  factura: Factura | null
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
      <Card className="p-4">
        <p className="text-xs text-muted-foreground">Total del mes</p>
        <p className="mt-1 font-display text-2xl tabular-nums">
          {formatearPrecio(resumen.total_cents)}
        </p>
      </Card>

      <Card className="p-4">
        <p className="text-xs text-muted-foreground">Pedidos</p>
        <p className="mt-1 font-display text-2xl tabular-nums">{resumen.totalPedidos}</p>
      </Card>

      <Card className="p-4">
        <p className="text-xs text-muted-foreground">Días de servicio</p>
        <p className="mt-1 font-display text-2xl tabular-nums">{resumen.diasDeServicio}</p>
      </Card>

      <Card className="p-4">
        <p className="text-xs text-muted-foreground">Estado</p>
        <div className="mt-2">
          <FacturaBadge estado={factura?.estado ?? "borrador"} />
        </div>
      </Card>
    </div>
  )
}
