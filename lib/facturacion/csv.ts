import { CATEGORIAS } from "@/lib/constants"
import { calcularIvaLinea } from "@/lib/facturacion/calculo"
import type { ResumenMensual } from "@/lib/facturacion/consumo"

/**
 * CSV de detalle de facturacion, generado desde el mismo ResumenMensual que
 * alimenta la pantalla y el PDF. Delimitador ";" y decimales con coma:
 * Excel en español los abre bien sin configuracion adicional.
 *
 * `iva_rate_bps` es el tipo de IVA congelado en la factura (null si el
 * periodo aun no se ha cerrado, en cuyo caso la columna de impuestos sale a
 * 0,00 porque todavia no hay un tipo fijado).
 */
export function facturaACsv(
  resumen: ResumenMensual,
  empresa: string,
  iva_rate_bps: number | null,
): string {
  const cabecera = [
    "Fecha",
    "Empresa",
    "Categoría",
    "Producto",
    "Cantidad",
    "Precio unitario",
    "Descuento",
    "Impuestos",
    "Total",
  ]

  const filas = resumen.lineas.map((l) => {
    const esDescuento = l.tipo === "ajuste" && l.price_cents < 0
    const iva_cents = iva_rate_bps ? calcularIvaLinea(l.subtotal_cents, iva_rate_bps) : 0

    return [
      l.fecha,
      empresa,
      l.tipo === "ajuste" ? "Ajuste" : (l.categoria ? CATEGORIAS[l.categoria] : ""),
      l.descripcion,
      String(l.quantity),
      formatearEuros(l.price_cents),
      esDescuento ? formatearEuros(l.subtotal_cents) : "0,00",
      formatearEuros(iva_cents),
      formatearEuros(l.subtotal_cents),
    ]
  })

  return [cabecera, ...filas]
    .map((fila) => fila.map(escaparCsv).join(";"))
    .join("\r\n")
}

function formatearEuros(cents: number): string {
  return (cents / 100).toFixed(2).replace(".", ",")
}

function escaparCsv(valor: string): string {
  return /[";\r\n]/.test(valor) ? `"${valor.replace(/"/g, '""')}"` : valor
}

/** BOM UTF-8 al principio del CSV, para que Excel-ES muestre bien los acentos. */
export function csvConBom(csv: string): string {
  return "﻿" + csv
}
