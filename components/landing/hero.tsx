import { ArrowRight, Clock, Mail, MapPin, Phone } from "lucide-react"
import { ButtonLink } from "@/components/ui/button"
import { HeroCollage } from "./hero-collage"
import { EMPRESA } from "@/lib/constants"

/**
 * Hero editorial: texto y collage fotográfico como dos zonas asimétricas,
 * sin foto de fondo ni velo oscuro. El contraste del texto viene de vivir
 * en su propio espacio, no de oscurecer una fotografía detrás.
 *
 * El collage (ver hero-collage.tsx) anima su composición al hacer scroll en
 * escritorio; en móvil y con `prefers-reduced-motion` se muestra estático.
 * La sección completa (no solo la columna de fotos) se pinea durante la
 * coreografía, para que texto y collage nunca se desincronicen: se localiza
 * por `data-hero-seccion` en vez de por un ref compartido entre componentes,
 * porque GSAP resuelve el selector en el momento de ejecución del efecto y
 * evita así cualquier problema de orden de montaje entre padre e hijo.
 */
export function Hero({ haySesion }: { haySesion: boolean }) {
  return (
    <section data-hero-seccion className="relative overflow-hidden bg-background">
      <div className="relative mx-auto max-w-7xl px-5 pt-28 pb-16 lg:pb-0 lg:min-h-[100svh] lg:flex lg:items-center">
        <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] gap-10 lg:gap-8 items-center w-full">
          {/* Zona de texto: propio espacio, sin foto detrás */}
          <div className="relative z-10 max-w-xl animar-entrada">
            <p className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-muted border border-border text-muted-foreground text-xs font-medium tracking-wide">
              <Clock className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
              Lunes a sábado · 12:00 – 16:00
            </p>

            <h1 className="mt-6 font-display leading-[1.03] text-balance">
              <span className="block text-4xl sm:text-5xl lg:text-[3.4rem] text-foreground">
                Cocina casera,
              </span>
              <span className="block text-5xl sm:text-6xl lg:text-7xl text-primary mt-1">
                servida cada día
              </span>
              <span className="block text-4xl sm:text-5xl lg:text-[3.4rem] text-foreground mt-1">
                en tu oficina
              </span>
            </h1>

            <p className="mt-7 text-lg text-muted-foreground leading-relaxed max-w-md text-pretty">
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

              <ButtonLink href="#servicio" tamano="lg" variante="secundario">
                Saber más
              </ButtonLink>
            </div>

            {/* Datos de contacto visibles sin buscar, ya en la primera pantalla */}
            <ul className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-sm">
              <li>
                <a
                  href={`tel:${EMPRESA.telefonoLink}`}
                  className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors duration-200 cursor-pointer"
                >
                  <Phone className="w-4 h-4" aria-hidden="true" />
                  {EMPRESA.telefono}
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${EMPRESA.email}`}
                  className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors duration-200 cursor-pointer"
                >
                  <Mail className="w-4 h-4" aria-hidden="true" />
                  {EMPRESA.email}
                </a>
              </li>
              <li className="inline-flex items-center gap-2 text-muted-foreground/70">
                <MapPin className="w-4 h-4" aria-hidden="true" />
                Rubí, Barcelona
              </li>
            </ul>
          </div>

          {/* Zona de collage: en pantallas muy anchas se derrama hacia el
              borde derecho del viewport; en 1024–1280px queda contenido para
              no desbordar (el margen negativo del derrame solo tiene sentido
              cuando sobra viewport más allá del ancho máximo del contenedor) */}
          <div className="relative lg:h-[85vh] lg:min-h-[560px] -mx-5 px-5 lg:mx-0 lg:px-0 xl:-mr-[max(0px,calc((100vw-80rem)/-2))]">
            <HeroCollage />
          </div>
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
