import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { ThemeToggle } from "@/components/theme-provider"
import { EMPRESA } from "@/lib/constants"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-svh grid lg:grid-cols-2">
      {/* Columna de marca: se oculta en móvil para no robar espacio al formulario */}
      <aside className="hidden lg:flex relative fondo-calido p-14 flex-col justify-between">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-35"
          style={{ backgroundImage: "url('/img/hero.jpg')" }}
          aria-hidden="true"
        />
        <div
          className="absolute inset-0 bg-gradient-to-t from-black/70 to-black/20"
          aria-hidden="true"
        />

        <Link
          href="/"
          className="relative font-display text-2xl text-white cursor-pointer"
        >
          Tretze<span className="text-orange-300">Sabors</span>
        </Link>

        <div className="relative max-w-md">
          <p className="font-display text-4xl text-white leading-tight text-balance">
            {EMPRESA.eslogan}
          </p>
          <p className="mt-5 text-white/75 leading-relaxed">
            Gestiona los pedidos de tu empresa, revisa el menú de la semana y
            consulta tu historial desde un único sitio.
          </p>
        </div>

        <p className="relative text-sm text-white/60">
          {EMPRESA.horario} · {EMPRESA.telefono}
        </p>
      </aside>

      <main
        id="contenido"
        className="flex flex-col px-5 py-8 sm:px-10 lg:px-14"
      >
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            Volver al inicio
          </Link>
          <ThemeToggle />
        </div>

        <div className="flex-1 flex items-center justify-center py-10">
          <div className="w-full max-w-md">{children}</div>
        </div>
      </main>
    </div>
  )
}
