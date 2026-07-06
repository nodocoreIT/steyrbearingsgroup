export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { db } from '@/db'
import { profiles } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { getPendingConsultations } from '@/lib/voice/queries'
import { Badge } from '@/components/ui/badge'
import { redirect } from 'next/navigation'
import type { RecipientRole } from '@/lib/voice/queries'

function roleBadge(role: string) {
  return role === 'vendedor' ? 'Vendedor' : 'Administrador'
}

export default async function ConsultasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const profileRows = await db
    .select({ role: profiles.role })
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1)

  const userRole = profileRows[0]?.role ?? 'vendedor'

  // Map user role to recipient role for filtering
  const recipientRole: RecipientRole =
    userRole === 'admin_general' || userRole === 'admin_secundario'
      ? 'admin_general'
      : 'vendedor'

  const consultations = await getPendingConsultations(recipientRole)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Consultas de voz</h1>
        <p className="text-muted-foreground text-sm">
          Mostrando {consultations.length} consulta{consultations.length !== 1 ? 's' : ''} pendiente{consultations.length !== 1 ? 's' : ''} para {roleBadge(recipientRole)}es
        </p>
      </div>

      {consultations.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          Sin consultas pendientes.
        </div>
      ) : (
        <div className="space-y-3">
          {consultations.map((c) => (
            <div
              key={c.id}
              className="border rounded-lg p-4 space-y-2 hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <p className="font-medium text-sm">
                    {c.clientName ?? c.clientFullName ?? c.clientCuit}
                  </p>
                  <p className="text-xs text-muted-foreground font-mono">{c.clientCuit}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant="outline">{roleBadge(c.recipientRole)}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(c.createdAt).toLocaleString('es-AR')}
                  </span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {c.transcript ?? '(sin transcripción)'}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
