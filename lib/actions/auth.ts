"use server"

import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { headers } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import {
  erroresDeZod,
  loginSchema,
  nuevaPasswordSchema,
  recuperarSchema,
  registroSchema,
} from "@/lib/validation"

export type EstadoFormulario = {
  ok?: boolean
  mensaje?: string
  errores?: Record<string, string>
}

/** Traduce los errores de Supabase Auth, que llegan en inglés. */
function traducirError(mensaje: string): string {
  const m = mensaje.toLowerCase()
  if (m.includes("invalid login credentials"))
    return "El correo o la contraseña no son correctos"
  if (m.includes("email not confirmed"))
    return "Todavía no has confirmado tu correo. Revisa tu bandeja de entrada."
  if (m.includes("user already registered") || m.includes("already been registered"))
    return "Ya existe una cuenta con ese correo electrónico"
  if (m.includes("password should be at least"))
    return "La contraseña es demasiado corta"
  if (m.includes("email rate limit") || m.includes("too many requests"))
    return "Demasiados intentos. Espera unos minutos antes de volver a probar."
  if (m.includes("weak password"))
    return "Esa contraseña es demasiado débil. Prueba con una más larga."
  return "No hemos podido completar la operación. Inténtalo de nuevo."
}

/** URL base del sitio, para los enlaces de confirmación por correo. */
async function urlBase() {
  const configurada = process.env.NEXT_PUBLIC_SITE_URL
  if (configurada) return configurada.replace(/\/$/, "")
  const h = await headers()
  const host = h.get("host") ?? "localhost:3000"
  const protocolo = host.startsWith("localhost") ? "http" : "https"
  return `${protocolo}://${host}`
}

export async function iniciarSesion(
  _previo: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  const datos = {
    email: String(formData.get("email") ?? "").trim(),
    password: String(formData.get("password") ?? ""),
    remember: formData.get("remember") === "on",
  }

  const validado = loginSchema.safeParse(datos)
  if (!validado.success) {
    return { errores: erroresDeZod(validado.error) }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({
    email: validado.data.email,
    password: validado.data.password,
  })

  if (error) {
    return { mensaje: traducirError(error.message) }
  }

  const destino = String(formData.get("redirect") ?? "/panel")
  // Solo rutas internas: un `redirect` con URL absoluta permitiría enviar al
  // usuario recién autenticado a un dominio ajeno.
  const seguro = destino.startsWith("/") && !destino.startsWith("//")

  revalidatePath("/", "layout")
  redirect(seguro ? destino : "/panel")
}

export async function registrarse(
  _previo: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  const datos = {
    email: String(formData.get("email") ?? "").trim(),
    password: String(formData.get("password") ?? ""),
    passwordConfirm: String(formData.get("passwordConfirm") ?? ""),
    company_name: String(formData.get("company_name") ?? "").trim(),
    contact_name: String(formData.get("contact_name") ?? "").trim(),
    phone: String(formData.get("phone") ?? "").trim(),
  }

  const validado = registroSchema.safeParse(datos)
  if (!validado.success) {
    return { errores: erroresDeZod(validado.error) }
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({
    email: validado.data.email,
    password: validado.data.password,
    options: {
      emailRedirectTo: `${await urlBase()}/auth/callback`,
      // El trigger handle_new_user copia estos datos al perfil.
      // `role` nunca viaja aquí: se fija a 'client' en la base de datos.
      data: {
        company_name: validado.data.company_name,
        contact_name: validado.data.contact_name,
        phone: validado.data.phone,
      },
    },
  })

  if (error) {
    return { mensaje: traducirError(error.message) }
  }

  // Con confirmación por correo activada no hay sesión todavía.
  if (data.session) {
    revalidatePath("/", "layout")
    redirect("/panel")
  }

  return {
    ok: true,
    mensaje:
      "Cuenta creada. Te hemos enviado un correo para confirmar tu dirección.",
  }
}

export async function cerrarSesion() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath("/", "layout")
  redirect("/")
}

export async function solicitarRecuperacion(
  _previo: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  const validado = recuperarSchema.safeParse({
    email: String(formData.get("email") ?? "").trim(),
  })

  if (!validado.success) {
    return { errores: erroresDeZod(validado.error) }
  }

  const supabase = await createClient()
  await supabase.auth.resetPasswordForEmail(validado.data.email, {
    redirectTo: `${await urlBase()}/auth/callback?next=/panel/cuenta`,
  })

  // Respuesta idéntica exista o no la cuenta: si no, esta pantalla se convierte
  // en un comprobador de qué correos están registrados.
  return {
    ok: true,
    mensaje:
      "Si ese correo está registrado, recibirás un enlace para restablecer tu contraseña.",
  }
}

export async function cambiarPassword(
  _previo: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  const validado = nuevaPasswordSchema.safeParse({
    password: String(formData.get("password") ?? ""),
    passwordConfirm: String(formData.get("passwordConfirm") ?? ""),
  })

  if (!validado.success) {
    return { errores: erroresDeZod(validado.error) }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({
    password: validado.data.password,
  })

  if (error) {
    return { mensaje: traducirError(error.message) }
  }

  return { ok: true, mensaje: "Contraseña actualizada correctamente." }
}
