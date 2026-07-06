export const dynamic = 'force-dynamic'

import { getUser } from '@/lib/auth/get-user'
import { isAdmin } from '@/lib/auth/roles'
import { getQuotesByStatus, getPendingApprovalCount, getQuoteConversionRate } from '@/lib/analytics/quotes'
import { getPendingConsultationCount } from '@/lib/voice/queries'
import { getAllQuotes } from '@/lib/quotes/queries'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function DashboardPage() {
  const user = await getUser()
  if (!user) redirect('/login')

  const admin = isAdmin(user.role)

  const [
    myStatuses,
    pendingApprovalCount,
    voiceConsultations,
    conversionRate,
    topClients,
  ] = await Promise.all([
    getQuotesByStatus(user.id),
    admin ? getPendingApprovalCount() : Promise.resolve(0),
    getPendingConsultationCount(user.role as 'vendedor' | 'admin_general' | 'admin_secundario'),
    admin ? getQuoteConversionRate() : Promise.resolve(null),
    admin
      ? getAllQuotes({ page: 1, pageSize: 5 }).then((rows) => {
          // Group by clientId and sum totals
          const map = new Map<string, { clientName: string; total: number }>()
          for (const q of rows) {
            const existing = map.get(q.clientId)
            if (existing) {
              existing.total += Number(q.total)
            } else {
              map.set(q.clientId, { clientName: q.clientName ?? '—', total: Number(q.total) })
            }
          }
          return Array.from(map.values())
            .sort((a, b) => b.total - a.total)
            .slice(0, 5)
        })
      : Promise.resolve([]),
  ])

  const myDraft = myStatuses['draft'] ?? 0
  const myPending = myStatuses['pending_approval'] ?? 0
  const myApproved = myStatuses['approved'] ?? 0
  const mySent = myStatuses['sent'] ?? 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Bienvenido/a, {user.fullName}.</p>
      </div>

      {/* Admin alert bar */}
      {admin && pendingApprovalCount > 0 && (
        <Link
          href="/admin/presupuestos?tab=pending"
          className="block rounded-md bg-yellow-50 border border-yellow-200 px-4 py-3 text-sm text-yellow-800 hover:bg-yellow-100 transition-colors"
        >
          <span className="font-semibold">{pendingApprovalCount} presupuesto(s)</span> esperando tu
          aprobación →
        </Link>
      )}

      {/* My quote summary cards */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Mis Presupuestos
        </h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Borrador</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{myDraft}</p>
              <Badge className="mt-1 bg-gray-100 text-gray-700 text-xs">draft</Badge>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pendiente</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{myPending}</p>
              <Badge className="mt-1 bg-yellow-100 text-yellow-700 text-xs">pendiente aprobación</Badge>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Aprobado</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{myApproved}</p>
              <Badge className="mt-1 bg-green-100 text-green-700 text-xs">approved</Badge>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Enviado</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{mySent}</p>
              <Badge className="mt-1 bg-blue-100 text-blue-700 text-xs">enviado al cliente</Badge>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Voice consultations badge */}
      {voiceConsultations > 0 && (
        <Link
          href="/admin/consultas"
          className="block rounded-md bg-purple-50 border border-purple-200 px-4 py-3 text-sm text-purple-800 hover:bg-purple-100 transition-colors"
        >
          <span className="font-semibold">{voiceConsultations} consulta(s) de voz</span> pendiente(s)
          de revisión →
        </Link>
      )}

      {/* Admin-only sections */}
      {admin && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Conversion rate */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tasa de conversión de presupuestos</CardTitle>
            </CardHeader>
            <CardContent>
              {conversionRate !== null ? (
                <div>
                  <p className="text-4xl font-bold">
                    {(conversionRate * 100).toFixed(1)}%
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Aceptados / Enviados (todos los vendedores)
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Sin datos aún.</p>
              )}
            </CardContent>
          </Card>

          {/* Top clients */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Top Clientes por valor de presupuesto</CardTitle>
            </CardHeader>
            <CardContent>
              {topClients.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sin datos aún.</p>
              ) : (
                <ol className="space-y-2">
                  {topClients.map((client, i) => (
                    <li key={i} className="flex items-center justify-between text-sm">
                      <span>
                        <span className="text-muted-foreground mr-2">{i + 1}.</span>
                        {client.clientName}
                      </span>
                      <span className="font-mono font-medium">
                        ${client.total.toFixed(2)}
                      </span>
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
