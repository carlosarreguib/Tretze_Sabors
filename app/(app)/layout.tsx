import { redirect } from "next/navigation"
import { PanelShell } from "@/components/panel/shell"
import { WidgetSoporte } from "@/components/panel/soporte"
import { getPerfil } from "@/lib/supabase/server"

export default async function PanelLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // El middleware ya redirige a /login sin sesión; esta comprobación es la
  // que de verdad protege los datos si el middleware no llegara a ejecutarse.
  const perfil = await getPerfil()
  if (!perfil) redirect("/login?redirect=/panel")

  return (
    <>
      <PanelShell
        empresa={perfil.company_name}
        esAdmin={perfil.role === "admin"}
      >
        {children}
      </PanelShell>
      <WidgetSoporte empresa={perfil.company_name} />
    </>
  )
}
