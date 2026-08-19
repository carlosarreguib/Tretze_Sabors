import type { Metadata } from "next"
import { FormularioRecuperar } from "@/components/auth/formularios"

export const metadata: Metadata = { title: "Restablecer contraseña" }

export default function RecuperarPage() {
  return <FormularioRecuperar />
}
