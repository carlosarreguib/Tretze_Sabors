"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useMemo, useState, useTransition } from "react"
import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Lock,
  Minus,
  Plus,
  ShoppingBasket,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Aviso, Card } from "@/components/ui/misc"
import { guardarPedidoDia } from "@/lib/actions/pedidos"
import {
  CATEGORIAS,
  ORDEN_CATEGORIAS,
} from "@/lib/constants"
import {
  nombreDia,
  parsearFecha,
  rangoSemana,
} from "@/lib/utils"
import type { Categoria, Pedido, PedidoItem, Plato } from "@/lib/database.types"

type PlatoDelDia = { fecha: string; plato: Plato }
type PedidoConItems = Pedido & { pedido_items: PedidoItem[] }

/** Estado del formulario de un día: cantidades por plato y notas. */
type EstadoDia = {
  cantidades: Record<string, number>
  notas: string
}

export function PedidoSemanal({
  dias,
  platosPorDia,
  pedidos,
  editables,
  desplazamiento,
  lunes,
  direccion,
}: {
  dias: string[]
  platosPorDia: PlatoDelDia[]
  pedidos: PedidoConItems[]
  editables: Record<string, boolean>
  desplazamiento: number
  lunes: string
  direccion: string | null
}) {
  const router = useRouter()
  const [guardando, iniciarGuardado] = useTransition()

  // Primer día que aún se puede pedir; si ya pasaron todos, el lunes.
  const [diaActivo, setDiaActivo] = useState(
    () => dias.find((d) => editables[d]) ?? dias[0],
  )
  const [resultado, setResultado] = useState<{
    ok: boolean
    mensaje: string
  } | null>(null)

  function calcularEstadoInicial() {
    const inicial: Record<string, EstadoDia> = {}
    for (const dia of dias) {
      const pedido = pedidos.find((p) => p.delivery_date === dia)
      const cantidades: Record<string, number> = {}
      for (const item of pedido?.pedido_items ?? []) {
        cantidades[item.plato_id] = item.quantity
      }
      inicial[dia] = {
        cantidades,
        notas: pedido?.notes ?? "",
      }
    }
    return inicial
  }

  const [estado, setEstado] = useState(calcularEstadoInicial)

  // `dias`/`pedidos` cambian al navegar entre semanas sin que el componente
  // se desmonte, así que `diaActivo` y `estado` (ambos con useState
  // perezoso, que solo corre en el primer montaje) quedarían con datos de la
  // semana anterior. Se detecta el cambio de semana durante el render y se
  // resetea el estado ahí mismo, siguiendo el patrón de React para derivar
  // estado de props sin usar un efecto.
  const [diasPrevios, setDiasPrevios] = useState(dias)
  if (dias !== diasPrevios) {
    setDiasPrevios(dias)
    setEstado(calcularEstadoInicial())
    setDiaActivo((prev) =>
      dias.includes(prev) ? prev : dias.find((d) => editables[d]) ?? dias[0],
    )
  }

  const platosDelDia = useMemo(() => {
    const mapa = new Map<string, Plato[]>()
    for (const { fecha, plato } of platosPorDia) {
      const lista = mapa.get(fecha) ?? []
      lista.push(plato)
      mapa.set(fecha, lista)
    }
    return mapa
  }, [platosPorDia])

  const actual = estado[diaActivo]
  // Memoizado para no invalidar los useMemo de abajo: sin esto, cuando el
  // Map no tiene entrada para el día, `?? []` crea un array nuevo en cada
  // render y rompe la comparación de dependencias.
  const platos = useMemo(
    () => platosDelDia.get(diaActivo) ?? [],
    [platosDelDia, diaActivo],
  )
  const editable = editables[diaActivo] ?? false
  const pedidoExistente = pedidos.find((p) => p.delivery_date === diaActivo)

  const porCategoria = useMemo(() => {
    const mapa = new Map<Categoria, Plato[]>()
    for (const plato of platos) {
      const lista = mapa.get(plato.categoria) ?? []
      lista.push(plato)
      mapa.set(plato.categoria, lista)
    }
    return mapa
  }, [platos])

  const lineas = useMemo(
    () =>
      platos
        .filter((p) => (actual?.cantidades[p.id] ?? 0) > 0)
        .map((p) => ({
          plato: p,
          cantidad: actual!.cantidades[p.id],
        })),
    [platos, actual],
  )

  function cambiarCantidad(platoId: string, delta: number) {
    setResultado(null)
    setEstado((prev) => {
      const dia = prev[diaActivo]
      const actualCantidad = dia.cantidades[platoId] ?? 0
      const nueva = Math.max(0, Math.min(500, actualCantidad + delta))

      const cantidades = { ...dia.cantidades }
      if (nueva === 0) delete cantidades[platoId]
      else cantidades[platoId] = nueva

      return { ...prev, [diaActivo]: { ...dia, cantidades } }
    })
  }

  function guardar() {
    setResultado(null)
    iniciarGuardado(async () => {
      const items = Object.entries(actual.cantidades).map(
        ([plato_id, quantity]) => ({ plato_id, quantity }),
      )

      const respuesta = await guardarPedidoDia({
        delivery_date: diaActivo,
        slot_start: "13:00",
        notes: actual.notas || undefined,
        items,
      })

      setResultado(respuesta)
      if (respuesta.ok) router.refresh()
    })
  }

  return (
    <div className="space-y-6">
      {/* Selector de semana */}
      <div className="flex items-center justify-between gap-3">
        <Link
          href={`/panel?semana=${desplazamiento - 1}`}
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
            {desplazamiento === 0
              ? "Esta semana"
              : desplazamiento === 1
                ? "Semana que viene"
                : `${desplazamiento > 0 ? "En" : "Hace"} ${Math.abs(desplazamiento)} semanas`}
          </span>
        </p>

        <Link
          href={`/panel?semana=${desplazamiento + 1}`}
          aria-label="Semana siguiente"
          className="w-11 h-11 grid place-items-center rounded-full border border-border hover:bg-muted transition-colors duration-200 cursor-pointer shrink-0"
        >
          <ChevronRight className="w-4 h-4" aria-hidden="true" />
        </Link>
      </div>

      {/* Pestañas de día. Scroll horizontal en móvil, nunca desborda la página. */}
      <div
        role="tablist"
        aria-label="Días de la semana"
        className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1"
      >
        {dias.map((dia) => {
          const activo = dia === diaActivo
          const cerrado = !editables[dia]
          const unidades = Object.values(estado[dia]?.cantidades ?? {}).reduce(
            (s, n) => s + n,
            0,
          )

          return (
            <button
              key={dia}
              role="tab"
              aria-selected={activo}
              onClick={() => {
                setDiaActivo(dia)
                setResultado(null)
              }}
              className={
                "shrink-0 px-4 py-2.5 rounded-xl border text-sm transition-all duration-200 cursor-pointer " +
                (activo
                  ? "border-primary bg-primary/12 text-primary font-medium"
                  : "border-border hover:border-primary/40 hover:bg-muted")
              }
            >
              <span className="flex items-center gap-1.5">
                {cerrado && (
                  <Lock className="w-3 h-3 opacity-60" aria-hidden="true" />
                )}
                {nombreDia(dia)}
                {unidades > 0 && (
                  <span className="ml-0.5 min-w-5 h-5 px-1.5 rounded-full bg-primary text-on-primary text-[0.68rem] font-semibold grid place-items-center">
                    {unidades}
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

      {!editable && (
        <Aviso>
          <Lock className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
          <span>
            El plazo para pedir el {nombreDia(diaActivo).toLowerCase()} ya se ha
            cerrado. Los pedidos se cierran a las 17:00 del día anterior.{" "}
            <a
              href="tel:+34667518857"
              className="underline hover:text-foreground cursor-pointer"
            >
              Llámanos
            </a>{" "}
            si necesitas algo para ese día.
          </span>
        </Aviso>
      )}

      {!direccion && (
        <Aviso tono="error">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
          <span>
            Todavía no has indicado la dirección de entrega.{" "}
            <Link
              href="/panel/cuenta"
              className="underline font-medium cursor-pointer"
            >
              Añádela en tu cuenta
            </Link>{" "}
            para que podamos repartir.
          </span>
        </Aviso>
      )}

      <div className="grid lg:grid-cols-[1fr_20rem] gap-6 items-start">
        {/* Carta del día */}
        <div className="space-y-6 min-w-0">
          {ORDEN_CATEGORIAS.filter((c) => porCategoria.has(c)).map(
            (categoria) => (
              <section key={categoria}>
                <h2 className="font-display text-xl mb-3">
                  {CATEGORIAS[categoria]}
                </h2>

                <ul className="space-y-2.5">
                  {porCategoria.get(categoria)!.map((plato) => {
                    const cantidad = actual?.cantidades[plato.id] ?? 0

                    return (
                      <li key={plato.id}>
                        <Card
                          className={
                            "p-4 flex gap-4 items-start transition-colors duration-200 " +
                            (cantidad > 0 ? "border-primary/45" : "")
                          }
                        >
                          <div className="min-w-0 flex-1">
                            <h3 className="font-medium leading-snug">
                              {plato.nombre}
                            </h3>

                            {plato.descripcion && (
                              <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                                {plato.descripcion}
                              </p>
                            )}

                            {plato.alergenos.length > 0 && (
                              <p className="mt-2 text-xs text-muted-foreground">
                                <span className="font-medium">Alérgenos:</span>{" "}
                                {plato.alergenos.join(", ")}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => cambiarCantidad(plato.id, -1)}
                              disabled={!editable || cantidad === 0}
                              aria-label={`Quitar una unidad de ${plato.nombre}`}
                              className="w-9 h-9 grid place-items-center rounded-lg border border-border hover:bg-muted disabled:opacity-35 disabled:cursor-not-allowed transition-colors duration-200 cursor-pointer"
                            >
                              <Minus className="w-3.5 h-3.5" aria-hidden="true" />
                            </button>

                            <span
                              aria-live="polite"
                              className="w-8 text-center text-sm font-medium tabular-nums"
                            >
                              {cantidad}
                              <span className="solo-lectores">
                                {" "}
                                unidades de {plato.nombre}
                              </span>
                            </span>

                            <button
                              type="button"
                              onClick={() => cambiarCantidad(plato.id, 1)}
                              disabled={!editable}
                              aria-label={`Añadir una unidad de ${plato.nombre}`}
                              className="w-9 h-9 grid place-items-center rounded-lg border border-border hover:bg-muted disabled:opacity-35 disabled:cursor-not-allowed transition-colors duration-200 cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                            </button>
                          </div>
                        </Card>
                      </li>
                    )
                  })}
                </ul>
              </section>
            ),
          )}
        </div>

        {/* Resumen del pedido */}
        <Card className="p-5 lg:sticky lg:top-4">
          <h2 className="font-display text-xl flex items-center gap-2">
            <ShoppingBasket className="w-4 h-4 text-primary" aria-hidden="true" />
            {nombreDia(diaActivo)}
          </h2>

          {lineas.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
              Todavía no has elegido nada para este día.
            </p>
          ) : (
            <ul className="mt-4 space-y-2.5">
              {lineas.map(({ plato, cantidad }) => (
                <li
                  key={plato.id}
                  className="flex justify-between gap-3 text-sm"
                >
                  <span className="min-w-0">
                    <span className="text-muted-foreground tabular-nums">
                      {cantidad}×{" "}
                    </span>
                    {plato.nombre}
                  </span>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-5 space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="notas" className="block text-sm font-medium">
                Notas para la cocina
              </label>
              <textarea
                id="notas"
                rows={2}
                maxLength={500}
                disabled={!editable}
                value={actual?.notas ?? ""}
                placeholder="Alergias, sala de entrega…"
                onChange={(e) =>
                  setEstado((prev) => ({
                    ...prev,
                    [diaActivo]: {
                      ...prev[diaActivo],
                      notas: e.target.value,
                    },
                  }))
                }
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border resize-y placeholder:text-muted-foreground/60 disabled:opacity-60 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring"
              />
            </div>

            <Button
              onClick={guardar}
              disabled={!editable || guardando || lineas.length === 0}
              className="w-full"
            >
              {guardando ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                  Guardando…
                </>
              ) : pedidoExistente ? (
                "Actualizar pedido"
              ) : (
                "Confirmar pedido"
              )}
            </Button>

            {pedidoExistente && (
              <p className="text-xs text-center text-muted-foreground">
                Ya tienes un pedido para este día. Al guardar se sustituye.
              </p>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
