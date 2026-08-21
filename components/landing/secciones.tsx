import {
  ArrowRight,
  ChefHat,
  Clock,
  Flame,
  HeartHandshake,
  Leaf,
  Soup,
  Truck,
  UtensilsCrossed,
} from "lucide-react"
import { ButtonLink } from "@/components/ui/button"
import { Card, Kicker } from "@/components/ui/misc"
import { EMPRESA } from "@/lib/constants"
import { formatearPrecio } from "@/lib/utils"
import type { Plato } from "@/lib/database.types"

const COMO_FUNCIONA = [
  {
    icono: UtensilsCrossed,
    titulo: "Elegís el menú",
    texto:
      "Cada semana publicamos los platos de lunes a sábado. Vuestro equipo elige desde el panel, día a día.",
  },
  {
    icono: ChefHat,
    titulo: "Cocinamos por la mañana",
    texto:
      "Producto fresco de mercado, recetas de siempre y nada de precocinados. Se cocina el mismo día que se sirve.",
  },
  {
    icono: Truck,
    titulo: "Llega caliente y puntual",
    texto:
      "Repartimos en la franja que hayáis reservado, entre las 12:00 y las 16:00, en recipientes isotérmicos.",
  },
]

const VALORES = [
  {
    icono: Leaf,
    titulo: "Fresca",
    texto:
      "Compramos cada mañana y cocinamos ese mismo día. Sin congelados ni platos preparados el día anterior.",
  },
  {
    icono: Soup,
    titulo: "Tradicional",
    texto:
      "Guisos de cuchara, pescados al horno y postres caseros. Las recetas de toda la vida, sin reinterpretaciones.",
  },
  {
    icono: Clock,
    titulo: "Fiable",
    texto:
      "Reserváis una franja y la cumplimos. Si algún día no pudiéramos llegar a tiempo, os avisamos antes.",
  },
]

export function Servicio() {
  return (
    <section id="servicio" className="py-24 sm:py-32 bg-background">
      <div className="mx-auto max-w-6xl px-5">
        <div className="max-w-2xl">
          <Kicker>Cómo funciona</Kicker>
          <h2 className="font-display text-4xl sm:text-5xl text-balance">
            Un servicio pensado para el día a día de una oficina
          </h2>
          <p className="mt-5 text-lg text-muted-foreground leading-relaxed text-pretty">
            Sin llamadas cada mañana ni listas por WhatsApp. Vuestro equipo
            organiza la semana entera en unos minutos y nosotros nos ocupamos
            del resto.
          </p>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-3 animar-lista">
          {COMO_FUNCIONA.map(({ icono: Icono, titulo, texto }, i) => (
            <Card key={titulo} className="p-7">
              <div className="flex items-center gap-3">
                <span className="w-11 h-11 rounded-xl bg-primary/12 grid place-items-center shrink-0">
                  <Icono className="w-5 h-5 text-primary" aria-hidden="true" />
                </span>
                <span
                  className="font-display text-3xl text-border"
                  aria-hidden="true"
                >
                  0{i + 1}
                </span>
              </div>
              <h3 className="mt-5 font-display text-xl">{titulo}</h3>
              <p className="mt-2.5 text-sm text-muted-foreground leading-relaxed">
                {texto}
              </p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

/** Muestra platos reales del catálogo como escaparate de la cocina. */
export function MenuMuestra({ platos }: { platos: Plato[] }) {
  if (platos.length === 0) return null

  return (
    <section id="menu" className="py-24 sm:py-32 bg-muted/45">
      <div className="mx-auto max-w-6xl px-5">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-xl">
            <Kicker>La cocina</Kicker>
            <h2 className="font-display text-4xl sm:text-5xl text-balance">
              Algunos de nuestros platos
            </h2>
            <p className="mt-5 text-lg text-muted-foreground leading-relaxed text-pretty">
              El menú cambia cada semana según el mercado y la temporada. Esto
              es una muestra de lo que sale de nuestra cocina.
            </p>
          </div>

          <ButtonLink href="/registro" variante="secundario" className="group">
            Ver el menú completo
            <ArrowRight
              className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </ButtonLink>
        </div>

        <ul className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 animar-lista">
          {platos.map((plato) => (
            <li key={plato.id}>
              <Card className="h-full overflow-hidden group">
                {/* Espacio reservado para la foto: evita saltos de layout (CLS) */}
                <div className="aspect-[16/10] fondo-calido relative overflow-hidden">
                  {plato.image_path && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={plato.image_path}
                      alt=""
                      loading="lazy"
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  )}
                </div>

                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-display text-lg leading-snug">
                      {plato.nombre}
                    </h3>
                    <span className="text-sm font-semibold text-primary shrink-0 tabular-nums">
                      {formatearPrecio(plato.price_cents)}
                    </span>
                  </div>

                  {plato.descripcion && (
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed line-clamp-3">
                      {plato.descripcion}
                    </p>
                  )}

                  {plato.alergenos.length > 0 && (
                    <p className="mt-3 text-xs text-muted-foreground">
                      <span className="font-medium">Alérgenos:</span>{" "}
                      {plato.alergenos.join(", ")}
                    </p>
                  )}
                </div>
              </Card>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

export function Nosotros() {
  return (
    <section id="nosotros" className="py-24 sm:py-32 bg-background">
      <div className="mx-auto max-w-6xl px-5">
        <div className="grid gap-14 lg:grid-cols-2 lg:gap-20 items-start">
          <div>
            <Kicker>Nosotros</Kicker>
            <h2 className="font-display text-4xl sm:text-5xl text-balance">
              Trece sabores, una misma manera de cocinar
            </h2>

            <div className="mt-6 space-y-4 text-muted-foreground leading-relaxed">
              <p>
                Tretze Sabors nació en Rubí de una idea sencilla: que quien come
                fuera de casa por trabajo no tenga que renunciar a comer bien.
                Ni tuppers recalentados ni menús industriales; comida de verdad,
                de la que se cocina despacio.
              </p>
              <p>
                Cada mañana compramos el género, encendemos los fogones y
                preparamos los platos del día. Guisos que necesitan sus horas,
                caldos hechos con hueso y postres que salen del horno, no de un
                envase.
              </p>
              <p>
                Hoy damos de comer cada día a oficinas y empresas de Rubí y
                alrededores. Seguimos cocinando exactamente igual que el primer
                día, solo que para más gente.
              </p>
            </div>

            <div className="mt-9 flex items-center gap-3 p-4 rounded-2xl bg-muted border border-border">
              <HeartHandshake
                className="w-5 h-5 text-primary shrink-0"
                aria-hidden="true"
              />
              <p className="text-sm">
                <span className="font-medium">Garantía de comida caliente.</span>{" "}
                Si un pedido no llega en condiciones, no se cobra.
              </p>
            </div>
          </div>

          <ul className="space-y-5 animar-lista">
            {VALORES.map(({ icono: Icono, titulo, texto }) => (
              <li key={titulo}>
                <Card className="p-7 flex gap-5">
                  <span className="w-11 h-11 rounded-xl bg-primary/12 grid place-items-center shrink-0">
                    <Icono className="w-5 h-5 text-primary" aria-hidden="true" />
                  </span>
                  <div>
                    <h3 className="font-display text-xl">{titulo}</h3>
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                      {texto}
                    </p>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}

export function LlamadaFinal({ haySesion }: { haySesion: boolean }) {
  return (
    <section className="py-24 sm:py-28">
      <div className="mx-auto max-w-6xl px-5">
        <div className="relative overflow-hidden rounded-3xl fondo-calido px-8 py-16 sm:px-14 sm:py-20 text-center">
          <div className="relative max-w-2xl mx-auto">
            <Flame
              className="w-9 h-9 text-white/80 mx-auto"
              aria-hidden="true"
            />
            <h2 className="mt-6 font-display text-4xl sm:text-5xl text-white text-balance">
              ¿Empezamos esta semana?
            </h2>
            <p className="mt-5 text-lg text-white/80 leading-relaxed text-pretty">
              Cuéntanos cuántos sois y en qué franja os viene bien comer.
              Preparamos una propuesta a medida sin compromiso.
            </p>

            <div className="mt-9 flex flex-col sm:flex-row gap-3 justify-center">
              <ButtonLink
                href={haySesion ? "/panel" : "/registro"}
                tamano="lg"
                variante="secundario"
                className="bg-white/10 text-white border-white/25 hover:bg-white/20 backdrop-blur-sm"
              >
                {haySesion ? "Ir a mi panel" : "Crear cuenta de empresa"}
              </ButtonLink>
              <ButtonLink
                href={`tel:${EMPRESA.telefonoLink}`}
                tamano="lg"
                variante="secundario"
                className="bg-white/10 text-white border-white/25 hover:bg-white/20 backdrop-blur-sm"
              >
                Hablar con nosotros
              </ButtonLink>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
