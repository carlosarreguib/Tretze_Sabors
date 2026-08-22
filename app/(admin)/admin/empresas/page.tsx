import type { Metadata } from "next"
import Link from "next/link"
import { Building2, Plus } from "lucide-react"
import { Card, Vacio } from "@/components/ui/misc"
import { createClient } from "@/lib/supabase/server"

export const metadata: Metadata = { title: "Empresas" }

export default async function AdminEmpresasPage() {
  const supabase = await createClient()

  const { data: empresas } = await supabase
    .from("profiles")
    .select("id, company_name, nif, phone, is_active")
    .eq("role", "client")
    .order("company_name")

  // Contar usuarios activos por empresa
  const { data: conteos } = await supabase
    .from("company_users")
    .select("profile_id")
    .eq("is_active", true)

  const usuariosPorEmpresa = new Map<string, number>()
  for (const cu of conteos ?? []) {
    usuariosPorEmpresa.set(cu.profile_id, (usuariosPorEmpresa.get(cu.profile_id) ?? 0) + 1)
  }

  return (
    <div className="max-w-4xl mx-auto">
      <header className="mb-7 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl">Empresas</h1>
          <p className="mt-2 text-muted-foreground">
            Gestiona las empresas cliente y sus usuarios.
          </p>
        </div>
        <Link
          href="/admin/empresas/nuevo"
          className="inline-flex items-center gap-2 h-10 px-4 rounded-full bg-primary text-on-primary text-sm font-medium hover:bg-primary-hover transition-colors duration-200 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          Nueva empresa
        </Link>
      </header>

      {!empresas || empresas.length === 0 ? (
        <Card>
          <Vacio
            icono={<Building2 className="w-5 h-5" />}
            titulo="No hay empresas dadas de alta"
            descripcion="Crea la primera empresa con el botón de arriba."
          />
        </Card>
      ) : (
        <Card>
          <ul className="divide-y divide-border">
            {empresas.map((e) => {
              const usuarios = usuariosPorEmpresa.get(e.id) ?? 0
              return (
                <li key={e.id}>
                  <Link
                    href={`/admin/empresas/${e.id}`}
                    className="flex items-center justify-between gap-3 px-5 py-4 hover:bg-muted transition-colors duration-200 cursor-pointer"
                  >
                    <div className="min-w-0">
                      <p className="font-medium truncate">
                        {e.company_name || "Empresa sin nombre"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {e.nif ? `NIF: ${e.nif} · ` : ""}
                        {e.phone ?? ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-sm text-muted-foreground">
                        {usuarios === 0
                          ? "Sin usuarios"
                          : `${usuarios} usuario${usuarios !== 1 ? "s" : ""}`}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          e.is_active
                            ? "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200"
                            : "bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400"
                        }`}
                      >
                        {e.is_active ? "Activa" : "Inactiva"}
                      </span>
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
        </Card>
      )}
    </div>
  )
}
