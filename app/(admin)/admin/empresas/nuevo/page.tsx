import type { Metadata } from "next"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { FormularioNuevaEmpresa } from "@/components/admin/formulario-nueva-empresa"

export const metadata: Metadata = { title: "Nueva empresa" }

export default function NuevaEmpresaPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <Link
        href="/admin/empresas"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 mb-6 cursor-pointer"
      >
        <ChevronLeft className="w-4 h-4" aria-hidden="true" />
        Volver a Empresas
      </Link>

      <header className="mb-7">
        <h1 className="font-display text-3xl sm:text-4xl">Nueva empresa</h1>
        <p className="mt-2 text-muted-foreground">
          Crea la empresa y añade su primer usuario. El usuario recibirá un correo
          de invitación para establecer su contraseña.
        </p>
      </header>

      <FormularioNuevaEmpresa />
    </div>
  )
}
