import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer"
import { CATEGORIAS, EMPRESA, MESES, METODOS_PAGO } from "@/lib/constants"
import { formatearPrecio } from "@/lib/utils"
import type { Factura, Perfil } from "@/lib/database.types"
import type { ResumenMensual } from "@/lib/facturacion/consumo"

const s = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: "Helvetica", color: "#1a1a1a" },
  titulo: { fontSize: 18, marginBottom: 4, fontFamily: "Helvetica-Bold" },
  subtitulo: { fontSize: 10, color: "#666", marginBottom: 20 },
  filaDosColumnas: { flexDirection: "row", justifyContent: "space-between", marginBottom: 20 },
  bloque: { width: "47%" },
  bloqueTitulo: { fontSize: 9, color: "#888", marginBottom: 4, textTransform: "uppercase" },
  bloqueTexto: { fontSize: 10, lineHeight: 1.5 },
  metaFila: { flexDirection: "row", justifyContent: "space-between", marginBottom: 3 },
  metaEtiqueta: { color: "#666" },
  tablaCabecera: {
    flexDirection: "row",
    borderBottom: "1pt solid #ccc",
    paddingBottom: 4,
    marginBottom: 4,
    marginTop: 16,
  },
  tablaFila: {
    flexDirection: "row",
    paddingVertical: 3,
    borderBottom: "0.5pt solid #eee",
  },
  colFecha: { width: "16%" },
  colDesc: { width: "44%" },
  colCant: { width: "12%", textAlign: "right" },
  colPrecio: { width: "14%", textAlign: "right" },
  colTotal: { width: "14%", textAlign: "right" },
  th: { fontSize: 8, color: "#888", textTransform: "uppercase" },
  resumen: { marginTop: 20, alignSelf: "flex-end", width: "45%" },
  resumenFila: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  resumenTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
    paddingTop: 6,
    borderTop: "1pt solid #1a1a1a",
    fontFamily: "Helvetica-Bold",
    fontSize: 12,
  },
  condiciones: { marginTop: 30, fontSize: 9, color: "#666", lineHeight: 1.5 },
})

export function FacturaPdf({
  factura,
  perfilCliente,
  resumen,
  incluirAnexo,
}: {
  factura: Factura
  perfilCliente: Perfil
  resumen: ResumenMensual
  incluirAnexo: boolean
}) {
  const periodo = `${MESES[factura.mes - 1]} ${factura.anio}`
  const ivaPorcentaje = ((factura.iva_rate_bps ?? 0) / 100).toFixed(2).replace(/\.00$/, "")
  const dias = [...resumen.porDia.entries()].sort(([a], [b]) => a.localeCompare(b))

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <Text style={s.titulo}>Factura {factura.numero ?? "(borrador)"}</Text>
        <Text style={s.subtitulo}>Periodo facturado: {periodo}</Text>

        <View style={s.filaDosColumnas}>
          <View style={s.bloque}>
            <Text style={s.bloqueTitulo}>Emitida por</Text>
            <Text style={s.bloqueTexto}>{EMPRESA.nombre}</Text>
            <Text style={s.bloqueTexto}>{EMPRESA.direccion}</Text>
            <Text style={s.bloqueTexto}>{EMPRESA.email}</Text>
          </View>
          <View style={s.bloque}>
            <Text style={s.bloqueTitulo}>Facturado a</Text>
            <Text style={s.bloqueTexto}>
              {perfilCliente.legal_name || perfilCliente.company_name}
            </Text>
            <Text style={s.bloqueTexto}>NIF/CIF: {perfilCliente.nif}</Text>
            <Text style={s.bloqueTexto}>{perfilCliente.billing_address}</Text>
            <Text style={s.bloqueTexto}>
              {[perfilCliente.billing_postal_code, perfilCliente.billing_city]
                .filter(Boolean)
                .join(" ")}
            </Text>
          </View>
        </View>

        <View style={s.metaFila}>
          <Text style={s.metaEtiqueta}>Número de factura</Text>
          <Text>{factura.numero ?? "—"}</Text>
        </View>
        <View style={s.metaFila}>
          <Text style={s.metaEtiqueta}>Fecha de emisión</Text>
          <Text>
            {factura.fecha_emision
              ? new Date(factura.fecha_emision).toLocaleDateString("es-ES")
              : "—"}
          </Text>
        </View>
        <View style={s.metaFila}>
          <Text style={s.metaEtiqueta}>Periodo facturado</Text>
          <Text>{periodo}</Text>
        </View>

        {incluirAnexo && dias.length > 0 && (
          <>
            <View style={s.tablaCabecera}>
              <Text style={[s.th, s.colFecha]}>Fecha</Text>
              <Text style={[s.th, s.colDesc]}>Producto</Text>
              <Text style={[s.th, s.colCant]}>Cant.</Text>
              <Text style={[s.th, s.colPrecio]}>Precio</Text>
              <Text style={[s.th, s.colTotal]}>Total</Text>
            </View>
            {dias.map(([fecha, { lineas }]) =>
              lineas.map((l, i) => (
                <View key={`${fecha}-${i}`} style={s.tablaFila}>
                  <Text style={s.colFecha}>{i === 0 ? formatearFecha(fecha) : ""}</Text>
                  <Text style={s.colDesc}>
                    {l.descripcion}
                    {l.categoria ? ` (${CATEGORIAS[l.categoria]})` : ""}
                  </Text>
                  <Text style={s.colCant}>{l.quantity}</Text>
                  <Text style={s.colPrecio}>{formatearPrecio(l.price_cents)}</Text>
                  <Text style={s.colTotal}>{formatearPrecio(l.subtotal_cents)}</Text>
                </View>
              )),
            )}
          </>
        )}

        <View style={s.resumen}>
          <View style={s.resumenFila}>
            <Text>Base imponible</Text>
            <Text>{formatearPrecio(factura.base_cents)}</Text>
          </View>
          <View style={s.resumenFila}>
            <Text>IVA ({ivaPorcentaje}%)</Text>
            <Text>{formatearPrecio(factura.iva_cents)}</Text>
          </View>
          <View style={s.resumenTotal}>
            <Text>Total</Text>
            <Text>{formatearPrecio(factura.total_cents)}</Text>
          </View>
        </View>

        <View style={s.condiciones}>
          <Text>
            Forma de pago: {METODOS_PAGO[perfilCliente.payment_method]}
            {perfilCliente.payment_notes ? ` — ${perfilCliente.payment_notes}` : ""}
          </Text>
        </View>
      </Page>
    </Document>
  )
}

function formatearFecha(fecha: string): string {
  const [, m, d] = fecha.split("-")
  return `${d}/${m}`
}
