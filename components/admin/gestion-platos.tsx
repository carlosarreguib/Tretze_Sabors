"use client"

import { useActionState, useState, useTransition } from "react"
import { useFormStatus } from "react-dom"
import { useRouter } from "next/navigation"
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Pencil,
  Plus,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Field, SelectField, TextareaField } from "@/components/ui/field"
import { Aviso, Card } from "@/components/ui/misc"
import { alternarPlato, guardarPlato } from "@/lib/actions/admin"
import { ALERGENOS, CATEGORIAS, ORDEN_CATEGORIAS } from "@/lib/constants"
import { formatearPrecio } from "@/lib/utils"
import type { EstadoFormulario } from "@/lib/actions/auth"
import type { Plato } from "@/lib/database.types"

const ESTADO_INICIAL: EstadoFormulario = {}

function BotonGuardar() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
          Guardando…
        </>
      ) : (
        "Guardar plato"
      )}
    </Button>
  )
}

export function GestionPlatos({ platos }: { platos: Plato[] }) {
  const [editando, setEditando] = useState<Plato | null>(null)
  const [creando, setCreando] = useState(false)

  const mostrarFormulario = creando || editando !== null

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {platos.length} {platos.length === 1 ? "plato" : "platos"} en la carta
        </p>

        {!mostrarFormulario && (
          <Button
            onClick={() => {
              setCreando(true)
              setEditando(null)
            }}
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            Nuevo plato
          </Button>
        )}
      </div>

      {mostrarFormulario && (
        <FormularioPlato
          plato={editando}
          alCerrar={() => {
            setCreando(false)
            setEditando(null)
          }}
        />
      )}

      <div className="space-y-8">
        {ORDEN_CATEGORIAS.map((categoria) => {
          const delGrupo = platos.filter((p) => p.categoria === categoria)
          if (delGrupo.length === 0) return null

          return (
            <section key={categoria}>
              <h2 className="font-display text-xl mb-3">
                {CATEGORIAS[categoria]}
              </h2>
              <ul className="space-y-2.5">
                {delGrupo.map((plato) => (
                  <li key={plato.id}>
                    <FilaPlato plato={plato} alEditar={() => setEditando(plato)} />
                  </li>
                ))}
              </ul>
            </section>
          )
        })}
      </div>
    </div>
  )
}

function FilaPlato({
  plato,
  alEditar,
}: {
  plato: Plato
  alEditar: () => void
}) {
  const router = useRouter()
  const [pendiente, iniciar] = useTransition()

  return (
    <Card className={"p-4 " + (plato.is_active ? "" : "opacity-60")}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-medium">{plato.nombre}</h3>
            {!plato.is_active && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                Oculto
              </span>
            )}
          </div>

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

        <div className="flex items-center gap-2 shrink-0">
          <span className="font-display text-lg tabular-nums">
            {formatearPrecio(plato.price_cents)}
          </span>

          <button
            type="button"
            onClick={alEditar}
            aria-label={`Editar ${plato.nombre}`}
            className="w-10 h-10 grid place-items-center rounded-lg border border-border hover:bg-muted transition-colors duration-200 cursor-pointer"
          >
            <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
          </button>

          <button
            type="button"
            disabled={pendiente}
            onClick={() =>
              iniciar(async () => {
                await alternarPlato(plato.id, !plato.is_active)
                router.refresh()
              })
            }
            aria-label={
              plato.is_active
                ? `Ocultar ${plato.nombre} de la carta`
                : `Mostrar ${plato.nombre} en la carta`
            }
            className="w-10 h-10 grid place-items-center rounded-lg border border-border hover:bg-muted disabled:opacity-50 transition-colors duration-200 cursor-pointer"
          >
            {pendiente ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
            ) : plato.is_active ? (
              <Eye className="w-3.5 h-3.5" aria-hidden="true" />
            ) : (
              <EyeOff className="w-3.5 h-3.5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>
    </Card>
  )
}

function FormularioPlato({
  plato,
  alCerrar,
}: {
  plato: Plato | null
  alCerrar: () => void
}) {
  const router = useRouter()
  const [estado, accion] = useActionState(
    async (previo: EstadoFormulario, formData: FormData) => {
      const resultado = await guardarPlato(previo, formData)
      if (resultado.ok) {
        router.refresh()
        alCerrar()
      }
      return resultado
    },
    ESTADO_INICIAL,
  )

  return (
    <Card className="p-6 border-primary/40">
      <div className="flex items-start justify-between gap-3">
        <h2 className="font-display text-xl">
          {plato ? "Editar plato" : "Nuevo plato"}
        </h2>
        <button
          type="button"
          onClick={alCerrar}
          aria-label="Cerrar formulario"
          className="w-9 h-9 grid place-items-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors duration-200 cursor-pointer"
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>

      <form action={accion} className="mt-5 space-y-5" noValidate>
        {plato && <input type="hidden" name="id" value={plato.id} />}

        {estado.mensaje && !estado.ok && (
          <Aviso tono="error">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
            <span>{estado.mensaje}</span>
          </Aviso>
        )}

        {estado.ok && estado.mensaje && (
          <Aviso tono="exito">
            <CheckCircle2
              className="w-4 h-4 mt-0.5 shrink-0"
              aria-hidden="true"
            />
            <span>{estado.mensaje}</span>
          </Aviso>
        )}

        <Field
          name="nombre"
          label="Nombre del plato"
          defaultValue={plato?.nombre ?? ""}
          placeholder="Lentejas estofadas"
          required
          error={estado.errores?.nombre}
        />

        <TextareaField
          name="descripcion"
          label="Descripción"
          rows={2}
          defaultValue={plato?.descripcion ?? ""}
          placeholder="Cómo se prepara y qué lleva"
          error={estado.errores?.descripcion}
        />

        <div className="grid sm:grid-cols-2 gap-5">
          <SelectField
            name="categoria"
            label="Categoría"
            defaultValue={plato?.categoria ?? "primer"}
            error={estado.errores?.categoria}
          >
            {ORDEN_CATEGORIAS.map((c) => (
              <option key={c} value={c}>
                {CATEGORIAS[c]}
              </option>
            ))}
          </SelectField>

          <Field
            name="precio_euros"
            label="Precio (€)"
            type="number"
            step="0.05"
            min="0"
            defaultValue={
              plato ? (plato.price_cents / 100).toFixed(2) : "0.00"
            }
            required
            error={estado.errores?.precio_euros}
          />
        </div>

        <fieldset>
          <legend className="block text-sm font-medium mb-2">Alérgenos</legend>
          <div className="flex flex-wrap gap-2">
            {ALERGENOS.map((alergeno) => (
              <label
                key={alergeno}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm cursor-pointer hover:bg-muted transition-colors duration-200 has-checked:border-primary has-checked:bg-primary/10"
              >
                <input
                  type="checkbox"
                  name="alergenos"
                  value={alergeno}
                  defaultChecked={plato?.alergenos.includes(alergeno)}
                  className="w-4 h-4 accent-[var(--primary)] cursor-pointer"
                />
                {alergeno}
              </label>
            ))}
          </div>
        </fieldset>

        <label className="flex items-center gap-2.5 text-sm cursor-pointer select-none">
          <input
            type="checkbox"
            name="is_active"
            defaultChecked={plato?.is_active ?? true}
            className="w-4 h-4 accent-[var(--primary)] cursor-pointer"
          />
          Visible en la carta
        </label>

        <div className="flex gap-3 pt-1">
          <BotonGuardar />
          <Button type="button" variante="secundario" onClick={alCerrar}>
            Cancelar
          </Button>
        </div>
      </form>
    </Card>
  )
}
