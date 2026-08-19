import { Header } from "@/components/landing/header"
import { BadgeContacto, Hero } from "@/components/landing/hero"
import {
  LlamadaFinal,
  MenuMuestra,
  Nosotros,
  Servicio,
} from "@/components/landing/secciones"
import { Footer } from "@/components/landing/footer"
import { createClient, getUsuario } from "@/lib/supabase/server"
import type { Plato } from "@/lib/database.types"

export default async function Home() {
  const usuario = await getUsuario()

  // Muestra de platos para el escaparate. La carta es informacion comercial:
  // RLS permite leer los platos activos tambien sin sesion iniciada.
  const supabase = await createClient()
  const { data } = await supabase
    .from("platos")
    .select("*")
    .eq("is_active", true)
    .in("categoria", ["primer", "segundo"])
    .order("price_cents", { ascending: false })
    .limit(6)
  const platos: Plato[] = data ?? []

  return (
    <>
      <Header haySesion={Boolean(usuario)} />

      <main id="contenido">
        <Hero haySesion={Boolean(usuario)} />
        <Servicio />
        <MenuMuestra platos={platos} />
        <Nosotros />
        <LlamadaFinal haySesion={Boolean(usuario)} />
      </main>

      <Footer />
      <BadgeContacto />
    </>
  )
}
