"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import {
  CalendarDays,
  ClipboardList,
  LayoutGrid,
  LogOut,
  Menu,
  Receipt,
  Settings,
  ShieldCheck,
  UtensilsCrossed,
  X,
} from "lucide-react"
import { ThemeToggle } from "@/components/theme-provider"
import { cerrarSesion } from "@/lib/actions/auth"
import { cn } from "@/lib/utils"

const NAV_CLIENTE = [
  { href: "/panel", texto: "Pedido semanal", icono: CalendarDays },
  { href: "/panel/pedidos", texto: "Mis pedidos", icono: ClipboardList },
  { href: "/panel/facturacion", texto: "Facturación", icono: Receipt },
  { href: "/panel/cuenta", texto: "Mi cuenta", icono: Settings },
]

const NAV_ADMIN = [
  { href: "/admin/pedidos", texto: "Pedidos", icono: ClipboardList },
  { href: "/admin/menus", texto: "Menús", icono: LayoutGrid },
  { href: "/admin/platos", texto: "Platos", icono: UtensilsCrossed },
  { href: "/admin/facturas", texto: "Facturación", icono: Receipt },
]

export function PanelShell({
  children,
  empresa,
  esAdmin,
}: {
  children: React.ReactNode
  empresa: string
  esAdmin: boolean
}) {
  const pathname = usePathname()
  const [abierto, setAbierto] = useState(false)

  const enAdmin = pathname.startsWith("/admin")
  const navegacion = enAdmin ? NAV_ADMIN : NAV_CLIENTE

  const enlaces = navegacion.map(({ href, texto, icono: Icono }) => {
    // El pedido semanal y el panel de pedidos son prefijos de otras rutas:
    // sin la comparación exacta se marcarían dos entradas a la vez.
    const activo =
      href === "/panel" || href === "/admin/pedidos"
        ? pathname === href
        : pathname.startsWith(href)

    return (
      <li key={href}>
        <Link
          href={href}
          onClick={() => setAbierto(false)}
          aria-current={activo ? "page" : undefined}
          className={cn(
            "flex items-center gap-3 px-3.5 h-11 rounded-xl text-sm transition-colors duration-200 cursor-pointer",
            activo
              ? "bg-primary/12 text-primary font-medium"
              : "text-muted-foreground hover:text-foreground hover:bg-muted",
          )}
        >
          <Icono className="w-4 h-4 shrink-0" aria-hidden="true" />
          {texto}
        </Link>
      </li>
    )
  })

  const barraLateral = (
    <div className="flex flex-col h-full">
      <Link
        href="/"
        className="font-display text-xl px-3.5 py-2 cursor-pointer shrink-0"
      >
        Tretze<span className="text-primary">Sabors</span>
      </Link>

      <p className="px-3.5 mt-1 text-xs text-muted-foreground truncate">
        {empresa || "Tu empresa"}
      </p>

      <nav className="mt-7 flex-1" aria-label="Navegación del panel">
        <ul className="space-y-1">{enlaces}</ul>

        {esAdmin && (
          <>
            <p className="mt-8 mb-2 px-3.5 text-xs font-semibold tracking-wider uppercase text-muted-foreground">
              {enAdmin ? "Mi cuenta" : "Administración"}
            </p>
            <ul className="space-y-1">
              <li>
                <Link
                  href={enAdmin ? "/panel" : "/admin/pedidos"}
                  onClick={() => setAbierto(false)}
                  className="flex items-center gap-3 px-3.5 h-11 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors duration-200 cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4 shrink-0" aria-hidden="true" />
                  {enAdmin ? "Ver como cliente" : "Panel de gestión"}
                </Link>
              </li>
            </ul>
          </>
        )}
      </nav>

      <form action={cerrarSesion} className="pt-4 border-t border-border">
        <button
          type="submit"
          className="w-full flex items-center gap-3 px-3.5 h-11 rounded-xl text-sm text-muted-foreground hover:text-destructive hover:bg-destructive-soft transition-colors duration-200 cursor-pointer"
        >
          <LogOut className="w-4 h-4 shrink-0" aria-hidden="true" />
          Cerrar sesión
        </button>
      </form>
    </div>
  )

  return (
    <div className="min-h-svh lg:grid lg:grid-cols-[16rem_1fr]">
      {/* Barra lateral fija en escritorio */}
      <aside className="hidden lg:block border-r border-border bg-surface p-4 sticky top-0 h-svh">
        {barraLateral}
      </aside>

      {/* Cabecera móvil */}
      <header className="lg:hidden sticky top-0 z-40 cristal border-b border-border">
        <div className="h-16 px-4 flex items-center justify-between">
          <Link href="/" className="font-display text-lg cursor-pointer">
            Tretze<span className="text-primary">Sabors</span>
          </Link>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <button
              type="button"
              onClick={() => setAbierto((v) => !v)}
              aria-expanded={abierto}
              aria-controls="nav-panel-movil"
              aria-label={abierto ? "Cerrar menú" : "Abrir menú"}
              className="w-11 h-11 grid place-items-center rounded-full hover:bg-muted transition-colors duration-200 cursor-pointer"
            >
              {abierto ? (
                <X className="w-5 h-5" aria-hidden="true" />
              ) : (
                <Menu className="w-5 h-5" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        {abierto && (
          <div
            id="nav-panel-movil"
            className="border-t border-border bg-background p-4 animar-suave"
          >
            {barraLateral}
          </div>
        )}
      </header>

      <div className="flex flex-col min-w-0">
        {/* Conmutador de tema solo en escritorio: en móvil ya está en la cabecera */}
        <div className="hidden lg:flex justify-end px-6 pt-4">
          <ThemeToggle />
        </div>

        <main id="contenido" className="flex-1 px-4 sm:px-6 py-6 lg:pt-2 min-w-0">
          {children}
        </main>
      </div>
    </div>
  )
}
