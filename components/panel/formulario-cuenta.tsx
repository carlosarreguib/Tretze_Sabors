"use client"

import { useActionState } from "react"
import { useFormStatus } from "react-dom"
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Field, SelectField, TextareaField } from "@/components/ui/field"
import { Aviso, Card } from "@/components/ui/misc"
import { guardarPerfil } from "@/lib/actions/perfil"
import { cambiarPassword, type EstadoFormulario } from "@/lib/actions/auth"
import { METODOS_PAGO } from "@/lib/constants"
import type { Perfil } from "@/lib/database.types"

const ESTADO_INICIAL: EstadoFormulario = {}

function BotonGuardar({ children }: { children: string }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
          Guardando…
        </>
      ) : (
        children
      )}
    </Button>
  )
}

function Mensajes({ estado }: { estado: EstadoFormulario }) {
  if (estado.ok && estado.mensaje) {
    return (
      <Aviso tono="exito">
        <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
        <span>{estado.mensaje}</span>
      </Aviso>
    )
  }

  if (estado.mensaje) {
    return (
      <Aviso tono="error">
        <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
        <span>{estado.mensaje}</span>
      </Aviso>
    )
  }

  return null
}

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
