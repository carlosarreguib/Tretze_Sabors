import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { ButtonLink } from "@/components/ui/button"
import { Card } from "@/components/ui/misc"
import { SelectorMes } from "@/components/facturacion/selector-mes"
import { ResumenFacturacion } from "@/components/facturacion/resumen-facturacion"
import { DetalleMensual } from "@/components/facturacion/detalle-mensual"
import { ResumenCategoriaProducto } from "@/components/facturacion/resumen-categoria-producto"
import { FormularioAjuste } from "@/components/facturacion/formulario-ajuste"
import { AccionesFactura } from "@/components/facturacion/acciones-factura"
import { obtenerFacturaDelPeriodo, obtenerResumenMensual } from "@/lib/facturacion/consumo"
import { createClient } from "@/lib/supabase/server"
import { anioMes, primerDiaDelMes, sumarMeses } from "@/lib/utils"

export const metadata: Metadata = { title: "Facturación de empresa" }

export default async function AdminFacturaEmpresaPage({
  params,
  searchParams,
}: {
  params: Promise<{ profileId: string }>
  searchParams: Promise<{ mes?: string }>
}) {
  const { profileId } = await params
  const desplazamiento = Math.max(-24, Math.min(0, Number((await searchParams).mes) || 0))
  const fechaMes = sumarMeses(primerDiaDelMes(), desplazamiento)
  const { anio, mes } = anioMes(fechaMes)

  const supabase = await createClient()
  const { data: empresa } = await supabase
    .from("profiles")
    .select("id, company_name, contact_name, nif")
    .eq("id", profileId)
    .maybeSingle()

  if (!empresa) notFound()

  const [resumen, factura] = await Promise.all([
    obtenerResumenMensual(profileId, anio, mes),
    obtenerFacturaDelPeriodo(profileId, anio, mes),
  ])

  return (
    <div className="max-w-3xl mx-auto">
      <header className="mb-7">
        <h1 className="font-display text-3xl sm:text-4xl">
          {empresa.company_name || "Empresa sin nombre"}
        </h1>
        <p className="mt-2 text-muted-foreground">{empresa.contact_name}</p>
      </header>

      <SelectorMes
        desplazamiento={desplazamiento}
        fecha={fechaMes}
        base={`/admin/facturas/${profileId}`}
      />

      <ResumenFacturacion resumen={resumen} factura={factura} />

      <Card className="p-5 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium">Acciones</p>
            <p className="text-xs text-muted-foreground">
              {factura ? `Factura ${factura.numero ?? "en borrador"}` : "Periodo aún sin cerrar"}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <AccionesFactura profileId={profileId} anio={anio} mes={mes} factura={factura} />
            {factura && (
              <>
                <ButtonLink
                  href={`/api/facturas/${factura.id}/pdf`}
                  variante="secundario"
                  tamano="sm"
                >
                  Descargar PDF
                </ButtonLink>
                <ButtonLink
                  href={`/api/facturas/${factura.id}/csv`}
                  variante="secundario"
                  tamano="sm"
                >
                  Exportar CSV
                </ButtonLink>
              </>
            )}
          </div>
        </div>

        {factura?.estado === "borrador" && (
          <div className="mt-4 pt-4 border-t border-border">
            <FormularioAjuste facturaId={factura.id} />
          </div>
        )}
      </Card>

      <DetalleMensual resumen={resumen} />

      <ResumenCategoriaProducto resumen={resumen} />
    </div>
  )
}
