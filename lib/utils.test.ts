import { test } from "node:test"
import assert from "node:assert/strict"
import { anioMes, limitesDelMes, primerDiaDelMes, sumarMeses } from "./utils"

test("sumarMeses: cruza el fin de año correctamente", () => {
  const diciembre2026 = new Date(2026, 11, 15)
  const enero2027 = sumarMeses(diciembre2026, 1)

  assert.equal(enero2027.getFullYear(), 2027)
  assert.equal(enero2027.getMonth(), 0)
})

test("sumarMeses: anclado al dia 1, no desborda de mes corto a mes largo", () => {
  const enero31 = new Date(2026, 0, 31)
  const resultado = sumarMeses(enero31, 1)

  // Sin anclar al dia 1, 31 ene + 1 mes desbordaria a marzo (Date normaliza
  // el dia 31 de febrero). Anclado al dia 1, debe quedarse en febrero.
  assert.equal(resultado.getMonth(), 1)
  assert.equal(resultado.getDate(), 1)
})

test("limitesDelMes: mes de 31 dias", () => {
  const { desde, hasta } = limitesDelMes(new Date(2026, 7, 15)) // agosto
  assert.equal(desde, "2026-08-01")
  assert.equal(hasta, "2026-08-31")
})

test("limitesDelMes: mes de 30 dias", () => {
  const { desde, hasta } = limitesDelMes(new Date(2026, 3, 15)) // abril
  assert.equal(desde, "2026-04-01")
  assert.equal(hasta, "2026-04-30")
})

test("limitesDelMes: febrero no bisiesto", () => {
  const { hasta } = limitesDelMes(new Date(2026, 1, 10))
  assert.equal(hasta, "2026-02-28")
})

test("limitesDelMes: febrero bisiesto", () => {
  const { hasta } = limitesDelMes(new Date(2028, 1, 10))
  assert.equal(hasta, "2028-02-29")
})

test("anioMes: coherente con getFullYear/getMonth+1", () => {
  const { anio, mes } = anioMes(new Date(2026, 7, 1))
  assert.equal(anio, 2026)
  assert.equal(mes, 8)
})

test("primerDiaDelMes: siempre dia 1", () => {
  const d = primerDiaDelMes(new Date(2026, 7, 21))
  assert.equal(d.getDate(), 1)
  assert.equal(d.getMonth(), 7)
})
