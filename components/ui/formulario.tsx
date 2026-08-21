"use client"

import { useFormStatus } from "react-dom"
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Aviso } from "@/components/ui/misc"
import type { EstadoFormulario } from "@/lib/actions/auth"

/** Botón de envío que muestra estado de carga, para usar dentro de un <form> con useActionState. */
export function BotonGuardar({ children }: { children: string }) {
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

/** Mensaje de éxito/error de un EstadoFormulario, para usar tras useActionState. */
export function Mensajes({ estado }: { estado: EstadoFormulario }) {
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
