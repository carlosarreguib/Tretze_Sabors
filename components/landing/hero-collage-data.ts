/**
 * Configuración del collage fotográfico del Hero.
 *
 * Cada foto define dos estados: `disperso` (posición inicial, tipo mesa
 * desordenada) y `orden` (posición final tras el scroll, grid editorial).
 * Los valores son porcentajes relativos al contenedor del collage, así que
 * la composición escala igual en cualquier tamaño de pantalla donde se use.
 *
 * Las imágenes son fotografías de archivo de cocina mediterránea, usadas
 * como marcador de posición hasta disponer de fotografías reales de los
 * platos de Tretze Sabors — el sistema de posiciones no depende de qué
 * ingrediente concreto aparece en cada foto, así que sustituir los ficheros
 * más adelante no rompe la composición.
 */

export type FotoCollage = {
  id: string
  src: string
  /** Punto focal para object-position, evita recortes feos en fotos densas */
  posicionFoco: string
  disperso: {
    top: string
    left: string
    width: string
    rotate: number
    z: number
  }
  orden: {
    top: string
    left: string
    width: string
    rotate: number
    z: number
  }
  /** Si lleva una tarjeta de color sólido detrás (acento de collage editorial) */
  acento?: "primary" | "accent"
}

export const FOTOS_HERO: FotoCollage[] = [
  {
    id: "paella",
    src: "/fotos/collage-06-paella.jpg",
    posicionFoco: "50% 40%",
    disperso: { top: "4%", left: "52%", width: "34%", rotate: -6, z: 3 },
    orden: { top: "6%", left: "60%", width: "38%", rotate: 0, z: 2 },
    acento: "primary",
  },
  {
    id: "salmon-verduras",
    src: "/fotos/collage-03-salmon-verduras.jpg",
    posicionFoco: "50% 45%",
    disperso: { top: "38%", left: "66%", width: "30%", rotate: 5, z: 2 },
    orden: { top: "6%", left: "0%", width: "54%", rotate: 0, z: 1 },
  },
  {
    id: "ensalada",
    src: "/fotos/collage-04-ensalada.jpg",
    posicionFoco: "45% 40%",
    disperso: { top: "6%", left: "12%", width: "24%", rotate: 8, z: 1 },
    orden: { top: "56%", left: "60%", width: "18%", rotate: 0, z: 2 },
  },
  {
    id: "mesa-frutas",
    src: "/fotos/collage-02-mesa-frutas.jpg",
    posicionFoco: "50% 55%",
    disperso: { top: "58%", left: "8%", width: "26%", rotate: -4, z: 2 },
    orden: { top: "56%", left: "0%", width: "24%", rotate: 0, z: 1 },
    acento: "accent",
  },
  {
    id: "pescado-mesa",
    src: "/fotos/collage-05-pescado-mesa.jpg",
    posicionFoco: "50% 45%",
    disperso: { top: "66%", left: "44%", width: "22%", rotate: 7, z: 1 },
    orden: { top: "56%", left: "80%", width: "20%", rotate: 0, z: 1 },
  },
]

/** Subconjunto reducido para móvil: collage estático, sin pin de scroll. */
export const FOTOS_HERO_MOVIL = FOTOS_HERO.slice(0, 3)
