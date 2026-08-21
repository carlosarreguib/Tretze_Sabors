import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { rangoMes } from "@/lib/utils"

/** Selector de mes con flechas prev/siguiente. Mismo patron que el selector de semana del pedido. */
export function SelectorMes({
  desplazamiento,
  fecha,
  base,
  limite = 0,
}: {
  desplazamiento: number
  fecha: Date
  base: string
  limite?: number
}) {
  return (
    <div className="flex items-center justify-between gap-3 mb-6">
      <Link
        href={`${base}?mes=${desplazamiento - 1}`}
        aria-label="Mes anterior"
        className="w-11 h-11 grid place-items-center rounded-full border border-border hover:bg-muted transition-colors duration-200 cursor-pointer shrink-0"
      >
        <ChevronLeft className="w-4 h-4" aria-hidden="true" />
      </Link>

      <p className="text-center">
        <span className="block font-display text-lg leading-tight">
          {rangoMes(fecha)}
        </span>
        <span className="block text-xs text-muted-foreground">
          {desplazamiento === 0 ? "Este mes" : "Mes cerrado"}
        </span>
      </p>

      {desplazamiento < limite ? (
        <Link
          href={`${base}?mes=${desplazamiento + 1}`}
          aria-label="Mes siguiente"
          className="w-11 h-11 grid place-items-center rounded-full border border-border hover:bg-muted transition-colors duration-200 cursor-pointer shrink-0"
        >
          <ChevronRight className="w-4 h-4" aria-hidden="true" />
        </Link>
      ) : (
        <span
          aria-hidden="true"
          className="w-11 h-11 grid place-items-center rounded-full border border-border opacity-35 shrink-0"
        >
          <ChevronRight className="w-4 h-4" />
        </span>
      )}
    </div>
  )
}
