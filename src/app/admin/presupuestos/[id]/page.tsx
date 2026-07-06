export const dynamic = 'force-dynamic'

import { getQuoteById, getQuoteApprovalLog } from '@/lib/quotes/queries'
import { approveQuote, rejectQuote, sendQuoteToClient } from '@/lib/quotes/actions'
import { getUser } from '@/lib/auth/get-user'
import { canApproveQuotes } from '@/lib/auth/roles'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'

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

interface Props {
  params: Promise<{ id: string }>
}

export default async function PresupuestoDetailPage({ params }: Props) {
  const { id } = await params
  const user = await getUser()
  if (!user) redirect('/login')

  const [quote, log] = await Promise.all([
    getQuoteById(id),
    getQuoteApprovalLog(id),
  ])

  if (!quote) notFound()

  const canApprove = canApproveQuotes(user.role)
  const isPendingApproval = quote.status === 'pending_approval'
  const isApproved = quote.status === 'approved'

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Link href="/admin/presupuestos" className="text-sm text-muted-foreground hover:underline">
          ← Presupuestos
        </Link>
      </div>

      {/* Quote header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            Presupuesto — {quote.clientName ?? 'Cliente desconocido'}
          </h1>
          <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
            <span>Vendedor: {quote.salespersonName}</span>
            <span>•</span>
            <span>{new Date(quote.createdAt).toLocaleDateString('es-AR')}</span>
          </div>
        </div>
        <Badge className={STATUS_COLORS[quote.status] ?? 'bg-gray-100'}>
          {quote.status.replace('_', ' ')}
        </Badge>
      </div>

      {/* Items table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ítems</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {quote.items.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">Sin ítems.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Producto</th>
                  <th className="px-4 py-3 font-medium text-right">Cant.</th>
                  <th className="px-4 py-3 font-medium text-right">Precio unit.</th>
                  <th className="px-4 py-3 font-medium text-right">Margen %</th>
                  <th className="px-4 py-3 font-medium text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {quote.items.map((item) => (
                  <tr key={item.id} className="border-b last:border-0">
                    <td className="px-4 py-3">
                      <div className="font-medium">{item.productName}</div>
                      <div className="text-xs text-muted-foreground font-mono">{item.productSku}</div>
                    </td>
                    <td className="px-4 py-3 text-right">{item.quantity}</td>
                    <td className="px-4 py-3 text-right font-mono">
                      ${Number(item.unitPrice).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {Number(item.marginPercent).toFixed(2)}%
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-medium">
                      ${Number(item.subtotal).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t">
                  <td colSpan={4} className="px-4 py-3 text-right font-semibold">
                    Total
                  </td>
                  <td className="px-4 py-3 text-right font-bold font-mono text-lg">
                    ${quote.total.toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Notes */}
      {quote.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Notas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{quote.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Approval actions */}
      {isPendingApproval && canApprove && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Aprobación</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-3">
            <form
              action={async () => {
                'use server'
                await approveQuote(id)
              }}
            >
              <Button type="submit" className="bg-green-600 hover:bg-green-700 text-white">
                Aprobar
              </Button>
            </form>
            <form
              action={async (formData: FormData) => {
                'use server'
                const reason = formData.get('reason') as string
                if (!reason) return
                await rejectQuote(id, reason)
              }}
              className="flex gap-2"
            >
              <input
                name="reason"
                required
                placeholder="Motivo de rechazo..."
                className="rounded-md border border-input bg-background px-3 py-2 text-sm min-w-[200px]"
              />
              <Button type="submit" variant="destructive">
                Rechazar
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Send to client */}
      {isApproved && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Enviar al cliente</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-4">
            <form
              action={async () => {
                'use server'
                await sendQuoteToClient(id)
              }}
            >
              <Button type="submit">Enviar al cliente</Button>
            </form>
            <Link
              href={`/api/quotes/${id}/pdf`}
              target="_blank"
              className={buttonVariants({ variant: 'outline' })}
            >
              Descargar PDF
            </Link>
          </CardContent>
        </Card>
      )}

      {/* PDF download for sent quotes */}
      {quote.status === 'sent' && (
        <div className="flex justify-end">
          <Link
            href={`/api/quotes/${id}/pdf`}
            target="_blank"
            className={buttonVariants({ variant: 'outline' })}
          >
            Descargar PDF
          </Link>
        </div>
      )}

      {/* Approval log */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Historial</CardTitle>
        </CardHeader>
        <CardContent>
          {log.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin historial aún.</p>
          ) : (
            <ol className="relative border-l border-border space-y-4 pl-6">
              {log.map((entry) => (
                <li key={entry.id} className="relative">
                  <div className="absolute -left-[1.625rem] top-1 h-3 w-3 rounded-full border-2 border-background bg-primary" />
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-medium capitalize">
                      {entry.action.replace('_', ' ')}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      by {entry.actorName} —{' '}
                      {new Date(entry.performedAt).toLocaleString('es-AR')}
                    </span>
                  </div>
                  {entry.notes && (
                    <p className="text-sm text-muted-foreground mt-1">{entry.notes}</p>
                  )}
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
