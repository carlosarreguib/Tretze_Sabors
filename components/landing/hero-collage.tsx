"use client"

import { useRef } from "react"
import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { FOTOS_HERO, FOTOS_HERO_MOVIL, type FotoCollage } from "./hero-collage-data"
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion"

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, useGSAP)
}

/**
 * Collage fotográfico del Hero con narrativa de scroll "desorden → orden".
 *
 * Las fotos arrancan dispersas como una mesa recién servida y, al hacer scroll,
 * convergen en una cuadrícula editorial ordenada — eco visual de "comida
 * organizada y puntual cada día". Un único ScrollTrigger con pin+scrub anima
 * `x/y/rotate/scale` (todo GPU-accelerated vía transform, nunca top/left/width)
 * para mantener el scroll fluido incluso en móviles de gama media.
 *
 * Se fija (pin) el `<section>` completo del Hero, localizado por el atributo
 * `data-hero-seccion` — no un ref compartido entre componentes padre/hijo,
 * que en la práctica podía no estar aún asignado cuando useGSAP se ejecuta
 * en el hijo. Resolver el elemento con un selector dentro del propio efecto
 * de GSAP elimina cualquier dependencia del orden de montaje entre
 * componentes. Así, texto y collage se pinean juntos y nunca se
 * desincronizan, en vez de fijar solo la columna de fotos mientras el texto
 * se desplaza con el scroll normal.
 *
 * El JSX es siempre idéntico entre servidor y cliente: todas las fotos nacen
 * en su posición "disperso" en el marcado, sin condicionar el render a
 * `prefers-reduced-motion` (que el servidor no puede conocer). Cambiar qué
 * se renderiza según ese dato produce un mismatch de hidratación garantizado
 * — React descarta el árbol del cliente y se queda con el del servidor, lo
 * que aquí habría hecho que la página siempre naciera ya en la composición
 * final. En su lugar, la preferencia de movimiento reducido se aplica solo
 * dentro del efecto de GSAP (que corre exclusivamente en cliente, después
 * del montaje): coloca las fotos directamente en "orden" sin animar, o deja
 * que el usuario las vea nacer dispersas y las anima con el scroll.
 */
export function HeroCollage() {
  const collageRef = useRef<HTMLDivElement>(null)
  const reducido = useReducedMotion()

  useGSAP(
    () => {
      const fotos = gsap.utils.toArray<HTMLElement>("[data-foto-collage]")
      if (fotos.length === 0) return

      if (reducido) {
        // Movimiento reducido: salta directo a la composición final, sin tween.
        fotos.forEach((el) => {
          const orden = JSON.parse(el.dataset.orden!)
          gsap.set(el, { left: orden.left, top: orden.top, width: orden.width, rotate: orden.rotate })
        })
        return
      }

      const mm = gsap.matchMedia()

      // Solo en pantallas amplias: en tablet/móvil el pin de scroll compite
      // mal con el scroll táctil nativo y la coreografía no cabe con calidad.
      mm.add("(min-width: 1024px)", () => {
        const seccion = document.querySelector<HTMLElement>("[data-hero-seccion]")
        if (!seccion) return

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: seccion,
            start: "top top",
            end: "+=100%",
            scrub: 1,
            pin: true,
            anticipatePin: 1,
            invalidateOnRefresh: true,
          },
        })

        fotos.forEach((el) => {
          const orden = JSON.parse(el.dataset.orden!)
          tl.to(
            el,
            {
              left: orden.left,
              top: orden.top,
              width: orden.width,
              rotate: orden.rotate,
              duration: 1,
              ease: "power2.inOut",
            },
            0,
          )
        })

        return () => {
          tl.scrollTrigger?.kill()
          tl.kill()
        }
      })

      return () => mm.revert()
    },
    { scope: collageRef, dependencies: [reducido] },
  )

  return (
    <div ref={collageRef} className="relative w-full h-full">
      {/* Desktop/tablet ancho: collage con narrativa de scroll. Nace siempre
          disperso; GSAP decide tras el montaje si lo anima o lo fija en orden. */}
      <div className="relative hidden lg:block w-full h-full">
        {FOTOS_HERO.map((foto) => (
          <FotoFlotante key={foto.id} foto={foto} />
        ))}
      </div>

      {/* Móvil/tablet estrecho: collage compacto y estático, sin scroll-jacking */}
      <div className="lg:hidden">
        <CollageEstatico fotos={FOTOS_HERO_MOVIL} />
      </div>
    </div>
  )
}

function FotoFlotante({ foto }: { foto: FotoCollage }) {
  // Siempre nace en "disperso": es el único estado que servidor y cliente
  // pueden coincidir en pintar sin conocer prefers-reduced-motion.
  const pos = foto.disperso
  const acentoClase =
    foto.acento === "primary"
      ? "before:bg-primary/18"
      : foto.acento === "accent"
        ? "before:bg-accent/18"
        : ""

  return (
    <div
      data-foto-collage
      data-orden={JSON.stringify(foto.orden)}
      className={`absolute rounded-2xl overflow-hidden shadow-xl transition-shadow duration-300 ${
        foto.acento
          ? `before:absolute before:-inset-3 before:-z-10 before:rounded-3xl before:content-[''] ${acentoClase}`
          : ""
      }`}
      style={{
        top: pos.top,
        left: pos.left,
        width: pos.width,
        aspectRatio: "4 / 3",
        transform: `rotate(${pos.rotate}deg)`,
        zIndex: pos.z,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={foto.src}
        alt=""
        className="w-full h-full object-cover"
        style={{ objectPosition: foto.posicionFoco }}
        loading="eager"
        decoding="async"
      />
    </div>
  )
}

/**
 * Composición fija sin animación de scroll: usada en móvil y tablet estrecha.
 *
 * En vez de reutilizar las coordenadas absolutas pensadas para el lienzo de
 * escritorio (que no encajan en un contenedor de otras proporciones), usa un
 * grid CSS normal: una foto grande arriba y dos pequeñas debajo, con leve
 * rotación alterna para conservar el carácter de collage sin arriesgar
 * desbordes ni solapes en ningún ancho de pantalla.
 */
function CollageEstatico({ fotos }: { fotos: FotoCollage[] }) {
  const [grande, ...resto] = fotos

  return (
    <div className="grid grid-cols-2 gap-3 animar-suave">
      {grande && <FotoCompacta foto={grande} className="col-span-2 aspect-[16/9] -rotate-1" />}
      {resto.map((foto, i) => (
        <FotoCompacta
          key={foto.id}
          foto={foto}
          className={`aspect-[4/3] ${i % 2 === 0 ? "rotate-1" : "-rotate-1"}`}
        />
      ))}
    </div>
  )
}

function FotoCompacta({ foto, className }: { foto: FotoCollage; className: string }) {
  const acentoClase =
    foto.acento === "primary"
      ? "before:bg-primary/18"
      : foto.acento === "accent"
        ? "before:bg-accent/18"
        : ""

  return (
    <div
      className={`relative rounded-2xl overflow-hidden shadow-lg ${className} ${
        foto.acento
          ? `before:absolute before:-inset-2 before:-z-10 before:rounded-2xl before:content-[''] ${acentoClase}`
          : ""
      }`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={foto.src}
        alt=""
        className="w-full h-full object-cover"
        style={{ objectPosition: foto.posicionFoco }}
        loading="eager"
        decoding="async"
      />
    </div>
  )
}
