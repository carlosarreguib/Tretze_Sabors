import type { Metadata } from "next"
import Link from "next/link"
import { ChevronLeft, UserPlus } from "lucide-react"
import { notFound } from "next/navigation"
import { Card } from "@/components/ui/misc"
import { FormularioEmpresa } from "@/components/admin/formulario-empresa"
import { FormularioPreciosEmpresa } from "@/components/admin/formulario-precios-empresa"
import { FormularioUsuarioEmpresa } from "@/components/admin/formulario-usuario-empresa"
import { ListaUsuariosEmpresa } from "@/components/admin/lista-usuarios-empresa"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

export const metadata: Metadata = { title: "Detalle empresa" }

export default async function DetalleEmpresaPage({
  params,
}: {
  params: Promise<{ profileId: string }>
}) {
  const { profileId } = await params
  const supabase = await createClient()

  const { data: perfil } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", profileId)
    .eq("role", "client")
    .maybeSingle()

  if (!perfil) notFound()

  const { data: precios } = await supabase
    .from("company_prices")
    .select("*")
    .eq("profile_id", profileId)
    .maybeSingle()

  // Los emails de auth.users solo son accesibles con service role
  const admin = createAdminClient()
  const { data: companyUsers } = await admin
    .from("company_users")
    .select("*")
    .eq("profile_id", profileId)
    .order("created_at")

  // Enriquecer con emails desde auth.users
  const usuarios = await Promise.all(
    (companyUsers ?? []).map(async (cu) => {
      const { data: authUser } = await admin.auth.admin.getUserById(cu.user_id)
      return { ...cu, email: authUser?.user?.email ?? null }
    }),
  )

  return (
    <div className="max-w-3xl mx-auto">
      <Link
        href="/admin/empresas"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 mb-6 cursor-pointer"
      >
        <ChevronLeft className="w-4 h-4" aria-hidden="true" />
        Volver a Empresas
      </Link>

      <header className="mb-7">
        <h1 className="font-display text-3xl sm:text-4xl">
          {perfil.company_name || "Empresa sin nombre"}
        </h1>
      </header>

      <div className="space-y-6">
        <FormularioEmpresa perfil={perfil} />

        <FormularioPreciosEmpresa profileId={profileId} precios={precios ?? null} />

        <Card className="p-6">
          <div className="flex items-center justify-between gap-4 mb-5">
            <div>
              <h2 className="font-display text-xl">Usuarios</h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                Los usuarios pueden iniciar sesión y ver los pedidos de esta empresa.
              </p>
            </div>
            <UserPlus className="w-5 h-5 text-muted-foreground shrink-0" aria-hidden="true" />
          </div>

          <ListaUsuariosEmpresa usuarios={usuarios} />

          <div className="mt-6 pt-6 border-t border-border">
            <h3 className="text-sm font-medium mb-4">Añadir usuario</h3>
            <FormularioUsuarioEmpresa profileId={profileId} />
          </div>
        </Card>
      </div>
    </div>
  )
}
