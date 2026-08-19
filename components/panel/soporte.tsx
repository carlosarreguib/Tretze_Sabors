"use client"

import { useEffect, useRef, useState } from "react"
import { Headset, Mail, MessageCircle, Phone, X } from "lucide-react"
import { EMPRESA } from "@/lib/constants"

/**
 * Widget de soporte.
 *
 * No es un chat con backend: abre los canales reales del negocio (teléfono,
 * WhatsApp y correo). Prometer un chat en vivo que nadie atiende sería peor
 * que no ofrecerlo.
 */
export function WidgetSoporte({ empresa }: { empresa: string }) {
  const [abierto, setAbierto] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const botonRef = useRef<HTMLButtonElement>(null)

  // Cerrar con Escape y al pulsar fuera: comportamiento esperado de un popover
  useEffect(() => {
    if (!abierto) return

    const alPulsarTecla = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setAbierto(false)
        botonRef.current?.focus()
      }
    }

    const alPulsarFuera = (e: MouseEvent) => {
      const destino = e.target as Node
      if (
        !panelRef.current?.contains(destino) &&
        !botonRef.current?.contains(destino)
      ) {
        setAbierto(false)
      }
    }

    document.addEventListener("keydown", alPulsarTecla)
    document.addEventListener("mousedown", alPulsarFuera)
    return () => {
      document.removeEventListener("keydown", alPulsarTecla)
      document.removeEventListener("mousedown", alPulsarFuera)
    }
  }, [abierto])

  const asunto = encodeURIComponent(`Consulta de ${empresa || "cliente"}`)
  const textoWhatsapp = encodeURIComponent(
    `Hola, os escribo de ${empresa || "una empresa"}. Tengo una consulta sobre el servicio de catering.`,
  )

  const OPCIONES = [
    {
      href: `tel:${EMPRESA.telefonoLink}`,
      icono: Phone,
      titulo: "Llamar",
      detalle: EMPRESA.telefono,
      externo: false,
    },
    {
      href: `https://wa.me/${EMPRESA.telefonoWhatsapp}?text=${textoWhatsapp}`,
      icono: MessageCircle,
      titulo: "WhatsApp",
      detalle: "Respuesta en horario de cocina",
      externo: true,
    },
    {
      href: `mailto:${EMPRESA.email}?subject=${asunto}`,
      icono: Mail,
      titulo: "Correo",
      detalle: EMPRESA.email,
      externo: false,
    },
  ]

  return (
    <div className="fixed bottom-5 right-5 z-40 print:hidden">
      {abierto && (
        <div
          ref={panelRef}
          role="dialog"
          aria-label="Contactar con soporte"
          className="absolute bottom-16 right-0 w-72 cristal border border-border rounded-2xl shadow-xl p-4 animar-entrada"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-display text-lg">¿Necesitas ayuda?</p>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                {EMPRESA.horario}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setAbierto(false)}
              aria-label="Cerrar"
              className="w-8 h-8 grid place-items-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors duration-200 cursor-pointer shrink-0"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>

          <ul className="mt-4 space-y-1.5">
            {OPCIONES.map(({ href, icono: Icono, titulo, detalle, externo }) => (
              <li key={titulo}>
                <a
                  href={href}
                  {...(externo
                    ? { target: "_blank", rel: "noopener noreferrer" }
                    : {})}
                  className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-muted transition-colors duration-200 cursor-pointer"
                >
                  <span className="w-9 h-9 rounded-lg bg-primary/12 grid place-items-center shrink-0">
                    <Icono className="w-4 h-4 text-primary" aria-hidden="true" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-medium">{titulo}</span>
                    <span className="block text-xs text-muted-foreground truncate">
                      {detalle}
                    </span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      <button
        ref={botonRef}
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-expanded={abierto}
        aria-label={abierto ? "Cerrar ayuda" : "Abrir ayuda"}
        className="w-14 h-14 rounded-full bg-primary text-on-primary shadow-lg hover:bg-primary-hover hover:shadow-xl grid place-items-center transition-all duration-200 cursor-pointer"
      >
        {abierto ? (
          <X className="w-5 h-5" aria-hidden="true" />
        ) : (
          <Headset className="w-5 h-5" aria-hidden="true" />
        )}
      </button>
    </div>
  )
}
