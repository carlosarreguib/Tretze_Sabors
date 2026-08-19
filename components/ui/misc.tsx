import type { ReactNode } from "react"
import { cn } from "@/lib/utils"
import { ESTADOS_PEDIDO } from "@/lib/constants"
import type { EstadoPedido } from "@/lib/database.types"

export function Card({
  className,
  children,
}: {
  className?: string
  children: ReactNode
}) {
  return (
    <div
      className={cn(
        "bg-surface border border-border rounded-card shadow-sm",
        className,
      )}
    >
      {children}
    </div>
  )
}

export function EstadoBadge({ estado }: { estado: EstadoPedido }) {
  const { etiqueta, clase } = ESTADOS_PEDIDO[estado]
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium",
        clase,
      )}
    >
      {etiqueta}
    </span>
  )
}

/** Aviso en linea. `tono` fija el color y el icono lo aporta quien llama. */
export function Aviso({
  tono = "info",
  children,
  className,
}: {
  tono?: "info" | "error" | "exito"
  children: ReactNode
  className?: string
}) {
  const tonos = {
    info: "bg-muted border-border text-muted-foreground",
    error: "bg-destructive-soft border-destructive/30 text-destructive",
    exito: "bg-green-50 border-green-200 text-green-800 dark:bg-green-950/40 dark:border-green-900 dark:text-green-300",
  }

  return (
    <div
      role={tono === "error" ? "alert" : "status"}
      className={cn(
        "flex items-start gap-2.5 px-4 py-3 rounded-xl border text-sm",
        tonos[tono],
        className,
      )}
    >
      {children}
    </div>
  )
}

/** Estado vacío: explica qué falta y, si procede, qué hacer. */
export function Vacio({
  icono,
  titulo,
  descripcion,
  children,
}: {
  icono?: ReactNode
  titulo: string
  descripcion?: string
  children?: ReactNode
}) {
  return (
    <div className="text-center py-14 px-6">
      {icono && (
        <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-muted grid place-items-center text-muted-foreground">
          {icono}
        </div>
      )}
      <p className="font-display text-xl text-foreground">{titulo}</p>
      {descripcion && (
        <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
          {descripcion}
        </p>
      )}
      {children && <div className="mt-6">{children}</div>}
    </div>
  )
}

/** Etiqueta de sección: pequeña, en versalitas, sobre el titular. */
export function Kicker({ children }: { children: ReactNode }) {
  return (
    <p className="text-xs font-semibold tracking-[0.18em] uppercase text-primary mb-3">
      {children}
    </p>
  )
}
