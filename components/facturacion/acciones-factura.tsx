import { ConfirmarAccion } from "@/components/ui/confirmar-accion"
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
  if (!factura || factura.estado === "borrador") {
    return (
      <ConfirmarAccion
        etiqueta="Cerrar periodo"
        etiquetaConfirmar="Sí, cerrar periodo"
        accion={() => cerrarPeriodo(profileId, anio, mes)}
      />
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
