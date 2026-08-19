"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Copy,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Aviso, Card } from "@/components/ui/misc"
import { guardarMenuSemana } from "@/lib/actions/admin"
import { CATEGORIAS, ORDEN_CATEGORIAS } from "@/lib/constants"
import {
  formatearPrecio,
  nombreDia,
  parsearFecha,
  rangoSemana,
} from "@/lib/utils"
import type { Plato } from "@/lib/database.types"

export function EditorMenu({
  dias,
  platos,
  seleccionInicial,
  publicadoInicial,
  anio,
  semana,
  desplazamiento,
  lunes,
}: {
  dias: string[]
  platos: Plato[]
  seleccionInicial: Record<string, string[]>
  publicadoInicial: boolean
  anio: number
  semana: number
  desplazamiento: number
  lunes: string
}) {
  const router = useRouter()
  const [guardando, iniciar] = useTransition()
  const [publicado, setPublicado] = useState(publicadoInicial)
  const [seleccion, setSeleccion] =
    useState<Record<string, string[]>>(seleccionInicial)
  const [resultado, setResultado] = useState<{
    ok: boolean
    mensaje: string
  } | null>(null)

  const [diaActivo, setDiaActivo] = useState(dias[0])

  const platosActivos = platos.filter((p) => p.is_active)
  const delDia = seleccion[diaActivo] ?? []

  function alternar(platoId: string) {
    setResultado(null)
    setSeleccion((prev) => {
      const actuales = prev[diaActivo] ?? []
      return {
        ...prev,
        [diaActivo]: actuales.includes(platoId)
          ? actuales.filter((id) => id !== platoId)
          : [...actuales, platoId],
      }
    })
  }

  /** Copia la selección del día activo al resto de días de la semana. */
  function copiarATodos() {
    setResultado(null)
    setSeleccion((prev) => {
      const copia = { ...prev }
      for (const dia of dias) copia[dia] = [...(prev[diaActivo] ?? [])]
      return copia
    })
  }

  function guardar() {
    setResultado(null)
    iniciar(async () => {
      const items = dias.flatMap((dia) =>
        (seleccion[dia] ?? []).map((plato_id) => ({
          menu_date: dia,
          plato_id,
        })),
      )

      const respuesta = await guardarMenuSemana({
        anio,
        semana,
        publicado,
        items,
      })

      setResultado(respuesta)
      if (respuesta.ok) router.refresh()
    })
  }

  const totalPlatos = dias.reduce(
    (suma, dia) => suma + (seleccion[dia]?.length ?? 0),
    0,
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <Link
          href={`/admin/menus?semana=${desplazamiento - 1}`}
          aria-label="Semana anterior"
          className="w-11 h-11 grid place-items-center rounded-full border border-border hover:bg-muted transition-colors duration-200 cursor-pointer shrink-0"
        >
          <ChevronLeft className="w-4 h-4" aria-hidden="true" />
        </Link>

        <p className="text-center">
          <span className="block font-display text-lg leading-tight">
            {rangoSemana(parsearFecha(lunes))}
          </span>
          <span className="block text-xs text-muted-foreground">
            Semana {semana} de {anio} · {totalPlatos} platos asignados
          </span>
        </p>

        <Link
          href={`/admin/menus?semana=${desplazamiento + 1}`}
          aria-label="Semana siguiente"
          className="w-11 h-11 grid place-items-center rounded-full border border-border hover:bg-muted transition-colors duration-200 cursor-pointer shrink-0"
        >
          <ChevronRight className="w-4 h-4" aria-hidden="true" />
        </Link>
      </div>

      <div
        role="tablist"
        aria-label="Días de la semana"
        className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1"
      >
        {dias.map((dia) => {
          const activo = dia === diaActivo
          const cuantos = seleccion[dia]?.length ?? 0

          return (
            <button
              key={dia}
              role="tab"
              aria-selected={activo}
              onClick={() => setDiaActivo(dia)}
              className={
                "shrink-0 px-4 py-2.5 rounded-xl border text-sm transition-all duration-200 cursor-pointer " +
                (activo
                  ? "border-primary bg-primary/12 text-primary font-medium"
                  : "border-border hover:border-primary/40 hover:bg-muted")
              }
            >
              <span className="flex items-center gap-1.5">
                {nombreDia(dia)}
                {cuantos > 0 && (
                  <span className="ml-0.5 min-w-5 h-5 px-1.5 rounded-full bg-primary text-on-primary text-[0.68rem] font-semibold grid place-items-center">
                    {cuantos}
                  </span>
                )}
              </span>
              <span className="block text-[0.68rem] opacity-70 mt-0.5">
                {parsearFecha(dia).getDate()}{" "}
                {new Intl.DateTimeFormat("es-ES", { month: "short" }).format(
                  parsearFecha(dia),
                )}
              </span>
            </button>
          )
        })}
      </div>

      {resultado && (
        <Aviso tono={resultado.ok ? "exito" : "error"}>
          {resultado.ok ? (
            <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
          ) : (
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
          )}
          <span>{resultado.mensaje}</span>
        </Aviso>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Marca los platos disponibles el {nombreDia(diaActivo).toLowerCase()}.
        </p>

        <Button
          variante="secundario"
          tamano="sm"
          onClick={copiarATodos}
          disabled={delDia.length === 0}
        >
          <Copy className="w-3.5 h-3.5" aria-hidden="true" />
          Copiar a toda la semana
        </Button>
      </div>

      <div className="space-y-6">
        {ORDEN_CATEGORIAS.map((categoria) => {
          const delGrupo = platosActivos.filter((p) => p.categoria === categoria)
          if (delGrupo.length === 0) return null

          return (
            <section key={categoria}>
              <h2 className="font-display text-lg mb-3">
                {CATEGORIAS[categoria]}
              </h2>

              <ul className="grid sm:grid-cols-2 gap-2.5">
                {delGrupo.map((plato) => {
                  const marcado = delDia.includes(plato.id)

                  return (
                    <li key={plato.id}>
                      <label
                        className={
                          "flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-colors duration-200 " +
                          (marcado
                            ? "border-primary bg-primary/8"
                            : "border-border hover:bg-muted")
                        }
                      >
                        <input
                          type="checkbox"
                          checked={marcado}
                          onChange={() => alternar(plato.id)}
                          className="w-4 h-4 mt-0.5 accent-[var(--primary)] cursor-pointer shrink-0"
                        />
                        <span className="min-w-0 flex-1">
                          <span className="flex items-baseline justify-between gap-2">
                            <span className="text-sm font-medium">
                              {plato.nombre}
                            </span>
                            <span className="text-xs text-muted-foreground shrink-0 tabular-nums">
                              {formatearPrecio(plato.price_cents)}
                            </span>
                          </span>
                          {plato.descripcion && (
                            <span className="block mt-0.5 text-xs text-muted-foreground line-clamp-2">
                              {plato.descripcion}
                            </span>
                          )}
                        </span>
                      </label>
                    </li>
                  )
                })}
              </ul>
            </section>
          )
        })}
      </div>

      <Card className="p-5 sticky bottom-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <label className="flex items-center gap-2.5 text-sm cursor-pointer select-none">
            <input
              type="checkbox"
              checked={publicado}
              onChange={(e) => setPublicado(e.target.checked)}
              className="w-4 h-4 accent-[var(--primary)] cursor-pointer"
            />
            <span>
              <span className="font-medium">Publicado</span>
              <span className="block text-xs text-muted-foreground">
                Solo los menús publicados son visibles para los clientes.
              </span>
            </span>
          </label>

          <Button onClick={guardar} disabled={guardando}>
            {guardando ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                Guardando…
              </>
            ) : (
              "Guardar menú"
            )}
          </Button>
        </div>
      </Card>
    </div>
  )
}
