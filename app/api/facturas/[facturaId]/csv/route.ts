import { autorizarFactura } from "@/lib/facturacion/autorizar"
import { obtenerResumenMensual } from "@/lib/facturacion/consumo"
import { csvConBom, facturaACsv } from "@/lib/facturacion/csv"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ facturaId: string }> },
) {
  const { facturaId } = await params
  const resultado = await autorizarFactura(facturaId)

  if (!resultado.ok) {
    const mensaje = resultado.status === 401 ? "No autorizado" : "No encontrada"
    return new Response(mensaje, { status: resultado.status })
  }

  // A diferencia del PDF, el CSV no es un documento fiscal (es un detalle de
  // consumo para uso interno/contable), asi que no se bloquea por falta de
  // NIF: un admin debe poder exportar el detalle aunque la empresa todavia
  // no haya completado sus datos fiscales.
  const { factura, perfilCliente } = resultado.datos
  const resumen = await obtenerResumenMensual(factura.profile_id, factura.anio, factura.mes)
  const empresa = perfilCliente.legal_name || perfilCliente.company_name
  const csv = csvConBom(facturaACsv(resumen, empresa, factura.iva_rate_bps))

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="factura-${factura.numero ?? "borrador"}.csv"`,
    },
  })
}
