"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { erroresDeZod } from "@/lib/validation"
import { exigirAdmin } from "@/lib/supabase/server"
import type { EstadoFormulario } from "@/lib/actions/auth"

const preciosEmpresaSchema = z.object({
  profile_id: z.string().uuid("Empresa no válida"),
  precio_menu_euros: z
    .number()
    .min(0, "El precio no puede ser negativo")
    .max(1000, "Precio fuera de rango"),
  precio_medio_menu_euros: z
    .number()
    .min(0, "El precio no puede ser negativo")
    .max(1000, "Precio fuera de rango"),
  notas: z.string().max(500, "Nota demasiado larga").optional(),
})

export async function guardarPreciosEmpresa(
  _previo: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  await exigirAdmin()

  const validado = preciosEmpresaSchema.safeParse({
    profile_id: String(formData.get("profile_id") ?? ""),
    precio_menu_euros: Number(formData.get("precio_menu_euros") ?? 0),
    precio_medio_menu_euros: Number(formData.get("precio_medio_menu_euros") ?? 0),
    notas: String(formData.get("notas") ?? "").trim() || undefined,
  })

  if (!validado.success) {
    return { errores: erroresDeZod(validado.error) }
  }

  const { profile_id, precio_menu_euros, precio_medio_menu_euros, notas } = validado.data

  const supabase = await createClient()
  const { error } = await supabase
    .from("company_prices")
    .upsert(
      {
        profile_id,
        precio_menu_cents: Math.round(precio_menu_euros * 100),
        precio_medio_menu_cents: Math.round(precio_medio_menu_euros * 100),
        notas: notas || null,
      },
      { onConflict: "profile_id" },
    )

  if (error) {
    return { mensaje: "No hemos podido guardar los precios. Inténtalo de nuevo." }
  }

  revalidatePath(`/admin/empresas/${profile_id}`)

  return { ok: true, mensaje: "Precios actualizados correctamente." }
}
