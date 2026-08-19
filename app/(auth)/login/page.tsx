import type { Metadata } from "next"
import { FormularioLogin } from "@/components/auth/formularios"

export const metadata: Metadata = { title: "Acceder" }

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string; error?: string }>
}) {
  const { redirect, error } = await searchParams
  return <FormularioLogin redirectTo={redirect} errorInicial={error} />
}
