"use client"

import { useActionState } from "react"
import { useFormStatus } from "react-dom"
import { redirect } from "next/navigation"
import { AlertCircle, CheckCircle2, Eye, EyeOff, Loader2 } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Field } from "@/components/ui/field"
import { Aviso } from "@/components/ui/misc"
import { cambiarPassword } from "@/lib/actions/auth"
import type { EstadoFormulario } from "@/lib/actions/auth"

function BotonEnviar() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
          Guardando…
        </>
      ) : (
        "Crear contraseña y acceder"
      )}
    </Button>
  )
}

function CampoPassword({
  name,
  label,
  error,
  ayuda,
  autoComplete,
}: {
  name: string
  label: string
  error?: string
  ayuda?: string
  autoComplete: string
}) {
  const [visible, setVisible] = useState(false)
  return (
    <div className="relative">
      <Field
        name={name}
        label={label}
        type={visible ? "text" : "password"}
        autoComplete={autoComplete}
        required
        error={error}
        ayuda={ayuda}
        className="pr-12"
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
        className="absolute right-1 top-7 w-10 h-11 grid place-items-center rounded-lg text-muted-foreground hover:text-foreground transition-colors duration-200 cursor-pointer"
      >
        {visible ? (
          <EyeOff className="w-4 h-4" aria-hidden="true" />
        ) : (
          <Eye className="w-4 h-4" aria-hidden="true" />
        )}
      </button>
    </div>
  )
}

export function FormularioBienvenida({ nombre }: { nombre: string }) {
  const [estado, accion] = useActionState<EstadoFormulario, FormData>(
    cambiarPassword,
    {},
  )

  if (estado.ok) {
    // Redirige al panel tras guardar la contraseña
    redirect("/panel")
  }

  return (
    <div className="animar-entrada">
      <div className="mb-6">
        <div className="w-12 h-12 rounded-full bg-primary/10 grid place-items-center mb-4">
          <CheckCircle2 className="w-6 h-6 text-primary" aria-hidden="true" />
        </div>
        <h1 className="font-display text-3xl sm:text-4xl">¡Bienvenido!</h1>
        <p className="mt-2.5 text-muted-foreground">
          Ya tienes acceso a <span className="font-medium">Tretze Sabors</span>.
          Crea una contraseña para poder iniciar sesión en el futuro.
        </p>
        {nombre && (
          <p className="mt-1 text-sm text-muted-foreground/70">{nombre}</p>
        )}
      </div>

      <form action={accion} className="space-y-5" noValidate>
        {estado.mensaje && (
          <Aviso tono="error">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
            <span>{estado.mensaje}</span>
          </Aviso>
        )}

        <CampoPassword
          name="password"
          label="Nueva contraseña"
          autoComplete="new-password"
          ayuda="Mínimo 8 caracteres."
          error={estado.errores?.password}
        />

        <CampoPassword
          name="passwordConfirm"
          label="Repite la contraseña"
          autoComplete="new-password"
          error={estado.errores?.passwordConfirm}
        />

        <BotonEnviar />
      </form>
    </div>
  )
}
