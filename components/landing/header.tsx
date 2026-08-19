"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { Menu, Phone, X } from "lucide-react"
import { ThemeToggle } from "@/components/theme-provider"
import { ButtonLink } from "@/components/ui/button"
import { EMPRESA } from "@/lib/constants"
import { cn } from "@/lib/utils"

const ENLACES = [
  { href: "/#servicio", texto: "El servicio" },
  { href: "/#menu", texto: "La cocina" },
  { href: "/#nosotros", texto: "Nosotros" },
  { href: "/#contacto", texto: "Contacto" },
]

export function Header({ haySesion }: { haySesion: boolean }) {
  const [desplazado, setDesplazado] = useState(false)
  const [abierto, setAbierto] = useState(false)

  useEffect(() => {
    const alScroll = () => setDesplazado(window.scrollY > 16)
    alScroll()
    window.addEventListener("scroll", alScroll, { passive: true })
    return () => window.removeEventListener("scroll", alScroll)
  }, [])

  // Bloquea el scroll de fondo mientras el menú móvil está abierto
  useEffect(() => {
    document.body.style.overflow = abierto ? "hidden" : ""
    return () => {
      document.body.style.overflow = ""
    }
  }, [abierto])

  return (
    <header
      className={cn(
        "fixed top-0 inset-x-0 z-50 transition-all duration-300",
        desplazado || abierto
          ? "cristal border-b border-border shadow-sm"
          : "bg-transparent",
      )}
    >
      <nav
        className="mx-auto max-w-6xl px-5 h-18 flex items-center justify-between gap-4"
        aria-label="Navegación principal"
      >
        <Link
          href="/"
          className="font-display text-xl tracking-tight shrink-0 cursor-pointer"
        >
          Tretze<span className="text-primary">Sabors</span>
        </Link>

        <ul className="hidden lg:flex items-center gap-1">
          {ENLACES.map((e) => (
            <li key={e.href}>
              <Link
                href={e.href}
                className="px-3.5 py-2 rounded-full text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors duration-200 cursor-pointer"
              >
                {e.texto}
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-1.5">
          <a
            href={`tel:${EMPRESA.telefonoLink}`}
            className="hidden md:inline-flex items-center gap-2 px-3.5 h-11 rounded-full text-sm font-medium text-foreground hover:bg-muted transition-colors duration-200 cursor-pointer"
          >
            <Phone className="w-4 h-4 text-primary" aria-hidden="true" />
            {EMPRESA.telefono}
          </a>

          <ThemeToggle />

          <ButtonLink
            href={haySesion ? "/panel" : "/login"}
            tamano="sm"
            className="hidden sm:inline-flex"
          >
            {haySesion ? "Mi panel" : "Acceder"}
          </ButtonLink>

          <button
            type="button"
            onClick={() => setAbierto((v) => !v)}
            aria-expanded={abierto}
            aria-controls="menu-movil"
            aria-label={abierto ? "Cerrar menú" : "Abrir menú"}
            className="lg:hidden w-11 h-11 grid place-items-center rounded-full hover:bg-muted transition-colors duration-200 cursor-pointer"
          >
            {abierto ? (
              <X className="w-5 h-5" aria-hidden="true" />
            ) : (
              <Menu className="w-5 h-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </nav>

      {abierto && (
        <div
          id="menu-movil"
          className="lg:hidden border-t border-border bg-background px-5 py-4 animar-suave"
        >
          <ul className="space-y-1">
            {ENLACES.map((e) => (
              <li key={e.href}>
                <Link
                  href={e.href}
                  onClick={() => setAbierto(false)}
                  className="block px-3 py-3 rounded-xl text-base hover:bg-muted transition-colors duration-200 cursor-pointer"
                >
                  {e.texto}
                </Link>
              </li>
            ))}
          </ul>

          <div className="mt-4 pt-4 border-t border-border space-y-3">
            <a
              href={`tel:${EMPRESA.telefonoLink}`}
              className="flex items-center gap-2.5 px-3 py-3 rounded-xl hover:bg-muted transition-colors duration-200 cursor-pointer"
            >
              <Phone className="w-4 h-4 text-primary" aria-hidden="true" />
              <span className="text-base">{EMPRESA.telefono}</span>
            </a>
            <ButtonLink
              href={haySesion ? "/panel" : "/login"}
              className="w-full"
              onClick={() => setAbierto(false)}
            >
              {haySesion ? "Ir a mi panel" : "Acceder a mi cuenta"}
            </ButtonLink>
          </div>
        </div>
      )}
    </header>
  )
}
