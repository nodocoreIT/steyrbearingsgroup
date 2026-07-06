export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import { db } from '@/db'
import { profiles } from '@/db/schema'
import { eq } from 'drizzle-orm'
import {
  getVendedorStats,
  getVendedorQuoteHistory,
} from '@/lib/analytics/vendedor'
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

function formatPct(value: number | null): string {
  if (value === null) return '—'
  return `${(value * 100).toFixed(1)}%`
}

function QuoteStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-700',
    requested: 'bg-blue-100 text-blue-700',
    pending_approval: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-700',
    sent: 'bg-indigo-100 text-indigo-700',
    accepted: 'bg-emerald-100 text-emerald-800',
    declined: 'bg-rose-100 text-rose-700',
  }
  const labels: Record<string, string> = {
    draft: 'Borrador',
    requested: 'Solicitado',
    pending_approval: 'Pendiente aprobación',
    approved: 'Aprobado',
    rejected: 'Rechazado',
    sent: 'Enviado',
    accepted: 'Aceptado',
    declined: 'Declinado',
  }
  return (
    <Badge className={`text-xs ${styles[status] ?? 'bg-gray-100 text-gray-700'}`}>
      {labels[status] ?? status}
    </Badge>
  )
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function VendedorDetailPage({ params }: PageProps) {
  const { id } = await params

  // Load profile and stats in parallel
  const [profileRows, stats, history] = await Promise.all([
    db
      .select({ id: profiles.id, fullName: profiles.fullName, role: profiles.role })
      .from(profiles)
      .where(eq(profiles.id, id))
      .limit(1),
    getVendedorStats(id),
    getVendedorQuoteHistory(id),
  ])

  const profile = profileRows[0]
  if (!profile) notFound()

  const isVendedor = profile.role === 'vendedor'
  if (!isVendedor) notFound()

  const roleLabel = 'Vendedor'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold">{profile.fullName}</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge className="bg-blue-100 text-blue-800 text-xs">{roleLabel}</Badge>
            <span className="text-xs text-muted-foreground font-mono">{id}</span>
          </div>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-1">
            <CardDescription className="text-xs">Creados</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.quotesCreated}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardDescription className="text-xs">Aceptados</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-700">{stats.quotesAccepted}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardDescription className="text-xs">Pendientes</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-yellow-700">{stats.quotesPending}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardDescription className="text-xs">Facturación</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold">{formatARS(stats.totalRevenue)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardDescription className="text-xs">Conversión</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatPct(stats.conversionRate)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Quote history + top clients */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quote history (last 20) */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Últimos presupuestos</CardTitle>
            <CardDescription>Últimos 20 presupuestos creados por este vendedor</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {history.length === 0 ? (
              <p className="p-6 text-sm text-muted-foreground">No hay presupuestos aún.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Fecha</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((q) => (
                    <TableRow key={q.quoteId}>
                      <TableCell className="font-medium max-w-[160px] truncate">
                        {q.clientName ?? '—'}
                      </TableCell>
                      <TableCell>
                        <QuoteStatusBadge status={q.status} />
                      </TableCell>
                      <TableCell className="text-right">{formatARS(q.total)}</TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {q.createdAt.toLocaleDateString('es-AR')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Top 5 clients by revenue */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top clientes</CardTitle>
            <CardDescription>Por facturación acumulada</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {stats.topClients.length === 0 ? (
              <p className="p-6 text-sm text-muted-foreground">Sin clientes con compras.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead className="text-right">Facturación</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.topClients.map((c) => (
                    <TableRow key={c.clientId}>
                      <TableCell className="font-medium max-w-[140px] truncate text-sm">
                        {c.name}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {formatARS(c.revenue)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
