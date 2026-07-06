export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/db'
import { profiles, clients } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { getQuotesByClient } from '@/lib/quotes/queries'
import { isCliente } from '@/lib/auth/roles'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { FileText, ShoppingBag, Clock } from 'lucide-react'

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
  draft: 'En proceso',
  pending_approval: 'En revisión',
  approved: 'Aprobado',
  rejected: 'Rechazado',
  sent: 'Listo para revisar',
  accepted: 'Aceptado',
  declined: 'Declinado',
  requested: 'Solicitado',
}

// Only show totals when the quote is in a "visible price" status
const PRICE_VISIBLE_STATUSES = new Set(['sent', 'accepted', 'declined'])

function formatCurrency(value: string | number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(Number(value))
}

export default async function MiCuentaPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Fetch profile to verify role and get name
  const [profile] = await db
    .select({ fullName: profiles.fullName, role: profiles.role })
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1)

  if (!profile || !isCliente(profile.role)) {
    redirect('/admin/dashboard')
  }

  // Get the client record linked to this profile
  const [clientRecord] = await db
    .select({ id: clients.id })
    .from(clients)
    .where(eq(clients.profileId, user.id))
    .limit(1)

  if (!clientRecord) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Mi cuenta</h1>
        <p className="text-sm text-muted-foreground">
          Tu cuenta todavía no tiene un perfil de cliente activo. Contactanos para completar el registro.
        </p>
      </div>
    )
  }

  const allQuotes = await getQuotesByClient(clientRecord.id)

  // Counters by status group
  const pendingCount = allQuotes.filter((q) => q.status === 'sent').length
  const inProgressCount = allQuotes.filter(
    (q) => q.status === 'approved' || q.status === 'pending_approval'
  ).length
  const purchasesCount = allQuotes.filter((q) => q.status === 'accepted').length

  const recentQuotes = allQuotes.slice(0, 5)

  const firstName = profile.fullName?.split(' ')[0] ?? 'cliente'

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold">Hola, {firstName}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Desde acá podés revisar tus presupuestos y el historial de compras.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Para revisar</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{pendingCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Presupuestos listos para tu respuesta</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En proceso</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{inProgressCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Aprobados o en revisión interna</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compras realizadas</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{purchasesCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Presupuestos aceptados</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent quotes */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Presupuestos recientes</h2>
          <Link
            href="/mis-presupuestos"
            className={buttonVariants({ variant: 'outline', size: 'sm' })}
          >
            Ver todos
          </Link>
        </div>

        <Card>
          <CardContent className="p-0">
            {recentQuotes.length === 0 ? (
              <p className="p-6 text-sm text-muted-foreground">
                Todavía no tenés presupuestos. Agregá productos a tu{' '}
                <Link href="/mi-lista" className="underline">
                  lista de interés
                </Link>{' '}
                y solicitá uno.
              </p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="px-4 py-3 font-medium">N°</th>
                    <th className="px-4 py-3 font-medium">Fecha</th>
                    <th className="px-4 py-3 font-medium">Estado</th>
                    <th className="px-4 py-3 font-medium">Total</th>
                    <th className="px-4 py-3 font-medium" />
                  </tr>
                </thead>
                <tbody>
                  {recentQuotes.map((q) => (
                    <tr key={q.id} className="border-b last:border-0 hover:bg-muted/40">
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                        #{q.id.slice(0, 8).toUpperCase()}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {new Date(q.createdAt).toLocaleDateString('es-AR')}
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={STATUS_COLORS[q.status] ?? 'bg-gray-100'}>
                          {STATUS_LABELS[q.status] ?? q.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        {PRICE_VISIBLE_STATUSES.has(q.status)
                          ? formatCurrency(q.total)
                          : <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/mis-presupuestos/${q.id}`}
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

      {/* Quick actions */}
      <div className="flex flex-wrap gap-3">
        <Link href="/catalogo" className={buttonVariants({ variant: 'default' })}>
          Ver catálogo
        </Link>
        <Link href="/mis-presupuestos" className={buttonVariants({ variant: 'outline' })}>
          Mis presupuestos
        </Link>
      </div>
    </div>
  )
}
