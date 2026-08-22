import type { Metadata } from "next"
import {
  FormularioAlergias,
  FormularioCuenta,
  FormularioFiscal,
  FormularioPassword,
} from "@/components/panel/formulario-cuenta"
import { createClient, getPerfil, getUsuario } from "@/lib/supabase/server"

export const metadata: Metadata = { title: "Mi cuenta" }

export default async function CuentaPage() {
  const [perfil, usuario, supabase] = await Promise.all([
    getPerfil(),
    getUsuario(),
    createClient(),
  ])

  const { data: userAllergy } = await supabase
    .from("user_allergies")
    .select("alergenos")
    .eq("user_id", usuario?.id ?? "")
    .maybeSingle()

  return (
    <div className="max-w-2xl mx-auto">
      <header className="mb-7">
        <h1 className="font-display text-3xl sm:text-4xl">Mi cuenta</h1>
        <p className="mt-2 text-muted-foreground">
          Datos de contacto, dirección de entrega y forma de pago.
        </p>
      </header>

      <div className="space-y-6">
        <FormularioCuenta perfil={perfil!} email={usuario?.email ?? ""} />
        <FormularioFiscal perfil={perfil!} />
        <FormularioAlergias alergenos={userAllergy?.alergenos ?? []} />
        <FormularioPassword />
      </div>
    </div>
  )
}
