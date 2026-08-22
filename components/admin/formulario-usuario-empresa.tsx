"use client"

import { useActionState } from "react"
import { Field } from "@/components/ui/field"
import { BotonGuardar, Mensajes } from "@/components/ui/formulario"
import { crearUsuarioEmpresa } from "@/lib/actions/empresas"
import type { EstadoFormulario } from "@/lib/actions/auth"

const ESTADO_INICIAL: EstadoFormulario = {}

export function FormularioUsuarioEmpresa({ profileId }: { profileId: string }) {
  const [estado, ejecutar] = useActionState(crearUsuarioEmpresa, ESTADO_INICIAL)

  return (
    <form action={ejecutar} className="space-y-5" noValidate>
      <input type="hidden" name="profile_id" value={profileId} />

      <Mensajes estado={estado} />

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
        ayuda="El usuario recibirá un correo para establecer su contraseña."
        error={estado.errores?.email}
      />

      <BotonGuardar>Enviar invitación</BotonGuardar>
    </form>
  )
}
