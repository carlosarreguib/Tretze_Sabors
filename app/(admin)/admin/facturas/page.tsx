import type { Metadata } from "next"
import Link from "next/link"
import { Receipt } from "lucide-react"
import { Card, Vacio } from "@/components/ui/misc"
import { FacturaBadge } from "@/components/facturacion/badge-factura"
import { SelectorMes } from "@/components/facturacion/selector-mes"
import { obtenerResumenGlobal } from "@/lib/facturacion/consumo"
import { anioMes, formatearPrecio, primerDiaDelMes, sumarMeses } from "@/lib/utils"

export const metadata: Metadata = { title: "Facturación" }

export default async function AdminFacturasPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>
}) {
  const desplazamiento = Math.max(-24, Math.min(0, Number((await searchParams).mes) || 0))
  const fechaMes = sumarMeses(primerDiaDelMes(), desplazamiento)
  const { anio, mes } = anioMes(fechaMes)

  const { filas, totalFacturado, totalPedidos, pendientes, totalEmpresas } =
    await obtenerResumenGlobal(anio, mes)

  return (
    <div className="max-w-4xl mx-auto">
      <header className="mb-7">
        <h1 className="font-display text-3xl sm:text-4xl">Facturación</h1>
        <p className="mt-2 text-muted-foreground">
          Consumo y estado de facturación de todas las empresas.
        </p>
      </header>

      <SelectorMes desplazamiento={desplazamiento} fecha={fechaMes} base="/admin/facturas" />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Total facturado</p>
          <p className="mt-1 font-display text-2xl tabular-nums">
            {formatearPrecio(totalFacturado)}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Empresas</p>
          <p className="mt-1 font-display text-2xl tabular-nums">{totalEmpresas}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Pedidos</p>
          <p className="mt-1 font-display text-2xl tabular-nums">{totalPedidos}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Pendientes</p>
          <p className="mt-1 font-display text-2xl tabular-nums">{pendientes}</p>
        </Card>
      </div>

      {filas.length === 0 ? (
        <Card>
          <Vacio
            icono={<Receipt className="w-5 h-5" />}
            titulo="No hay empresas activas"
            descripcion="Cuando haya empresas dadas de alta, aparecerán aquí con su consumo del mes."
          />
        </Card>
      ) : (
        <Card>
          <ul className="divide-y divide-border">
            {filas.map(({ empresa, factura, total_cents, pedidos }) => (
              <li key={empresa.id}>
                <Link
                  href={`/admin/facturas/${empresa.id}?mes=${desplazamiento}`}
                  className="flex items-center justify-between gap-3 px-5 py-4 hover:bg-muted transition-colors duration-200 cursor-pointer"
                >
                  <div className="min-w-0">
                    <p className="font-medium truncate">
                      {empresa.company_name || "Empresa sin nombre"}
                    </p>
                    <p className="text-xs text-muted-foreground">{pedidos} días de servicio</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-display text-lg tabular-nums">
                      {formatearPrecio(total_cents)}
                    </span>
                    <FacturaBadge estado={factura?.estado ?? "borrador"} />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  )
}
