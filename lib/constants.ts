import type {
  Categoria,
  EstadoFactura,
  EstadoPedido,
  MetodoPago,
} from "@/lib/database.types"

/** Datos de contacto del negocio. Fuente unica: se usan en hero, footer y soporte. */
export const EMPRESA = {
  nombre: "Tretze Sabors",
  telefono: "+34 667 518 857",
  telefonoLink: "+34667518857",
  telefonoWhatsapp: "34667518857",
  email: "catering@tretzesabors.com",
  direccion: "C/ Schumann 36, 08191 Rubí, Barcelona, España",
  direccionCorta: "C/ Schumann 36, 08191 Rubí, Barcelona",
  horario: "Lunes a sábado, de 12:00 a 16:00",
  eslogan: "La comida que hacía la abuela, servida fresca en tu oficina cada día",
} as const

/** Franjas de entrega. El rango y los tramos de 30 min se validan tambien en la BD. */
export const FRANJAS = [
  "12:00",
  "12:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
] as const

export type Franja = (typeof FRANJAS)[number]

export const DIAS_SEMANA = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
] as const

export const CATEGORIAS: Record<Categoria, string> = {
  primer: "Primeros",
  segundo: "Segundos",
  postre: "Postres",
  bebida: "Bebidas",
}

/** Orden de presentacion del menu: como en una carta de toda la vida. */
export const ORDEN_CATEGORIAS: Categoria[] = [
  "primer",
  "segundo",
  "postre",
  "bebida",
]

export const ESTADOS_PEDIDO: Record<
  EstadoPedido,
  { etiqueta: string; clase: string }
> = {
  pendiente: {
    etiqueta: "Pendiente",
    clase: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
  },
  confirmado: {
    etiqueta: "Confirmado",
    clase: "bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-200",
  },
  entregado: {
    etiqueta: "Entregado",
    clase: "bg-green-100 text-green-900 dark:bg-green-950 dark:text-green-200",
  },
  cancelado: {
    etiqueta: "Cancelado",
    clase: "bg-stone-200 text-stone-700 dark:bg-stone-800 dark:text-stone-300",
  },
}

export const METODOS_PAGO: Record<MetodoPago, string> = {
  transferencia: "Transferencia bancaria",
  efectivo: "Efectivo en la entrega",
  domiciliacion: "Domiciliación bancaria",
}

/**
 * Estado de facturacion, de cara al cliente. "borrador" se etiqueta como
 * "Pendiente": es el mismo estado inicial, solo cambia el texto mostrado.
 */
export const ESTADOS_FACTURA: Record<
  EstadoFactura,
  { etiqueta: string; clase: string }
> = {
  borrador: {
    etiqueta: "Pendiente",
    clase: "bg-stone-200 text-stone-700 dark:bg-stone-800 dark:text-stone-300",
  },
  cerrada: {
    etiqueta: "Cerrada",
    clase: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
  },
  emitida: {
    etiqueta: "Emitida",
    clase: "bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-200",
  },
  pagada: {
    etiqueta: "Pagada",
    clase: "bg-green-100 text-green-900 dark:bg-green-950 dark:text-green-200",
  },
  anulada: {
    etiqueta: "Anulada",
    clase: "bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-200",
  },
}

export const MESES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
] as const

/** Alergenos habituales, para el formulario de platos del panel de administracion. */
export const ALERGENOS = [
  "gluten",
  "crustáceos",
  "huevo",
  "pescado",
  "cacahuetes",
  "soja",
  "lácteos",
  "frutos secos",
  "apio",
  "mostaza",
  "sésamo",
  "sulfitos",
  "altramuces",
  "moluscos",
] as const
