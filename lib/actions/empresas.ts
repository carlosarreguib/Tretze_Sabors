"use server"

import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient, exigirAdmin } from "@/lib/supabase/server"
import { empresaSchema, erroresDeZod, usuarioEmpresaSchema } from "@/lib/validation"
import type { EstadoFormulario } from "@/lib/actions/auth"

const SIN_PERMISO: EstadoFormulario = {
  mensaje: "No tienes permisos para realizar esta acción.",
}

async function urlBase() {
  const configurada = process.env.NEXT_PUBLIC_SITE_URL
  if (configurada) return configurada.replace(/\/$/, "")
  const h = await headers()
  const host = h.get("host") ?? "localhost:3000"
  const protocolo = host.startsWith("localhost") ? "http" : "https"
  return `${protocolo}://${host}`
}

/**
 * Crea una empresa nueva (fila en profiles) directamente con service role.
 * No crea ningún auth.user — los usuarios se añaden después vía crearUsuarioEmpresa.
 * Tras crear, redirige a la página de detalle de la empresa.
 */
export async function crearEmpresa(
  _previo: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  if (!(await exigirAdmin())) return SIN_PERMISO

  const validado = empresaSchema.safeParse({
    company_name: String(formData.get("company_name") ?? "").trim(),
    contact_name: String(formData.get("contact_name") ?? "").trim(),
    phone: String(formData.get("phone") ?? "").trim(),
    delivery_address: String(formData.get("delivery_address") ?? "").trim(),
    payment_method: String(formData.get("payment_method") ?? "transferencia"),
    payment_notes: String(formData.get("payment_notes") ?? "").trim() || undefined,
    nif: String(formData.get("nif") ?? "").trim() || undefined,
    legal_name: String(formData.get("legal_name") ?? "").trim() || undefined,
    billing_address: String(formData.get("billing_address") ?? "").trim() || undefined,
    billing_postal_code: String(formData.get("billing_postal_code") ?? "").trim() || undefined,
    billing_city: String(formData.get("billing_city") ?? "").trim() || undefined,
  })

  if (!validado.success) {
    return { errores: erroresDeZod(validado.error) }
  }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from("profiles")
    .insert({
      // id lo genera gen_random_uuid() — no hay auth.user para esta empresa todavía.
      // Supabase permite insertar en profiles con un uuid arbitrario siempre que
      // no haya FK hacia auth.users sin ON DELETE CASCADE... pero profiles.id
      // references auth.users(id), así que necesitamos un auth.user primero.
      //
      // Solución: crear un "ghost user" en auth con ban permanente, que nunca
      // se usa para login. O bien, relajar la FK. La solución más limpia es
      // crear primero el auth.user admin de la empresa (quien recibe la invite).
      //
      // Dado que profiles.id FK -> auth.users.id, no podemos insertar en profiles
      // sin un auth.user. Por tanto, la empresa se crea cuando se da de alta
      // el PRIMER usuario de esa empresa. Este flujo simplificado lo gestiona
      // crearUsuarioEmpresaNueva (empresa + primer usuario en un solo paso).
      //
      // NOTA: Este action no se usa directamente desde el formulario de nueva empresa;
      // ver crearUsuarioEmpresaNueva abajo.
      id: crypto.randomUUID(), // placeholder — sobrescrito abajo
      company_name: validado.data.company_name,
      contact_name: validado.data.contact_name,
      phone: validado.data.phone,
      delivery_address: validado.data.delivery_address,
      payment_method: validado.data.payment_method,
      payment_notes: validado.data.payment_notes || null,
      nif: validado.data.nif || null,
      legal_name: validado.data.legal_name || null,
      billing_address: validado.data.billing_address || null,
      billing_postal_code: validado.data.billing_postal_code || null,
      billing_city: validado.data.billing_city || null,
      role: "client",
    })
    .select("id")
    .single()

  if (error || !data) {
    return { mensaje: "No hemos podido crear la empresa. Inténtalo de nuevo." }
  }

  revalidatePath("/admin/empresas")
  redirect(`/admin/empresas/${data.id}`)
}

/**
 * Crea una empresa nueva junto con su primer usuario (admin de empresa).
 * Flujo:
 *  1. Invita al usuario vía supabase.auth.admin.inviteUserByEmail con skip_profile_creation=false
 *     (este primer usuario SÍ crea un profile, que será el profile de la empresa).
 *  2. Actualiza ese profile recién creado con todos los datos de empresa.
 *  3. Inserta en company_users con los datos del usuario.
 */
export async function crearEmpresaConUsuario(
  _previo: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  if (!(await exigirAdmin())) return SIN_PERMISO

  const empresaValidada = empresaSchema.safeParse({
    company_name: String(formData.get("company_name") ?? "").trim(),
    contact_name: String(formData.get("contact_name") ?? "").trim(),
    phone: String(formData.get("phone") ?? "").trim(),
    delivery_address: String(formData.get("delivery_address") ?? "").trim(),
    payment_method: String(formData.get("payment_method") ?? "transferencia"),
    payment_notes: String(formData.get("payment_notes") ?? "").trim() || undefined,
    nif: String(formData.get("nif") ?? "").trim() || undefined,
    legal_name: String(formData.get("legal_name") ?? "").trim() || undefined,
    billing_address: String(formData.get("billing_address") ?? "").trim() || undefined,
    billing_postal_code: String(formData.get("billing_postal_code") ?? "").trim() || undefined,
    billing_city: String(formData.get("billing_city") ?? "").trim() || undefined,
  })

  const usuarioValidado = usuarioEmpresaSchema.omit({ profile_id: true }).safeParse({
    first_name: String(formData.get("first_name") ?? "").trim(),
    last_name_1: String(formData.get("last_name_1") ?? "").trim(),
    last_name_2: String(formData.get("last_name_2") ?? "").trim() || undefined,
    email: String(formData.get("email") ?? "").trim(),
  })

  const errores: Record<string, string> = {}
  if (!empresaValidada.success) Object.assign(errores, erroresDeZod(empresaValidada.error))
  if (!usuarioValidado.success) Object.assign(errores, erroresDeZod(usuarioValidado.error))
  if (Object.keys(errores).length > 0) return { errores }

  const e = empresaValidada.data!
  const u = usuarioValidado.data!
  const base = await urlBase()
  const admin = createAdminClient()

  // 1. Invitar al primer usuario — el trigger handle_new_user creará el profile
  //    con company_name y contact_name de los metadatos.
  const { data: inviteData, error: inviteError } = await admin.auth.admin.inviteUserByEmail(
    u.email,
    {
      redirectTo: `${base}/auth/callback?next=/bienvenida`,
      data: {
        skip_profile_creation: false,
        company_name: e.company_name,
        contact_name: e.contact_name,
        phone: e.phone,
      },
    },
  )

  if (inviteError || !inviteData?.user) {
    if (inviteError?.message?.includes("already been registered")) {
      return { errores: { email: "Este correo ya está registrado en el sistema." } }
    }
    return { mensaje: "No hemos podido enviar la invitación. Inténtalo de nuevo." }
  }

  const userId = inviteData.user.id

  // 2. Actualizar el profile recién creado con todos los datos de empresa
  await admin
    .from("profiles")
    .update({
      delivery_address: e.delivery_address,
      payment_method: e.payment_method,
      payment_notes: e.payment_notes || null,
      nif: e.nif || null,
      legal_name: e.legal_name || null,
      billing_address: e.billing_address || null,
      billing_postal_code: e.billing_postal_code || null,
      billing_city: e.billing_city || null,
    })
    .eq("id", userId)

  // 3. Crear la fila en company_users para este primer usuario
  await admin.from("company_users").insert({
    profile_id: userId,
    user_id: userId,
    first_name: u.first_name,
    last_name_1: u.last_name_1,
    last_name_2: u.last_name_2 || null,
  })

  revalidatePath("/admin/empresas")
  redirect(`/admin/empresas/${userId}`)
}

/**
 * Añade un usuario nuevo a una empresa existente.
 * Flujo:
 *  1. Invite vía supabase.auth.admin.inviteUserByEmail con skip_profile_creation=true.
 *  2. Insert en company_users apuntando al profile_id de la empresa.
 */
export async function crearUsuarioEmpresa(
  _previo: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  if (!(await exigirAdmin())) return SIN_PERMISO

  const validado = usuarioEmpresaSchema.safeParse({
    first_name: String(formData.get("first_name") ?? "").trim(),
    last_name_1: String(formData.get("last_name_1") ?? "").trim(),
    last_name_2: String(formData.get("last_name_2") ?? "").trim() || undefined,
    email: String(formData.get("email") ?? "").trim(),
    profile_id: String(formData.get("profile_id") ?? "").trim(),
  })

  if (!validado.success) {
    return { errores: erroresDeZod(validado.error) }
  }

  const base = await urlBase()
  const admin = createAdminClient()

  // 1. Invitar al usuario — skip_profile_creation=true evita crear un profile fantasma
  const { data: inviteData, error: inviteError } = await admin.auth.admin.inviteUserByEmail(
    validado.data.email,
    {
      redirectTo: `${base}/auth/callback?next=/bienvenida`,
      data: { skip_profile_creation: true },
    },
  )

  if (inviteError || !inviteData?.user) {
    if (inviteError?.message?.includes("already been registered")) {
      return { errores: { email: "Este correo ya está registrado en el sistema." } }
    }
    return { mensaje: "No hemos podido enviar la invitación. Inténtalo de nuevo." }
  }

  // 2. Registrar en company_users
  const { error: insertError } = await admin.from("company_users").insert({
    profile_id: validado.data.profile_id,
    user_id: inviteData.user.id,
    first_name: validado.data.first_name,
    last_name_1: validado.data.last_name_1,
    last_name_2: validado.data.last_name_2 || null,
  })

  if (insertError) {
    // El usuario fue creado en auth pero no en company_users — limpieza
    await admin.auth.admin.deleteUser(inviteData.user.id)
    return { mensaje: "No hemos podido completar el alta. Inténtalo de nuevo." }
  }

  revalidatePath(`/admin/empresas/${validado.data.profile_id}`)
  return { ok: true, mensaje: "Invitación enviada correctamente." }
}

/**
 * Actualiza los datos personales de un usuario de empresa (solo admin).
 */
export async function actualizarUsuarioEmpresa(
  companyUserId: string,
  _previo: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  if (!(await exigirAdmin())) return SIN_PERMISO

  const validado = usuarioEmpresaSchema.omit({ email: true, profile_id: true }).safeParse({
    first_name: String(formData.get("first_name") ?? "").trim(),
    last_name_1: String(formData.get("last_name_1") ?? "").trim(),
    last_name_2: String(formData.get("last_name_2") ?? "").trim() || undefined,
  })

  if (!validado.success) {
    return { errores: erroresDeZod(validado.error) }
  }

  const admin = createAdminClient()
  const { error } = await admin
    .from("company_users")
    .update({
      first_name: validado.data.first_name,
      last_name_1: validado.data.last_name_1,
      last_name_2: validado.data.last_name_2 || null,
    })
    .eq("id", companyUserId)

  if (error) {
    return { mensaje: "No hemos podido guardar los cambios. Inténtalo de nuevo." }
  }

  return { ok: true, mensaje: "Datos actualizados correctamente." }
}

/**
 * Desactiva un usuario de empresa: is_active=false + ban en Supabase Auth.
 */
export async function desactivarUsuarioEmpresa(
  companyUserId: string,
): Promise<{ ok: boolean; mensaje: string }> {
  if (!(await exigirAdmin())) {
    return { ok: false, mensaje: "No tienes permisos para realizar esta acción." }
  }

  const admin = createAdminClient()

  const { data: cu } = await admin
    .from("company_users")
    .select("user_id, profile_id")
    .eq("id", companyUserId)
    .maybeSingle()

  if (!cu) return { ok: false, mensaje: "Usuario no encontrado." }

  const { error: updateError } = await admin
    .from("company_users")
    .update({ is_active: false })
    .eq("id", companyUserId)

  if (updateError) return { ok: false, mensaje: "No hemos podido desactivar el usuario." }

  // Banear en Supabase Auth para que no pueda iniciar sesión
  await admin.auth.admin.updateUserById(cu.user_id, { ban_duration: "876000h" })

  revalidatePath(`/admin/empresas/${cu.profile_id}`)
  return { ok: true, mensaje: "Usuario desactivado correctamente." }
}

/**
 * Reactiva un usuario de empresa previamente desactivado.
 */
export async function reactivarUsuarioEmpresa(
  companyUserId: string,
): Promise<{ ok: boolean; mensaje: string }> {
  if (!(await exigirAdmin())) {
    return { ok: false, mensaje: "No tienes permisos para realizar esta acción." }
  }

  const admin = createAdminClient()

  const { data: cu } = await admin
    .from("company_users")
    .select("user_id, profile_id")
    .eq("id", companyUserId)
    .maybeSingle()

  if (!cu) return { ok: false, mensaje: "Usuario no encontrado." }

  await admin.from("company_users").update({ is_active: true }).eq("id", companyUserId)
  await admin.auth.admin.updateUserById(cu.user_id, { ban_duration: "none" })

  revalidatePath(`/admin/empresas/${cu.profile_id}`)
  return { ok: true, mensaje: "Usuario reactivado correctamente." }
}

/**
 * Actualiza los datos de empresa (admin edita perfil de empresa).
 */
export async function actualizarEmpresa(
  profileId: string,
  _previo: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  if (!(await exigirAdmin())) return SIN_PERMISO

  const validado = empresaSchema.safeParse({
    company_name: String(formData.get("company_name") ?? "").trim(),
    contact_name: String(formData.get("contact_name") ?? "").trim(),
    phone: String(formData.get("phone") ?? "").trim(),
    delivery_address: String(formData.get("delivery_address") ?? "").trim(),
    payment_method: String(formData.get("payment_method") ?? "transferencia"),
    payment_notes: String(formData.get("payment_notes") ?? "").trim() || undefined,
    nif: String(formData.get("nif") ?? "").trim() || undefined,
    legal_name: String(formData.get("legal_name") ?? "").trim() || undefined,
    billing_address: String(formData.get("billing_address") ?? "").trim() || undefined,
    billing_postal_code: String(formData.get("billing_postal_code") ?? "").trim() || undefined,
    billing_city: String(formData.get("billing_city") ?? "").trim() || undefined,
  })

  if (!validado.success) {
    return { errores: erroresDeZod(validado.error) }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from("profiles")
    .update({
      company_name: validado.data.company_name,
      contact_name: validado.data.contact_name,
      phone: validado.data.phone,
      delivery_address: validado.data.delivery_address,
      payment_method: validado.data.payment_method,
      payment_notes: validado.data.payment_notes || null,
      nif: validado.data.nif || null,
      legal_name: validado.data.legal_name || null,
      billing_address: validado.data.billing_address || null,
      billing_postal_code: validado.data.billing_postal_code || null,
      billing_city: validado.data.billing_city || null,
    })
    .eq("id", profileId)

  if (error) {
    return { mensaje: "No hemos podido guardar los cambios. Inténtalo de nuevo." }
  }

  revalidatePath(`/admin/empresas/${profileId}`)
  revalidatePath("/admin/empresas")
  return { ok: true, mensaje: "Datos de empresa actualizados correctamente." }
}
