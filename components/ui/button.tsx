import Link from "next/link"
import type { ComponentProps, ReactNode } from "react"
import { cn } from "@/lib/utils"

type Variante = "primario" | "secundario" | "fantasma" | "peligro"
type Tamano = "sm" | "md" | "lg"

const VARIANTES: Record<Variante, string> = {
  primario:
    "bg-primary text-on-primary hover:bg-primary-hover shadow-sm hover:shadow-md",
  secundario:
    "bg-surface text-foreground border border-border hover:bg-muted",
  fantasma: "text-foreground hover:bg-muted",
  peligro:
    "bg-destructive-soft text-destructive border border-destructive/30 hover:bg-destructive/10",
}

// Altura minima 44px en md/lg: objetivo tactil accesible (WCAG 2.5.5)
const TAMANOS: Record<Tamano, string> = {
  sm: "h-9 px-3 text-sm gap-1.5",
  md: "h-11 px-5 text-sm gap-2",
  lg: "h-13 px-7 text-base gap-2.5",
}

const BASE =
  "inline-flex items-center justify-center rounded-full font-medium " +
  "transition-all duration-200 cursor-pointer select-none " +
  "disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"

type PropsComunes = {
  variante?: Variante
  tamano?: Tamano
  children: ReactNode
  className?: string
}

export function Button({
  variante = "primario",
  tamano = "md",
  className,
  children,
  ...props
}: PropsComunes & ComponentProps<"button">) {
  return (
    <button
      className={cn(BASE, VARIANTES[variante], TAMANOS[tamano], className)}
      {...props}
    >
      {children}
    </button>
  )
}

export function ButtonLink({
  variante = "primario",
  tamano = "md",
  className,
  children,
  ...props
}: PropsComunes & ComponentProps<typeof Link>) {
  return (
    <Link
      className={cn(BASE, VARIANTES[variante], TAMANOS[tamano], className)}
      {...props}
    >
      {children}
    </Link>
  )
}
