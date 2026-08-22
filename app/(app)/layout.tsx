import { redirect } from "next/navigation"
import { PanelShell } from "@/components/panel/shell"
import { WidgetSoporte } from "@/components/panel/soporte"
import { getCompanyUser, getPerfil } from "@/lib/supabase/server"

export default async function PanelLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // El middleware ya redirige a /login sin sesión; esta comprobación es la
  // que de verdad protege los datos si el middleware no llegara a ejecutarse.
  const [perfil, companyUser] = await Promise.all([getPerfil(), getCompanyUser()])
  if (!perfil) redirect("/login?redirect=/panel")

  const nombreUsuario = companyUser
    ? [companyUser.first_name, companyUser.last_name_1].filter(Boolean).join(" ")
    : null

  return (
    <>
      <PanelShell
        empresa={perfil.company_name}
        nombreUsuario={nombreUsuario}
        esAdmin={perfil.role === "admin"}
      >
        {children}
      </PanelShell>
      <WidgetSoporte empresa={perfil.company_name} />
    </>
  )
}
