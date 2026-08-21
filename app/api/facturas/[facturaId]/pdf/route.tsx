import { renderToBuffer } from "@react-pdf/renderer"
import { FacturaPdf } from "@/lib/pdf/factura-pdf"
import { autorizarFactura } from "@/lib/facturacion/autorizar"
import { obtenerResumenMensual } from "@/lib/facturacion/consumo"

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

  const { factura, perfilCliente } = resultado.datos

  if (
    !perfilCliente.nif ||
    !perfilCliente.legal_name ||
    !perfilCliente.billing_address ||
    !perfilCliente.billing_postal_code ||
    !perfilCliente.billing_city
  ) {
    return new Response("Faltan datos fiscales de la empresa cliente", { status: 400 })
  }

  const resumen = await obtenerResumenMensual(factura.profile_id, factura.anio, factura.mes)
  const bytes = await renderToBuffer(
    <FacturaPdf factura={factura} perfilCliente={perfilCliente} resumen={resumen} incluirAnexo />,
  )

  return new Response(new Uint8Array(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="factura-${factura.numero ?? "borrador"}.pdf"`,
    },
  })
}
