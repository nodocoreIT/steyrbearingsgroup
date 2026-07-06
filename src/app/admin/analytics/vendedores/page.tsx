export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { getVendedorRanking, getVendedorLastActivity } from '@/lib/analytics/vendedor'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

function formatARS(value: number): string {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(value)
}

export default async function VendedoresPage() {
  const ranking = await getVendedorRanking()

  // Fetch last activity for each salesperson
  const withActivity = await Promise.all(
    ranking.map(async (sp) => {
      const lastActivity = await getVendedorLastActivity(sp.salespersonId)
      return { ...sp, lastActivity }
    })
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Vendedores</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Performance de vendedores — últimos 30 días, ordenados por facturación.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ranking de vendedores</CardTitle>
          <CardDescription>
            Facturación de presupuestos aceptados en los últimos 30 días.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {withActivity.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">
              No hay vendedores registrados en el sistema.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead className="text-right">Presupuestos aceptados</TableHead>
                  <TableHead className="text-right">Facturación (30d)</TableHead>
                  <TableHead>Última actividad</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {withActivity.map((sp, idx) => (
                  <TableRow key={sp.salespersonId} className="hover:bg-muted/30">
                    <TableCell className="text-muted-foreground font-mono text-xs w-8">
                      {idx + 1}
                    </TableCell>
                    <TableCell className="font-medium">{sp.name}</TableCell>
                    <TableCell className="text-right">{sp.quotesAccepted}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatARS(sp.totalRevenue)}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {sp.lastActivity
                        ? new Date(sp.lastActivity).toLocaleDateString('es-AR')
                        : '—'}
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/admin/analytics/vendedores/${sp.salespersonId}`}
                        className="text-xs text-muted-foreground hover:text-foreground underline"
                      >
                        Ver detalle →
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
