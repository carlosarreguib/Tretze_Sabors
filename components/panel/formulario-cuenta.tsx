"use client"

import { useActionState } from "react"
import { Field, SelectField, TextareaField } from "@/components/ui/field"
import { Card } from "@/components/ui/misc"
import { BotonGuardar, Mensajes } from "@/components/ui/formulario"
import { guardarAlergias, guardarDatosFiscales, guardarPerfil } from "@/lib/actions/perfil"
import { cambiarPassword, type EstadoFormulario } from "@/lib/actions/auth"
import { ALERGENOS, METODOS_PAGO } from "@/lib/constants"
import type { Perfil } from "@/lib/database.types"

const ESTADO_INICIAL: EstadoFormulario = {}

export function FormularioCuenta({
  perfil,
  email,
}: {
  perfil: Perfil
  email: string
}) {
  const [estado, accion] = useActionState(guardarPerfil, ESTADO_INICIAL)

  return (
    <Card className="p-6">
      <h2 className="font-display text-xl">Datos de la empresa</h2>
      <p className="mt-1.5 text-sm text-muted-foreground">
        Usamos esta información para preparar y entregar vuestros pedidos.
      </p>

      <form action={accion} className="mt-6 space-y-5" noValidate>
        <Mensajes estado={estado} />

        <Field
          label="Correo electrónico"
          value={email}
          disabled
          readOnly
          ayuda="Para cambiar el correo de acceso, escríbenos."
        />

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
            autoComplete="name"
            defaultValue={perfil.contact_name}
            required
            error={estado.errores?.contact_name}
          />
        </div>

        <Field
          name="phone"
          label="Teléfono"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          defaultValue={perfil.phone ?? ""}
          required
          error={estado.errores?.phone}
        />

        <TextareaField
          name="delivery_address"
          label="Dirección de entrega"
          rows={3}
          defaultValue={perfil.delivery_address ?? ""}
          placeholder="Calle, número, planta, empresa y cualquier indicación para llegar"
          required
          ayuda="Cuanto más detalle, más fácil nos resulta llegar a tiempo."
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
          placeholder="CIF, razón social, número de pedido interno…"
          ayuda="Opcional. Lo incluiremos en vuestras facturas."
          error={estado.errores?.payment_notes}
        />

        <div className="pt-1">
          <BotonGuardar>Guardar cambios</BotonGuardar>
        </div>
      </form>
    </Card>
  )
}

export function FormularioFiscal({ perfil }: { perfil: Perfil }) {
  const [estado, accion] = useActionState(guardarDatosFiscales, ESTADO_INICIAL)

  return (
    <Card className="p-6">
      <h2 className="font-display text-xl">Datos fiscales</h2>
      <p className="mt-1.5 text-sm text-muted-foreground">
        Los usamos para emitir vuestra factura mensual. Sin estos datos no podréis
        descargar el PDF.
      </p>

      <form action={accion} className="mt-6 space-y-5" noValidate>
        <Mensajes estado={estado} />

        <Field
          name="legal_name"
          label="Razón social"
          autoComplete="organization"
          defaultValue={perfil.legal_name ?? ""}
          required
          error={estado.errores?.legal_name}
        />

        <Field
          name="nif"
          label="NIF / CIF"
          autoComplete="off"
          defaultValue={perfil.nif ?? ""}
          required
          error={estado.errores?.nif}
        />

        <Field
          name="billing_address"
          label="Dirección de facturación"
          autoComplete="street-address"
          defaultValue={perfil.billing_address ?? ""}
          placeholder="Calle y número"
          required
          error={estado.errores?.billing_address}
        />

        <div className="grid sm:grid-cols-2 gap-5">
          <Field
            name="billing_postal_code"
            label="Código postal"
            autoComplete="postal-code"
            inputMode="numeric"
            defaultValue={perfil.billing_postal_code ?? ""}
            required
            error={estado.errores?.billing_postal_code}
          />
          <Field
            name="billing_city"
            label="Localidad"
            autoComplete="address-level2"
            defaultValue={perfil.billing_city ?? ""}
            required
            error={estado.errores?.billing_city}
          />
        </div>

        <div className="pt-1">
          <BotonGuardar>Guardar datos fiscales</BotonGuardar>
        </div>
      </form>
    </Card>
  )
}

export function FormularioAlergias({ alergenos }: { alergenos: string[] }) {
  const [estado, accion] = useActionState(guardarAlergias, ESTADO_INICIAL)

  return (
    <Card className="p-6">
      <h2 className="font-display text-xl">Alergias e intolerancias</h2>
      <p className="mt-1.5 text-sm text-muted-foreground">
        Selecciona los alimentos a los que eres alérgico o intolerante. Se lo
        comunicaremos a cocina para que lo tenga en cuenta.
      </p>

      <form action={accion} className="mt-6" noValidate>
        <Mensajes estado={estado} />

        <fieldset className="mt-2">
          <legend className="sr-only">Alergenos</legend>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {ALERGENOS.map((alergeno) => {
              const marcado = alergenos.includes(alergeno)
              return (
                <label
                  key={alergeno}
                  className="flex items-center gap-2.5 cursor-pointer group"
                >
                  <input
                    type="checkbox"
                    name="alergenos"
                    value={alergeno}
                    defaultChecked={marcado}
                    className="w-4 h-4 rounded border-border accent-primary cursor-pointer"
                  />
                  <span className="text-sm capitalize">{alergeno}</span>
                </label>
              )
            })}
          </div>
        </fieldset>

        <div className="pt-5">
          <BotonGuardar>Guardar alergias</BotonGuardar>
        </div>
      </form>
    </Card>
  )
}

export function FormularioPassword() {
  const [estado, accion] = useActionState(cambiarPassword, ESTADO_INICIAL)

  return (
    <Card className="p-6">
      <h2 className="font-display text-xl">Contraseña</h2>
      <p className="mt-1.5 text-sm text-muted-foreground">
        Cámbiala cuando quieras. Mínimo 8 caracteres.
      </p>

      <form action={accion} className="mt-6 space-y-5" noValidate>
        <Mensajes estado={estado} />

        <Field
          name="password"
          label="Nueva contraseña"
          type="password"
          autoComplete="new-password"
          required
          error={estado.errores?.password}
        />

        <Field
          name="passwordConfirm"
          label="Repite la nueva contraseña"
          type="password"
          autoComplete="new-password"
          required
          error={estado.errores?.passwordConfirm}
        />

        <div className="pt-1">
          <BotonGuardar>Cambiar contraseña</BotonGuardar>
        </div>
      </form>
    </Card>
  )
}
