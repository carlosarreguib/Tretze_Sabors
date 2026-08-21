/**
 * Calculos monetarios puros de facturacion, en centimos (integer), nunca floats.
 *
 * Deben replicar EXACTAMENTE la logica SQL de `tg_recalcular_factura`
 * (supabase/migrations/0005_facturacion.sql): redondeo por linea, medio hacia
 * arriba, y el IVA de la factura es la SUMA de los IVA por linea, nunca
 * round(base_total * tipo). Si se toca una de las dos implementaciones, hay
 * que tocar la otra.
 */

export type LineaCalculo = {
  quantity: number
  price_cents: number
}

/** cantidad x precio unitario, en centimos. */
export function calcularSubtotalLinea(quantity: number, price_cents: number): number {
  return quantity * price_cents
}

/**
 * IVA de una linea: round(base * tipo), en centimos.
 *
 * No se usa Math.round: en negativos redondea hacia +Infinito (Math.round(-2.5)
 * = -2), mientras que el round() de Postgres redondea alejandose de cero
 * (round(-2.5) = -3). Los ajustes (tipo='ajuste') admiten price_cents negativo,
 * asi que hay que replicar el comportamiento de Postgres exactamente.
 */
export function calcularIvaLinea(subtotal_cents: number, iva_rate_bps: number): number {
  const valor = subtotal_cents * iva_rate_bps / 10000
  return valor < 0 ? -Math.round(-valor) : Math.round(valor)
}

export type TotalesFactura = {
  base_cents: number
  iva_cents: number
  total_cents: number
}

/**
 * Totales de una factura a partir de sus lineas (consumo + ajuste).
 * base_cents es la suma directa de subtotales; iva_cents es la suma del
 * IVA calculado linea a linea, no el IVA del total agregado.
 */
export function calcularTotalesFactura(
  lineas: { subtotal_cents: number }[],
  iva_rate_bps: number,
): TotalesFactura {
  const base_cents = lineas.reduce((suma, l) => suma + l.subtotal_cents, 0)
  const iva_cents = lineas.reduce(
    (suma, l) => suma + calcularIvaLinea(l.subtotal_cents, iva_rate_bps),
    0,
  )
  return { base_cents, iva_cents, total_cents: base_cents + iva_cents }
}
