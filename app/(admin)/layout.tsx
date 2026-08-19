import { redirect } from "next/navigation"
import { PanelShell } from "@/components/panel/shell"
import { getPerfil } from "@/lib/supabase/server"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const perfil = await getPerfil()

  if (!perfil) redirect("/login?redirect=/admin/pedidos")

  // Un cliente que escriba /admin a mano acaba en su panel, no en un error.
  // Las políticas RLS impiden además que llegue a leer o escribir nada.
  if (perfil.role !== "admin") redirect("/panel")

  return (
    <PanelShell empresa={`${perfil.company_name} · Gestión`} esAdmin>
      {children}
    </PanelShell>
  )
}
