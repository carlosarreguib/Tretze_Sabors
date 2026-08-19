/**
 * Utilidades compartidas.
 *
 * Las fechas se manejan siempre como cadenas 'YYYY-MM-DD' (mismo formato que
 * `date` en Postgres) para evitar que el huso horario del navegador desplace
 * un dia al convertir a Date y volver.
 */

/** Une clases condicionales sin dependencias externas. */
export function cn(...clases: (string | false | null | undefined)[]) {
  return clases.filter(Boolean).join(" ")
}

/** 650 -> "6,50 €" */
export function formatearPrecio(cents: number) {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100)
}

/** '2026-08-19' -> '19 de agosto de 2026' */
export function formatearFecha(fecha: string) {
  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(parsearFecha(fecha))
}

/** '2026-08-19' -> 'miércoles, 19 de agosto' */
export function formatearFechaLarga(fecha: string) {
  return new Intl.DateTimeFormat("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(parsearFecha(fecha))
}

/** '2026-08-19' -> '19 ago' */
export function formatearFechaCorta(fecha: string) {
  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "short",
  }).format(parsearFecha(fecha))
}

/** '12:00:00' -> '12:00' */
export function formatearHora(hora: string) {
  return hora.slice(0, 5)
}

/**
 * Convierte 'YYYY-MM-DD' en un Date a mediodia local.
 * A mediodia y no a medianoche: asi ningun cambio de horario de verano
 * puede empujar la fecha al dia anterior.
 */
export function parsearFecha(fecha: string): Date {
  const [a, m, d] = fecha.split("-").map(Number)
  return new Date(a, m - 1, d, 12, 0, 0)
}

/** Date -> 'YYYY-MM-DD' en hora local (no usa toISOString, que pasa a UTC). */
export function aFechaISO(fecha: Date): string {
  const a = fecha.getFullYear()
  const m = String(fecha.getMonth() + 1).padStart(2, "0")
  const d = String(fecha.getDate()).padStart(2, "0")
  return `${a}-${m}-${d}`
}

/** Lunes de la semana a la que pertenece la fecha dada. */
export function lunesDeLaSemana(fecha: Date = new Date()): Date {
  const d = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate())
  const dia = d.getDay() // 0=domingo
  const desplazamiento = dia === 0 ? -6 : 1 - dia
  d.setDate(d.getDate() + desplazamiento)
  return d
}

/** Las seis fechas laborables (lunes a sabado) de la semana de `lunes`. */
export function diasDeLaSemana(lunes: Date): string[] {
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(lunes)
    d.setDate(lunes.getDate() + i)
    return aFechaISO(d)
  })
}

/**
 * Ano y semana ISO 8601.
 *
 * Debe coincidir con `extract(isoyear/week from ...)` de Postgres, porque el
 * trigger menu_items_valida_semana rechaza la fila si no cuadra. El ano ISO no
 * siempre es el del calendario: el 31/12/2026 cae en la semana 1 de 2027.
 */
export function semanaISO(fecha: Date): { anio: number; semana: number } {
  const d = new Date(
    Date.UTC(fecha.getFullYear(), fecha.getMonth(), fecha.getDate()),
  )
  // Se desplaza al jueves de esa semana: el jueves siempre cae en el ano ISO correcto
  const dia = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dia)
  const anio = d.getUTCFullYear()
  const inicioAnio = new Date(Date.UTC(anio, 0, 1))
  const semana = Math.ceil(((d.getTime() - inicioAnio.getTime()) / 86400000 + 1) / 7)
  return { anio, semana }
}

/** Suma (o resta) semanas a una fecha. */
export function sumarSemanas(fecha: Date, semanas: number): Date {
  const d = new Date(fecha)
  d.setDate(d.getDate() + semanas * 7)
  return d
}

/** Rango legible de una semana: '17 – 22 de agosto'. */
export function rangoSemana(lunes: Date): string {
  const sabado = new Date(lunes)
  sabado.setDate(lunes.getDate() + 5)

  const mismoMes = lunes.getMonth() === sabado.getMonth()
  const fmtDia = new Intl.DateTimeFormat("es-ES", { day: "numeric" })
  const fmtDiaMes = new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "long",
  })

  return mismoMes
    ? `${fmtDia.format(lunes)} – ${fmtDiaMes.format(sabado)}`
    : `${fmtDiaMes.format(lunes)} – ${fmtDiaMes.format(sabado)}`
}

/** Nombre del dia de la semana, capitalizado: 'Lunes'. */
export function nombreDia(fecha: string): string {
  const nombre = new Intl.DateTimeFormat("es-ES", { weekday: "long" }).format(
    parsearFecha(fecha),
  )
  return nombre.charAt(0).toUpperCase() + nombre.slice(1)
}

/** True si la fecha ya pasó (comparando solo el dia, no la hora). */
export function esPasado(fecha: string): boolean {
  return fecha < aFechaISO(new Date())
}
