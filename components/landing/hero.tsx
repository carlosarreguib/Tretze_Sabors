import { ArrowRight, Clock, Mail, MapPin, Phone } from "lucide-react"
import { ButtonLink } from "@/components/ui/button"
import { EMPRESA } from "@/lib/constants"

/**
 * Hero.
 *
 * La fotografía es opcional: si /public/img/hero.jpg no existe, se ve el
 * degradado cálido de .fondo-calido. Así la página nunca se rompe por una
 * imagen que falta, y basta con dejar el fichero para que aparezca.
 */
export function Hero({ haySesion }: { haySesion: boolean }) {
  return (
    <section className="relative min-h-[92svh] flex items-center overflow-hidden fondo-calido">
      {/* Fotografía de fondo. Reemplazable en /public/img/hero.jpg */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/img/hero.jpg')" }}
        aria-hidden="true"
      />

      {/* Velo: garantiza contraste del texto sobre cualquier fotografía */}
      <div
        className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/65 to-black/45"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-6xl px-5 pt-28 pb-20 w-full">
        <div className="max-w-2xl animar-entrada">
          <p className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 text-xs font-medium tracking-wide">
            <Clock className="w-3.5 h-3.5" aria-hidden="true" />
            Lunes a sábado · 12:00 – 16:00
          </p>

          <h1 className="mt-6 font-display text-[2.6rem] leading-[1.05] sm:text-6xl lg:text-7xl text-white text-balance">
            Cocina casera, servida cada día en tu oficina
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-white/85 leading-relaxed max-w-xl text-pretty">
            Fresca, tradicional y siempre caliente. Preparamos cada mañana la
            comida que hacía la abuela y la llevamos puntual a tu empresa.
          </p>

          <div className="mt-9 flex flex-col sm:flex-row gap-3">
            <ButtonLink
              href={haySesion ? "/panel" : "/registro"}
              tamano="lg"
              className="group"
            >
              Hacer un pedido
              <ArrowRight
                className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </ButtonLink>

            <ButtonLink
              href="#servicio"
              tamano="lg"
              variante="secundario"
              className="bg-white/10 text-white border-white/25 hover:bg-white/20 backdrop-blur-sm"
            >
              Saber más
            </ButtonLink>
          </div>

          {/* Datos de contacto visibles sin buscar, ya en la primera pantalla */}
          <ul className="mt-12 flex flex-wrap gap-x-6 gap-y-3 text-sm">
            <li>
              <a
                href={`tel:${EMPRESA.telefonoLink}`}
                className="inline-flex items-center gap-2 text-white/85 hover:text-white transition-colors duration-200 cursor-pointer"
              >
                <Phone className="w-4 h-4" aria-hidden="true" />
                {EMPRESA.telefono}
              </a>
            </li>
            <li>
              <a
                href={`mailto:${EMPRESA.email}`}
                className="inline-flex items-center gap-2 text-white/85 hover:text-white transition-colors duration-200 cursor-pointer"
              >
                <Mail className="w-4 h-4" aria-hidden="true" />
                {EMPRESA.email}
              </a>
            </li>
            <li className="inline-flex items-center gap-2 text-white/70">
              <MapPin className="w-4 h-4" aria-hidden="true" />
              Rubí, Barcelona
            </li>
          </ul>
        </div>
      </div>
    </section>
  )
}

/**
 * Insignia de contacto flotante.
 *
 * En móvil se coloca abajo y a ancho completo (pulgar), en escritorio flota
 * abajo a la derecha. Se oculta al imprimir.
 */
export function BadgeContacto() {
  return (
    <div className="fixed bottom-4 inset-x-4 sm:inset-x-auto sm:right-6 sm:bottom-6 z-40 print:hidden">
      <div className="cristal border border-border rounded-2xl shadow-lg p-2 flex items-center gap-2 justify-center sm:justify-start">
        <a
          href={`tel:${EMPRESA.telefonoLink}`}
          className="flex items-center gap-2.5 px-3.5 h-11 rounded-xl hover:bg-muted transition-colors duration-200 cursor-pointer"
        >
          <span className="w-8 h-8 rounded-full bg-primary/12 grid place-items-center shrink-0">
            <Phone className="w-4 h-4 text-primary" aria-hidden="true" />
          </span>
          <span className="text-left leading-tight">
            <span className="block text-[0.68rem] text-muted-foreground">
              Llámanos
            </span>
            <span className="block text-sm font-medium">
              {EMPRESA.telefono}
            </span>
          </span>
        </a>

        <span className="w-px h-8 bg-border" aria-hidden="true" />

        <a
          href={`mailto:${EMPRESA.email}`}
          aria-label={`Escríbenos a ${EMPRESA.email}`}
          className="w-11 h-11 grid place-items-center rounded-xl hover:bg-muted transition-colors duration-200 cursor-pointer"
        >
          <Mail className="w-4 h-4 text-primary" aria-hidden="true" />
        </a>
      </div>
    </div>
  )
}
