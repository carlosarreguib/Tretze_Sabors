"use client"

import Link from "next/link"
import { useActionState, useState } from "react"
import { useFormStatus } from "react-dom"
import { AlertCircle, CheckCircle2, Eye, EyeOff, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Field } from "@/components/ui/field"
import { Aviso } from "@/components/ui/misc"
import {
  iniciarSesion,
  registrarse,
  solicitarRecuperacion,
  type EstadoFormulario,
} from "@/lib/actions/auth"

const ESTADO_INICIAL: EstadoFormulario = {}

/** Botón de envío con estado de carga tomado del formulario padre. */
function BotonEnviar({ children }: { children: string }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
          Un momento…
        </>
      ) : (
        children
      )}
    </Button>
  )
}

/** Campo de contraseña con conmutador de visibilidad. */
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

export function FormularioLogin({
  redirectTo,
  errorInicial,
}: {
  redirectTo?: string
  errorInicial?: string
}) {
  const [estado, accion] = useActionState(iniciarSesion, ESTADO_INICIAL)
  const mensajeError = estado.mensaje ?? errorInicial

  return (
    <div className="animar-entrada">
      <h1 className="font-display text-3xl sm:text-4xl">Bienvenido de nuevo</h1>
      <p className="mt-2.5 text-muted-foreground">
        Accede para gestionar los pedidos de tu empresa.
      </p>

      <form action={accion} className="mt-8 space-y-5" noValidate>
        {redirectTo && (
          <input type="hidden" name="redirect" value={redirectTo} />
        )}

        {mensajeError && (
          <Aviso tono="error">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
            <span>{mensajeError}</span>
          </Aviso>
        )}

        <Field
          name="email"
          label="Correo electrónico"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="nombre@empresa.com"
          required
          error={estado.errores?.email}
        />

        <CampoPassword
          name="password"
          label="Contraseña"
          autoComplete="current-password"
          error={estado.errores?.password}
        />

        <div className="flex items-center justify-between gap-4">
          <label className="flex items-center gap-2.5 text-sm cursor-pointer select-none">
            <input
              type="checkbox"
              name="remember"
              defaultChecked
              className="w-4 h-4 rounded border-border text-primary accent-[var(--primary)] cursor-pointer"
            />
            Recordarme
          </label>

          <Link
            href="/recuperar"
            className="text-sm text-accent hover:text-accent-hover hover:underline transition-colors duration-200 cursor-pointer"
          >
            ¿Olvidaste tu contraseña?
          </Link>
        </div>

        <BotonEnviar>Acceder</BotonEnviar>
      </form>

      <p className="mt-8 text-sm text-center text-muted-foreground">
        ¿Todavía no tenéis cuenta?{" "}
        <Link
          href="/registro"
          className="text-accent hover:text-accent-hover font-medium hover:underline transition-colors duration-200 cursor-pointer"
        >
          Registrad vuestra empresa
        </Link>
      </p>
    </div>
  )
}

export function FormularioRegistro() {
  const [estado, accion] = useActionState(registrarse, ESTADO_INICIAL)

  if (estado.ok) {
    return (
      <div className="animar-entrada text-center">
        <div className="mx-auto w-14 h-14 rounded-full bg-green-100 dark:bg-green-950 grid place-items-center">
          <CheckCircle2
            className="w-7 h-7 text-green-700 dark:text-green-400"
            aria-hidden="true"
          />
        </div>
        <h1 className="mt-6 font-display text-3xl">Revisa tu correo</h1>
        <p className="mt-3 text-muted-foreground leading-relaxed">
          {estado.mensaje}
        </p>
        <p className="mt-6 text-sm text-muted-foreground">
          ¿No lo encuentras? Mira en la carpeta de spam antes de volver a
          intentarlo.
        </p>
        <Link
          href="/login"
          className="mt-8 inline-block text-sm text-accent hover:underline cursor-pointer"
        >
          Ir al acceso
        </Link>
      </div>
    )
  }

  return (
    <div className="animar-entrada">
      <h1 className="font-display text-3xl sm:text-4xl">Crear cuenta</h1>
      <p className="mt-2.5 text-muted-foreground">
        Registra tu empresa y empieza a pedir esta misma semana.
      </p>

      <form action={accion} className="mt-8 space-y-5" noValidate>
        {estado.mensaje && (
          <Aviso tono="error">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
            <span>{estado.mensaje}</span>
          </Aviso>
        )}

        <Field
          name="company_name"
          label="Nombre de la empresa"
          autoComplete="organization"
          placeholder="Talleres Puig S.L."
          required
          error={estado.errores?.company_name}
        />

        <Field
          name="contact_name"
          label="Persona de contacto"
          autoComplete="name"
          placeholder="María García"
          required
          error={estado.errores?.contact_name}
        />

        <Field
          name="phone"
          label="Teléfono"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="600 000 000"
          required
          error={estado.errores?.phone}
        />

        <Field
          name="email"
          label="Correo electrónico"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="nombre@empresa.com"
          required
          error={estado.errores?.email}
        />

        <CampoPassword
          name="password"
          label="Contraseña"
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

        <BotonEnviar>Crear cuenta</BotonEnviar>

        <p className="text-xs text-muted-foreground leading-relaxed">
          La dirección de entrega se configura después, desde los ajustes de tu
          cuenta.
        </p>
      </form>

      <p className="mt-8 text-sm text-center text-muted-foreground">
        ¿Ya tenéis cuenta?{" "}
        <Link
          href="/login"
          className="text-accent hover:text-accent-hover font-medium hover:underline transition-colors duration-200 cursor-pointer"
        >
          Acceder
        </Link>
      </p>
    </div>
  )
}

export function FormularioRecuperar() {
  const [estado, accion] = useActionState(
    solicitarRecuperacion,
    ESTADO_INICIAL,
  )

  return (
    <div className="animar-entrada">
      <h1 className="font-display text-3xl sm:text-4xl">
        Restablecer contraseña
      </h1>
      <p className="mt-2.5 text-muted-foreground">
        Introduce tu correo y te enviaremos un enlace para crear una contraseña
        nueva.
      </p>

      <form action={accion} className="mt-8 space-y-5" noValidate>
        {estado.ok && (
          <Aviso tono="exito">
            <CheckCircle2
              className="w-4 h-4 mt-0.5 shrink-0"
              aria-hidden="true"
            />
            <span>{estado.mensaje}</span>
          </Aviso>
        )}

        <Field
          name="email"
          label="Correo electrónico"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="nombre@empresa.com"
          required
          error={estado.errores?.email}
        />

        <BotonEnviar>Enviar enlace</BotonEnviar>
      </form>

      <p className="mt-8 text-sm text-center text-muted-foreground">
        <Link
          href="/login"
          className="text-accent hover:text-accent-hover font-medium hover:underline transition-colors duration-200 cursor-pointer"
        >
          Volver al acceso
        </Link>
      </p>
    </div>
  )
}
