"use client"

import { useRouter } from "next/navigation"
import { useTransition } from "react"
import { UserCheck, UserX } from "lucide-react"
import { cn } from "@/lib/utils"
import { desactivarUsuarioEmpresa, reactivarUsuarioEmpresa } from "@/lib/actions/empresas"
import type { CompanyUser } from "@/lib/database.types"

type UsuarioConEmail = CompanyUser & { email: string | null }

export function ListaUsuariosEmpresa({ usuarios }: { usuarios: UsuarioConEmail[] }) {
  if (usuarios.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4">
        Aún no hay usuarios dados de alta para esta empresa.
      </p>
    )
  }

  return (
    <ul className="divide-y divide-border">
      {usuarios.map((u) => (
        <FilaUsuario key={u.id} usuario={u} />
      ))}
    </ul>
  )
}

function FilaUsuario({ usuario }: { usuario: UsuarioConEmail }) {
  const router = useRouter()
  const [pendiente, iniciar] = useTransition()

  const nombreCompleto = [usuario.first_name, usuario.last_name_1, usuario.last_name_2]
    .filter(Boolean)
    .join(" ")

  function toggleActivo() {
    iniciar(async () => {
      if (usuario.is_active) {
        await desactivarUsuarioEmpresa(usuario.id)
      } else {
        await reactivarUsuarioEmpresa(usuario.id)
      }
      router.refresh()
    })
  }

  return (
    <li className="flex items-center justify-between gap-3 py-3.5">
      <div className="min-w-0">
        <p className={cn("font-medium truncate", !usuario.is_active && "text-muted-foreground line-through")}>
          {nombreCompleto}
        </p>
        <p className="text-xs text-muted-foreground truncate">{usuario.email ?? "—"}</p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <span
          className={cn(
            "text-xs px-2 py-0.5 rounded-full font-medium",
            usuario.is_active
              ? "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200"
              : "bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400",
          )}
        >
          {usuario.is_active ? "Activo" : "Inactivo"}
        </span>

        <button
          type="button"
          onClick={toggleActivo}
          disabled={pendiente}
          title={usuario.is_active ? "Desactivar usuario" : "Reactivar usuario"}
          className={cn(
            "w-8 h-8 grid place-items-center rounded-full transition-colors duration-200 cursor-pointer",
            "hover:bg-muted disabled:opacity-50",
            usuario.is_active ? "text-destructive" : "text-primary",
          )}
        >
          {usuario.is_active ? (
            <UserX className="w-4 h-4" aria-hidden="true" />
          ) : (
            <UserCheck className="w-4 h-4" aria-hidden="true" />
          )}
          <span className="sr-only">
            {usuario.is_active ? "Desactivar" : "Reactivar"} usuario
          </span>
        </button>
      </div>
    </li>
  )
}
