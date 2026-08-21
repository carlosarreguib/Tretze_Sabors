"use client"

import { useActionState, useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Field, SelectField, TextareaField } from "@/components/ui/field"
import { BotonGuardar, Mensajes } from "@/components/ui/formulario"
import { anadirAjuste } from "@/lib/actions/facturacion"
import type { EstadoFormulario } from "@/lib/actions/auth"
import { CATEGORIAS } from "@/lib/constants"
import { aFechaISO } from "@/lib/utils"

const ESTADO_INICIAL: EstadoFormulario = {}

/**
 * Formulario inline para añadir un ajuste manual (descuento, suplemento,
 * correccion) a una factura en borrador. Solo visible mientras la factura
 * esta en borrador: el trigger de la base de datos lo bloquearia igualmente.
 *
 * Sigue el mismo patrón useActionState + Mensajes/BotonGuardar que el resto
 * de formularios de la app (ver components/panel/formulario-cuenta.tsx), lo
 * que da errores por campo en vez de un único mensaje genérico.
 */
export function FormularioAjuste({ facturaId }: { facturaId: string }) {
  const [abierto, setAbierto] = useState(false)
  const accion = anadirAjuste.bind(null, facturaId)
  const [estado, ejecutar] = useActionState(accion, ESTADO_INICIAL)

  if (!abierto) {
    return (
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="inline-flex items-center gap-1.5 h-9 px-3 rounded-full text-sm border border-border hover:bg-muted transition-colors duration-200 cursor-pointer"
      >
        <Plus className="w-3.5 h-3.5" aria-hidden="true" />
        Añadir ajuste
      </button>
    )
  }

  return (
    <form action={ejecutar} className="mt-3 p-4 rounded-xl border border-border space-y-4" noValidate>
      <Mensajes estado={estado} />

      <div className="grid sm:grid-cols-2 gap-4">
        <Field
          name="fecha"
          label="Fecha"
          type="date"
          defaultValue={aFechaISO(new Date())}
          required
          error={estado.errores?.fecha}
        />
        <SelectField
          name="categoria"
          label="Categoría (opcional)"
          defaultValue=""
          error={estado.errores?.categoria}
        >
          <option value="">Sin categoría</option>
          {Object.entries(CATEGORIAS).map(([valor, etiqueta]) => (
            <option key={valor} value={valor}>
              {etiqueta}
            </option>
          ))}
        </SelectField>
      </div>

      <TextareaField
        name="descripcion"
        label="Descripción"
        rows={2}
        placeholder="Descuento por incidencia, suplemento de entrega…"
        required
        error={estado.errores?.descripcion}
      />

      <div className="grid sm:grid-cols-2 gap-4">
        <Field
          name="quantity"
          label="Cantidad"
          type="number"
          min={1}
          max={500}
          defaultValue={1}
          required
          error={estado.errores?.quantity}
        />
        <Field
          name="precio_euros"
          label="Importe unitario (€)"
          type="text"
          inputMode="decimal"
          placeholder="-10,00"
          ayuda="Negativo para descuentos, positivo para suplementos."
          required
          error={estado.errores?.precio_euros}
        />
      </div>

      <div className="flex gap-2">
        <BotonGuardar>Guardar ajuste</BotonGuardar>
        <Button type="button" variante="secundario" tamano="sm" onClick={() => setAbierto(false)}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
