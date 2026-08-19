"use client"

import { useId, type ComponentProps, type ReactNode } from "react"
import { cn } from "@/lib/utils"

type FieldProps = {
  label: string
  error?: string
  ayuda?: string
  children?: ReactNode
} & Omit<ComponentProps<"input">, "children">

/**
 * Campo de formulario con etiqueta visible, ayuda y error.
 *
 * La etiqueta es siempre visible: usar solo el placeholder deja al usuario sin
 * referencia en cuanto empieza a escribir. El error se anuncia con role="alert"
 * y se enlaza por aria-describedby para que los lectores de pantalla lo lean.
 */
export function Field({
  label,
  error,
  ayuda,
  className,
  id,
  ...props
}: FieldProps) {
  const generado = useId()
  const inputId = id ?? generado
  const errorId = `${inputId}-error`
  const ayudaId = `${inputId}-ayuda`

  const describedBy =
    [error ? errorId : null, ayuda ? ayudaId : null].filter(Boolean).join(" ") ||
    undefined

  return (
    <div className="space-y-1.5">
      <label
        htmlFor={inputId}
        className="block text-sm font-medium text-foreground"
      >
        {label}
        {props.required && (
          <span className="text-destructive ml-0.5" aria-hidden="true">
            *
          </span>
        )}
      </label>

      <input
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cn(
          "w-full h-11 px-3.5 rounded-xl bg-surface text-foreground",
          "border transition-colors duration-200",
          "placeholder:text-muted-foreground/60",
          "focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring",
          error ? "border-destructive" : "border-border hover:border-primary/40",
          "disabled:opacity-60 disabled:cursor-not-allowed",
          className,
        )}
        {...props}
      />

      {ayuda && !error && (
        <p id={ayudaId} className="text-xs text-muted-foreground">
          {ayuda}
        </p>
      )}

      {error && (
        <p
          id={errorId}
          role="alert"
          className="text-xs text-destructive font-medium"
        >
          {error}
        </p>
      )}
    </div>
  )
}

type SelectProps = {
  label: string
  error?: string
  ayuda?: string
  children: ReactNode
} & ComponentProps<"select">

export function SelectField({
  label,
  error,
  ayuda,
  className,
  id,
  children,
  ...props
}: SelectProps) {
  const generado = useId()
  const selectId = id ?? generado
  const errorId = `${selectId}-error`
  const ayudaId = `${selectId}-ayuda`

  const describedBy =
    [error ? errorId : null, ayuda ? ayudaId : null].filter(Boolean).join(" ") ||
    undefined

  return (
    <div className="space-y-1.5">
      <label
        htmlFor={selectId}
        className="block text-sm font-medium text-foreground"
      >
        {label}
      </label>

      <select
        id={selectId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cn(
          "w-full h-11 px-3.5 rounded-xl bg-surface text-foreground cursor-pointer",
          "border transition-colors duration-200",
          "focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring",
          error ? "border-destructive" : "border-border hover:border-primary/40",
          className,
        )}
        {...props}
      >
        {children}
      </select>

      {ayuda && !error && (
        <p id={ayudaId} className="text-xs text-muted-foreground">
          {ayuda}
        </p>
      )}

      {error && (
        <p id={errorId} role="alert" className="text-xs text-destructive font-medium">
          {error}
        </p>
      )}
    </div>
  )
}

type TextareaProps = {
  label: string
  error?: string
  ayuda?: string
} & ComponentProps<"textarea">

export function TextareaField({
  label,
  error,
  ayuda,
  className,
  id,
  ...props
}: TextareaProps) {
  const generado = useId()
  const areaId = id ?? generado
  const errorId = `${areaId}-error`
  const ayudaId = `${areaId}-ayuda`

  const describedBy =
    [error ? errorId : null, ayuda ? ayudaId : null].filter(Boolean).join(" ") ||
    undefined

  return (
    <div className="space-y-1.5">
      <label htmlFor={areaId} className="block text-sm font-medium text-foreground">
        {label}
      </label>

      <textarea
        id={areaId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cn(
          "w-full px-3.5 py-2.5 rounded-xl bg-surface text-foreground resize-y min-h-24",
          "border transition-colors duration-200",
          "placeholder:text-muted-foreground/60",
          "focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring",
          error ? "border-destructive" : "border-border hover:border-primary/40",
          className,
        )}
        {...props}
      />

      {ayuda && !error && (
        <p id={ayudaId} className="text-xs text-muted-foreground">
          {ayuda}
        </p>
      )}

      {error && (
        <p id={errorId} role="alert" className="text-xs text-destructive font-medium">
          {error}
        </p>
      )}
    </div>
  )
}
