"use client"

import { useActionState } from "react"
import { Field, TextareaField } from "@/components/ui/field"
import { Card } from "@/components/ui/misc"
import { BotonGuardar, Mensajes } from "@/components/ui/formulario"
import { guardarPreciosEmpresa } from "@/lib/actions/precios"
import type { EstadoFormulario } from "@/lib/actions/auth"
import type { CompanyPrice } from "@/lib/database.types"

const ESTADO_INICIAL: EstadoFormulario = {}

function centimosAEuros(cents: number): string {
  return (cents / 100).toFixed(2)
}

export function FormularioPreciosEmpresa({
  profileId,
  precios,
}: {
  profileId: string
  precios: CompanyPrice | null
}) {
  const [estado, ejecutar] = useActionState(guardarPreciosEmpresa, ESTADO_INICIAL)

  return (
    <Card className="p-6">
      <h2 className="font-display text-xl">Precios acordados</h2>
      <p className="mt-1.5 text-sm text-muted-foreground">
        Precio negociado con esta empresa para el menú completo y el medio menú.
        No son visibles para el cliente.
      </p>

      <form action={ejecutar} className="mt-6 space-y-5" noValidate>
        <Mensajes estado={estado} />

        <input type="hidden" name="profile_id" value={profileId} />

        <div className="grid sm:grid-cols-2 gap-5">
          <Field
            name="precio_menu_euros"
            label="Menú completo (€)"
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            defaultValue={precios ? centimosAEuros(precios.precio_menu_cents) : "0.00"}
            required
            error={estado.errores?.precio_menu_euros}
          />
          <Field
            name="precio_medio_menu_euros"
            label="Medio menú (€)"
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            defaultValue={precios ? centimosAEuros(precios.precio_medio_menu_cents) : "0.00"}
            required
            error={estado.errores?.precio_medio_menu_euros}
          />
        </div>

        <TextareaField
          name="notas"
          label="Notas"
          rows={2}
          defaultValue={precios?.notas ?? ""}
          placeholder="Condiciones especiales, descuentos, observaciones…"
          error={estado.errores?.notas}
        />

        <div className="pt-1">
          <BotonGuardar>Guardar precios</BotonGuardar>
        </div>
      </form>
    </Card>
  )
}
