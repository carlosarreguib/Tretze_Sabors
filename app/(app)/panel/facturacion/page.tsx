import type { Metadata } from "next"
import Link from "next/link"
import { AlertCircle } from "lucide-react"
import { ButtonLink } from "@/components/ui/button"
import { Aviso } from "@/components/ui/misc"
import { SelectorMes } from "@/components/facturacion/selector-mes"
import { ResumenFacturacion } from "@/components/facturacion/resumen-facturacion"
import { DetalleMensual } from "@/components/facturacion/detalle-mensual"
import { ResumenCategoriaProducto } from "@/components/facturacion/resumen-categoria-producto"
import { obtenerFacturaDelPeriodo, obtenerResumenMensual } from "@/lib/facturacion/consumo"
import { getPerfil } from "@/lib/supabase/server"
import { anioMes, primerDiaDelMes, sumarMeses } from "@/lib/utils"

export const metadata: Metadata = { title: "Facturación" }

export default async function FacturacionPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>
}) {
  const perfil = await getPerfil()
  const desplazamiento = Math.max(-24, Math.min(0, Number((await searchParams).mes) || 0))
  const fechaMes = sumarMeses(primerDiaDelMes(), desplazamiento)
  const { anio, mes } = anioMes(fechaMes)

  const [resumen, factura] = await Promise.all([
    obtenerResumenMensual(perfil!.id, anio, mes),
    obtenerFacturaDelPeriodo(perfil!.id, anio, mes),
  ])

  const datosFiscalesCompletos = Boolean(
    perfil!.nif &&
      perfil!.billing_address &&
      (perfil!.legal_name || perfil!.company_name),
  )

  return (
    <div className="max-w-3xl mx-auto">
      <header className="mb-7">
        <h1 className="font-display text-3xl sm:text-4xl">Facturación</h1>
        <p className="mt-2 text-muted-foreground">
          Consulta lo que se te ha facturado cada mes y descarga tu factura.
        </p>
      </header>

      <SelectorMes desplazamiento={desplazamiento} fecha={fechaMes} base="/panel/facturacion" />

      <ResumenFacturacion resumen={resumen} factura={factura} />

      {!datosFiscalesCompletos && (
        <Aviso tono="error" className="mb-6">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
          <span>
            Completa tus datos fiscales para poder descargar la factura.{" "}
            <Link href="/panel/cuenta" className="underline font-medium cursor-pointer">
              Ir a Mi cuenta
            </Link>
          </span>
        </Aviso>
      )}

      <DetalleMensual resumen={resumen} />

      <ResumenCategoriaProducto resumen={resumen} />

      {factura && datosFiscalesCompletos && (
        <ButtonLink href={`/api/facturas/${factura.id}/pdf`} className="w-full sm:w-auto">
          Descargar factura PDF
        </ButtonLink>
      )}
    </div>
  )
}
