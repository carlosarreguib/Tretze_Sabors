"use server"

import { revalidatePath } from "next/cache"
import { createClient, getUsuario } from "@/lib/supabase/server"
import { erroresDeZod, perfilSchema } from "@/lib/validation"
import type { EstadoFormulario } from "@/lib/actions/auth"

export async function guardarPerfil(
  _previo: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  const usuario = await getUsuario()
  if (!usuario) {
    return { mensaje: "Tu sesión ha caducado. Vuelve a acceder." }
  }

  const validado = perfilSchema.safeParse({
    company_name: String(formData.get("company_name") ?? "").trim(),
    contact_name: String(formData.get("contact_name") ?? "").trim(),
    phone: String(formData.get("phone") ?? "").trim(),
    delivery_address: String(formData.get("delivery_address") ?? "").trim(),
    payment_method: String(formData.get("payment_method") ?? "transferencia"),
    payment_notes: String(formData.get("payment_notes") ?? "").trim(),
  })

  if (!validado.success) {
    return { errores: erroresDeZod(validado.error) }
  }

  const supabase = await createClient()

  // `role` no se incluye a propósito: además, los permisos por columna de
  // la base de datos impiden que un cliente lo modifique.
  const { error } = await supabase
    .from("profiles")
    .update({
      company_name: validado.data.company_name,
      contact_name: validado.data.contact_name,
      phone: validado.data.phone,
      delivery_address: validado.data.delivery_address,
      payment_method: validado.data.payment_method,
      payment_notes: validado.data.payment_notes || null,
    })
    .eq("id", usuario.id)

  if (error) {
    return { mensaje: "No hemos podido guardar los cambios. Inténtalo de nuevo." }
  }

  revalidatePath("/panel", "layout")

  return { ok: true, mensaje: "Datos actualizados correctamente." }
}
