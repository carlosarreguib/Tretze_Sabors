import type { Metadata } from "next"
import { GestionPlatos } from "@/components/admin/gestion-platos"
import { createClient } from "@/lib/supabase/server"

export const metadata: Metadata = { title: "Platos" }

export default async function AdminPlatosPage() {
  const supabase = await createClient()

  // Como admin, RLS permite ver también los platos ocultos.
  const { data: platos } = await supabase
    .from("platos")
    .select("*")
    .order("categoria")
    .order("nombre")

  return (
    <div className="max-w-3xl mx-auto">
      <header className="mb-7">
        <h1 className="font-display text-3xl sm:text-4xl">Platos</h1>
        <p className="mt-2 text-muted-foreground">
          La carta completa. Los platos ocultos no se muestran a los clientes.
        </p>
      </header>

      <GestionPlatos platos={platos ?? []} />
    </div>
  )
}
