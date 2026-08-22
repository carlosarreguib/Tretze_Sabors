import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { FormularioBienvenida } from "@/components/auth/formulario-bienvenida"

export const metadata: Metadata = { title: "Crea tu contraseña" }

export default async function BienvenidaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Si no hay sesión activa (el callback ya la creó al intercambiar el token),
  // el usuario llegó aquí directamente sin haber usado el enlace de invitación.
  if (!user) redirect("/login")

  return <FormularioBienvenida nombre={user.email ?? ""} />
}
