import { z } from "zod"
import { FRANJAS } from "@/lib/constants"

/**
 * Esquemas compartidos entre cliente y servidor.
 *
 * La validación del cliente es solo comodidad: la del servidor (Server Actions)
 * es la que cuenta, y por debajo la base de datos vuelve a comprobar las
 * mismas reglas con CHECK y triggers.
 */

const email = z
  .string()
  .min(1, "Introduce tu correo electrónico")
  .email("Ese correo no parece válido")

const password = z
  .string()
  .min(8, "La contraseña debe tener al menos 8 caracteres")
  .max(72, "La contraseña no puede superar los 72 caracteres")

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Introduce tu contraseña"),
  remember: z.boolean().optional(),
})

export const registroSchema = z
  .object({
    email,
    password,
    passwordConfirm: z.string().min(1, "Repite la contraseña"),
    company_name: z
      .string()
      .min(2, "Indica el nombre de la empresa")
      .max(120, "Nombre demasiado largo"),
    contact_name: z
      .string()
      .min(2, "Indica la persona de contacto")
      .max(120, "Nombre demasiado largo"),
    phone: z
      .string()
      .min(6, "Indica un teléfono de contacto")
      .max(30, "Teléfono demasiado largo"),
  })
  .refine((d) => d.password === d.passwordConfirm, {
    message: "Las contraseñas no coinciden",
    path: ["passwordConfirm"],
  })

export const recuperarSchema = z.object({ email })

export const nuevaPasswordSchema = z
  .object({
    password,
    passwordConfirm: z.string().min(1, "Repite la contraseña"),
  })
  .refine((d) => d.password === d.passwordConfirm, {
    message: "Las contraseñas no coinciden",
    path: ["passwordConfirm"],
  })

export const perfilSchema = z.object({
  company_name: z.string().min(2, "Indica el nombre de la empresa").max(120),
  contact_name: z.string().min(2, "Indica la persona de contacto").max(120),
  phone: z
    .string()
    .min(6, "Indica un teléfono de contacto")
    .max(30, "Teléfono demasiado largo"),
  delivery_address: z
    .string()
    .min(5, "Indica la dirección de entrega")
    .max(300, "Dirección demasiado larga"),
  payment_method: z.enum(["transferencia", "efectivo", "domiciliacion"]),
  payment_notes: z.string().max(500, "Nota demasiado larga").optional(),
})

const fechaISO = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha no válida")

export const pedidoDiaSchema = z.object({
  delivery_date: fechaISO,
  slot_start: z.enum(FRANJAS),
  notes: z.string().max(500, "Las notas no pueden superar 500 caracteres").optional(),
  items: z
    .array(
      z.object({
        plato_id: z.string().uuid("Plato no válido"),
        quantity: z
          .number()
          .int("La cantidad debe ser un número entero")
          .min(1, "La cantidad mínima es 1")
          .max(500, "La cantidad máxima es 500"),
      }),
    )
    .min(1, "Añade al menos un plato"),
})

export const platoSchema = z.object({
  nombre: z.string().min(2, "Indica el nombre del plato").max(120),
  descripcion: z.string().max(600, "Descripción demasiado larga").optional(),
  categoria: z.enum(["primer", "segundo", "postre", "bebida"]),
  precio_euros: z
    .number()
    .min(0, "El precio no puede ser negativo")
    .max(10000, "Precio fuera de rango"),
  alergenos: z.array(z.string()).default([]),
  is_active: z.boolean().default(true),
})

/** Convierte los errores de Zod en un mapa campo -> mensaje. */
export function erroresDeZod(error: z.ZodError): Record<string, string> {
  const salida: Record<string, string> = {}
  for (const issue of error.issues) {
    const campo = String(issue.path[0] ?? "_")
    if (!salida[campo]) salida[campo] = issue.message
  }
  return salida
}
