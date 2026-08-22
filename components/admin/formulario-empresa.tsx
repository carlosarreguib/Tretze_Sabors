"use client"

import { useActionState } from "react"
import { Field, SelectField, TextareaField } from "@/components/ui/field"
import { Card } from "@/components/ui/misc"
import { BotonGuardar, Mensajes } from "@/components/ui/formulario"
import { actualizarEmpresa } from "@/lib/actions/empresas"
import { METODOS_PAGO } from "@/lib/constants"
import type { EstadoFormulario } from "@/lib/actions/auth"
import type { Perfil } from "@/lib/database.types"

// actualizarEmpresa toma (profileId, previo, formData): se currea con useActionState

const ESTADO_INICIAL: EstadoFormulario = {}

export function FormularioEmpresa({ perfil }: { perfil: Perfil }) {
  const [estado, ejecutar] = useActionState(
    (_previo: EstadoFormulario, formData: FormData) => actualizarEmpresa(perfil.id, _previo, formData),
    ESTADO_INICIAL,
  )

  return (
    <Card className="p-6">
      <h2 className="font-display text-xl">Datos de la empresa</h2>
      <form action={ejecutar} className="mt-6 space-y-5" noValidate>
        <Mensajes estado={estado} />

        <div className="grid sm:grid-cols-2 gap-5">
          <Field
            name="company_name"
            label="Nombre de la empresa"
            autoComplete="organization"
            defaultValue={perfil.company_name}
            required
            error={estado.errores?.company_name}
          />
          <Field
            name="contact_name"
            label="Persona de contacto"
            defaultValue={perfil.contact_name}
            required
            error={estado.errores?.contact_name}
          />
        </div>

        <Field
          name="phone"
          label="Teléfono"
          type="tel"
          defaultValue={perfil.phone ?? ""}
          required
          error={estado.errores?.phone}
        />

        <TextareaField
          name="delivery_address"
          label="Dirección de entrega"
          rows={2}
          defaultValue={perfil.delivery_address ?? ""}
          placeholder="Calle, número, planta, empresa…"
          required
          error={estado.errores?.delivery_address}
        />

        <SelectField
          name="payment_method"
          label="Método de pago"
          defaultValue={perfil.payment_method}
          error={estado.errores?.payment_method}
        >
          {Object.entries(METODOS_PAGO).map(([valor, etiqueta]) => (
            <option key={valor} value={valor}>
              {etiqueta}
            </option>
          ))}
        </SelectField>

        <TextareaField
          name="payment_notes"
          label="Notas de facturación"
          rows={2}
          defaultValue={perfil.payment_notes ?? ""}
          placeholder="Notas internas sobre pago…"
          error={estado.errores?.payment_notes}
        />

        <fieldset className="space-y-5">
          <legend className="text-sm font-medium text-foreground">Datos fiscales</legend>

          <Field
            name="legal_name"
            label="Razón social"
            defaultValue={perfil.legal_name ?? ""}
            error={estado.errores?.legal_name}
          />

          <Field
            name="nif"
            label="NIF / CIF"
            autoComplete="off"
            defaultValue={perfil.nif ?? ""}
            error={estado.errores?.nif}
          />

          <Field
            name="billing_address"
            label="Dirección de facturación"
            defaultValue={perfil.billing_address ?? ""}
            placeholder="Calle y número"
            error={estado.errores?.billing_address}
          />

          <div className="grid sm:grid-cols-2 gap-5">
            <Field
              name="billing_postal_code"
              label="Código postal"
              defaultValue={perfil.billing_postal_code ?? ""}
              error={estado.errores?.billing_postal_code}
            />
            <Field
              name="billing_city"
              label="Localidad"
              defaultValue={perfil.billing_city ?? ""}
              error={estado.errores?.billing_city}
            />
          </div>
        </fieldset>

        <div className="pt-1">
          <BotonGuardar>Guardar empresa</BotonGuardar>
        </div>
      </form>
    </Card>
  )
}
