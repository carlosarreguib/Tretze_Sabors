import type { Metadata } from "next"
import { FormularioRegistro } from "@/components/auth/formularios"

export const metadata: Metadata = { title: "Crear cuenta" }

export default function RegistroPage() {
  return <FormularioRegistro />
}
