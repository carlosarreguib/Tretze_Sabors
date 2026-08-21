import { test } from "node:test"
import assert from "node:assert/strict"
import {
  calcularIvaLinea,
  calcularSubtotalLinea,
  calcularTotalesFactura,
} from "./calculo"

test("calcularSubtotalLinea: cantidad por precio unitario", () => {
  assert.equal(calcularSubtotalLinea(3, 650), 1950)
})

test("calcularIvaLinea: redondeo exacto sin resto", () => {
  assert.equal(calcularIvaLinea(1950, 1000), 195)
})

test("calcularIvaLinea: redondeo medio hacia arriba en importe con decimales impares", () => {
  // 333 * 1000 / 10000 = 33.3 -> redondea a 33
  assert.equal(calcularIvaLinea(333, 1000), 33)
  // 335 * 1000 / 10000 = 33.5 -> redondea a 34 (medio hacia arriba)
  assert.equal(calcularIvaLinea(335, 1000), 34)
})

test("calcularTotalesFactura: la suma de IVA por linea coincide con el IVA total", () => {
  const lineas = [
    { subtotal_cents: 1950 }, // iva 195
    { subtotal_cents: 333 }, // iva 33 (no 33.3)
    { subtotal_cents: 129 }, // iva 13 (12.9 -> 13)
  ]
  const totales = calcularTotalesFactura(lineas, 1000)

  assert.equal(totales.base_cents, 1950 + 333 + 129)
  assert.equal(totales.iva_cents, 195 + 33 + 13)
  assert.equal(totales.total_cents, totales.base_cents + totales.iva_cents)
})

test("calcularIvaLinea: en negativos redondea alejandose de cero, como Postgres round(), no como Math.round()", () => {
  // -25 * 1000 / 10000 = -2.5. Postgres round(-2.5) = -3 (aleja de cero).
  // Math.round(-2.5) daria -2 (hacia +Infinito): NO debe usarse ese resultado.
  assert.equal(calcularIvaLinea(-25, 1000), -3)
  // -333 * 1000 / 10000 = -33.3 -> -33
  assert.equal(calcularIvaLinea(-333, 1000), -33)
  // -335 * 1000 / 10000 = -33.5 -> -34 (alejandose de cero)
  assert.equal(calcularIvaLinea(-335, 1000), -34)
})

test("calcularTotalesFactura: linea de ajuste con precio negativo reduce la base", () => {
  const lineas = [{ subtotal_cents: 1000 }, { subtotal_cents: -300 }]
  const totales = calcularTotalesFactura(lineas, 1000)

  assert.equal(totales.base_cents, 700)
  assert.equal(totales.iva_cents, calcularIvaLinea(1000, 1000) + calcularIvaLinea(-300, 1000))
})

test("calcularTotalesFactura: mes sin lineas da todo a cero, sin division por cero", () => {
  const totales = calcularTotalesFactura([], 1000)
  assert.deepEqual(totales, { base_cents: 0, iva_cents: 0, total_cents: 0 })
})
