"use client"

import { useActionState } from "react"
import { Field, SelectField, TextareaField } from "@/components/ui/field"
import { Card } from "@/components/ui/misc"
import { BotonGuardar, Mensajes } from "@/components/ui/formulario"
import { crearEmpresaConUsuario } from "@/lib/actions/empresas"
import { METODOS_PAGO } from "@/lib/constants"
import type { EstadoFormulario } from "@/lib/actions/auth"

const ESTADO_INICIAL: EstadoFormulario = {}

export function FormularioNuevaEmpresa() {
  const [estado, ejecutar] = useActionState(crearEmpresaConUsuario, ESTADO_INICIAL)

  return (
    <form action={ejecutar} className="space-y-8" noValidate>
      <Mensajes estado={estado} />

      {/* Datos de la empresa */}
      <Card className="p-6">
        <h2 className="font-display text-xl mb-6">Datos de la empresa</h2>

        <div className="space-y-5">
          <div className="grid sm:grid-cols-2 gap-5">
            <Field
              name="company_name"
              label="Nombre de la empresa"
              autoComplete="organization"
              required
              error={estado.errores?.company_name}
            />
            <Field
              name="contact_name"
              label="Persona de contacto"
              required
              error={estado.errores?.contact_name}
            />
          </div>

          <Field
            name="phone"
            label="Teléfono"
            type="tel"
            required
            error={estado.errores?.phone}
          />

          <TextareaField
            name="delivery_address"
            label="Dirección de entrega"
            rows={2}
            placeholder="Calle, número, planta, empresa…"
            required
            error={estado.errores?.delivery_address}
          />

          <SelectField
            name="payment_method"
            label="Método de pago"
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
            placeholder="Notas internas sobre pago…"
            error={estado.errores?.payment_notes}
          />

          <fieldset className="space-y-5 pt-2">
            <legend className="text-sm font-medium text-foreground">
              Datos fiscales{" "}
              <span className="text-muted-foreground font-normal">(opcionales, se pueden completar después)</span>
            </legend>

            <Field
              name="legal_name"
              label="Razón social"
              error={estado.errores?.legal_name}
            />
            <Field
              name="nif"
              label="NIF / CIF"
              autoComplete="off"
              error={estado.errores?.nif}
            />
            <Field
              name="billing_address"
              label="Dirección de facturación"
              placeholder="Calle y número"
              error={estado.errores?.billing_address}
            />
            <div className="grid sm:grid-cols-2 gap-5">
              <Field
                name="billing_postal_code"
                label="Código postal"
                error={estado.errores?.billing_postal_code}
              />
              <Field
                name="billing_city"
                label="Localidad"
                error={estado.errores?.billing_city}
              />
            </div>
          </fieldset>
        </div>
      </Card>

      {/* Primer usuario */}
      <Card className="p-6">
        <h2 className="font-display text-xl mb-1">Primer usuario</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Recibirá un correo para establecer su contraseña y acceder al panel.
        </p>

        <div className="space-y-5">
          <div className="grid sm:grid-cols-3 gap-5">
            <Field
              name="first_name"
              label="Nombre"
              autoComplete="given-name"
              required
              error={estado.errores?.first_name}
            />
            <Field
              name="last_name_1"
              label="Primer apellido"
              autoComplete="family-name"
              required
              error={estado.errores?.last_name_1}
            />
            <Field
              name="last_name_2"
              label="Segundo apellido"
              autoComplete="additional-name"
              error={estado.errores?.last_name_2}
            />
          </div>

          <Field
            name="email"
            label="Correo electrónico"
            type="email"
            autoComplete="email"
            required
            error={estado.errores?.email}
          />
        </div>
      </Card>

      <div className="flex justify-end">
        <BotonGuardar>Crear empresa y enviar invitación</BotonGuardar>
      </div>
    </form>
  )
}
