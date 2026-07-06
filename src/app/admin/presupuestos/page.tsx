export const dynamic = 'force-dynamic'

import { getAllQuotes, getPendingQuoteRequests } from '@/lib/quotes/queries'
import { convertQuoteRequest } from '@/lib/quotes/actions'
import { getUser } from '@/lib/auth/get-user'
import { isAdmin } from '@/lib/auth/roles'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import Link from 'next/link'
import { redirect } from 'next/navigation'

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  pending_approval: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  sent: 'bg-blue-100 text-blue-700',
  accepted: 'bg-emerald-100 text-emerald-700',
  declined: 'bg-red-100 text-red-600',
  requested: 'bg-purple-100 text-purple-700',
}

const STATUS_LABELS: Record<string, string> = {
  draft: 'Borrador',
  pending_approval: 'Pendiente aprobación',
  approved: 'Aprobado',
  rejected: 'Rechazado',
  sent: 'Enviado',
  accepted: 'Aceptado',
  declined: 'Declinado',
  requested: 'Solicitado',
}

interface Props {
  searchParams: Promise<{ tab?: string }>
}

export default async function PresupuestosPage({ searchParams }: Props) {
  const user = await getUser()
  if (!user) redirect('/login')

  const { tab = 'mine' } = await searchParams
  const admin = isAdmin(user.role)

  const [myQuotes, pendingQuotes, allQuotes, pendingRequests] = await Promise.all([
    getAllQuotes({ salesPersonId: user.id }),
    admin ? getAllQuotes({ status: 'pending_approval' }) : Promise.resolve([]),
    admin ? getAllQuotes() : Promise.resolve([]),
    admin ? getPendingQuoteRequests() : Promise.resolve([]),
  ])

  const activeTab = tab === 'pending' && admin ? 'pending' : tab === 'all' && admin ? 'all' : 'mine'
  const displayedQuotes =
    activeTab === 'pending' ? pendingQuotes : activeTab === 'all' ? allQuotes : myQuotes

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Presupuestos</h1>
          <p className="text-sm text-muted-foreground">Gestioná presupuestos y aprobaciones.</p>
        </div>
        <Link href="/admin/presupuestos/nuevo" className={buttonVariants()}>
          + Nuevo Presupuesto
        </Link>
      </div>

      {/* Pending quote requests section (admin only) */}
      {admin && pendingRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Solicitudes de presupuesto pendientes{' '}
              <Badge variant="secondary" className="ml-2">
                {pendingRequests.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Cliente</th>
                  <th className="px-4 py-3 font-medium">Solicitado</th>
                  <th className="px-4 py-3 font-medium" />
                </tr>
              </thead>
              <tbody>
                {pendingRequests.map((req) => (
                  <tr key={req.id} className="border-b last:border-0 hover:bg-muted/40">
                    <td className="px-4 py-3 font-medium">
                      {req.clientName ?? 'Cliente desconocido'}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(req.createdAt).toLocaleDateString('es-AR')}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <form
                        action={async () => {
                          'use server'
                          const result = await convertQuoteRequest(req.id)
                          if (result.success) {
                            redirect(`/admin/presupuestos/${result.data.quoteId}`)
                          }
                        }}
                      >
                        <Button type="submit" size="sm">
                          Crear presupuesto
                        </Button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <Link
          href="/admin/presupuestos?tab=mine"
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'mine'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Mis Presupuestos ({myQuotes.length})
        </Link>
        {admin && (
          <>
            <Link
              href="/admin/presupuestos?tab=pending"
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'pending'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              Para aprobar
              {pendingQuotes.length > 0 && (
                <Badge className="ml-2 bg-yellow-100 text-yellow-700">{pendingQuotes.length}</Badge>
              )}
            </Link>
            <Link
              href="/admin/presupuestos?tab=all"
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'all'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              Todos los presupuestos
            </Link>
          </>
        )}
      </div>

      {/* Quotes table */}
      <Card>
        <CardContent className="p-0">
          {displayedQuotes.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">No se encontraron presupuestos.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Cliente</th>
                  <th className="px-4 py-3 font-medium">Vendedor</th>
                  <th className="px-4 py-3 font-medium">Fecha</th>
                  <th className="px-4 py-3 font-medium text-right">Ítems</th>
                  <th className="px-4 py-3 font-medium text-right">Total</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                  <th className="px-4 py-3 font-medium" />
                </tr>
              </thead>
              <tbody>
                {displayedQuotes.map((q) => (
                  <tr key={q.id} className="border-b last:border-0 hover:bg-muted/40">
                    <td className="px-4 py-3 font-medium">{q.clientName ?? '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{q.salespersonName}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(q.createdAt).toLocaleDateString('es-AR')}
                    </td>
                    <td className="px-4 py-3 text-right">{q.itemCount}</td>
                    <td className="px-4 py-3 text-right font-mono">
                      ${Number(q.total).toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={STATUS_COLORS[q.status] ?? 'bg-gray-100 text-gray-700'}>
                        {STATUS_LABELS[q.status] ?? q.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/presupuestos/${q.id}`}
                        className={buttonVariants({ variant: 'outline', size: 'sm' })}
                      >
                        Ver
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
