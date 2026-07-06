import { db } from '@/db'
import { voiceConsultations, clients, profiles } from '@/db/schema'
import { eq, and, desc } from 'drizzle-orm'

export type RecipientRole = 'vendedor' | 'admin_general' | 'admin_secundario'

export async function getPendingConsultations(recipientRole: RecipientRole) {
  return db
    .select({
      id: voiceConsultations.id,
      transcript: voiceConsultations.transcript,
      status: voiceConsultations.status,
      recipientRole: voiceConsultations.recipientRole,
      createdAt: voiceConsultations.createdAt,
      clientId: voiceConsultations.clientId,
      clientCuit: clients.cuit,
      clientName: clients.razonSocial,
      clientFullName: profiles.fullName,
    })
    .from(voiceConsultations)
    .innerJoin(clients, eq(clients.id, voiceConsultations.clientId))
    .innerJoin(profiles, eq(profiles.id, clients.profileId))
    .where(
      and(
        eq(voiceConsultations.recipientRole, recipientRole),
        eq(voiceConsultations.status, 'transcribed')
      )
    )
    .orderBy(desc(voiceConsultations.createdAt))
}

export async function getConsultationById(id: string) {
  const rows = await db
    .select({
      id: voiceConsultations.id,
      transcript: voiceConsultations.transcript,
      audioUrl: voiceConsultations.audioUrl,
      status: voiceConsultations.status,
      recipientRole: voiceConsultations.recipientRole,
      createdAt: voiceConsultations.createdAt,
      clientId: voiceConsultations.clientId,
      clientCuit: clients.cuit,
      clientName: clients.razonSocial,
      clientFullName: profiles.fullName,
    })
    .from(voiceConsultations)
    .innerJoin(clients, eq(clients.id, voiceConsultations.clientId))
    .innerJoin(profiles, eq(profiles.id, clients.profileId))
    .where(eq(voiceConsultations.id, id))
    .limit(1)

  return rows[0] ?? null
}

export async function markConsultationResolved(id: string): Promise<void> {
  await db
    .update(voiceConsultations)
    .set({ status: 'pending' }) // reuse pending as "resolved/acknowledged" for now
    .where(eq(voiceConsultations.id, id))
}

export async function getPendingConsultationCount(
  recipientRole: RecipientRole
): Promise<number> {
  const rows = await db
    .select({ id: voiceConsultations.id })
    .from(voiceConsultations)
    .where(
      and(
        eq(voiceConsultations.recipientRole, recipientRole),
        eq(voiceConsultations.status, 'transcribed')
      )
    )
  return rows.length
}
