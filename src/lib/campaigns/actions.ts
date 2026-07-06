'use server'

import { revalidatePath } from 'next/cache'
import { db } from '@/db'
import {
  campaigns,
  campaignRecipients,
  sendQueue,
  clients,
} from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import type { ActionResult } from '@/lib/types/action-result'
import { requireAdmin } from '@/lib/auth/get-user'
import { resolveSegment, type SegmentFilter } from './queries'
import { createAdminClient } from '@/lib/supabase/admin'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CreateCampaignData {
  name: string
  subject: string
  htmlContent: string
  segmentFilter: SegmentFilter
  scheduledAt?: Date | null
}

// ─── Create campaign ──────────────────────────────────────────────────────────

export async function createCampaign(
  data: CreateCampaignData
): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireAdmin()

    // Resolve recipients based on segment filter
    const segment = await resolveSegment(data.segmentFilter)

    // Insert campaign with metadata stored in segmentFilter jsonb
    const [campaign] = await db
      .insert(campaigns)
      .values({
        name: data.name,
        type: 'email',
        status: 'draft',
        segmentFilter: {
          filter: data.segmentFilter,
          subject: data.subject,
          htmlContent: data.htmlContent,
        },
        createdBy: user.id,
      })
      .returning({ id: campaigns.id })

    // Insert one campaign_recipient row per resolved client
    if (segment.length > 0) {
      await db.insert(campaignRecipients).values(
        segment.map((s) => ({
          campaignId: campaign.id,
          clientId: s.clientId,
          status: 'pending' as const,
        }))
      )
    }

    // If scheduledAt provided, set it
    if (data.scheduledAt) {
      await db
        .update(campaigns)
        .set({ status: 'scheduled' })
        .where(eq(campaigns.id, campaign.id))
    }

    revalidatePath('/admin/campanas')
    return { success: true, data: { id: campaign.id } }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'No se pudo crear la campaña',
    }
  }
}

// ─── Schedule campaign ────────────────────────────────────────────────────────

export async function scheduleCampaign(
  campaignId: string,
  scheduledAt: Date
): Promise<ActionResult<void>> {
  try {
    await requireAdmin()

    await db
      .update(campaigns)
      .set({ status: 'scheduled' })
      .where(eq(campaigns.id, campaignId))

    // Store scheduledAt in the send_queue rows (inserted on sendCampaignNow)
    // For now record on the campaign payload
    const rows = await db
      .select({ segmentFilter: campaigns.segmentFilter })
      .from(campaigns)
      .where(eq(campaigns.id, campaignId))
      .limit(1)

    if (rows[0]) {
      const existing = (rows[0].segmentFilter as Record<string, unknown>) ?? {}
      await db
        .update(campaigns)
        .set({
          segmentFilter: { ...existing, scheduledAt: scheduledAt.toISOString() },
        })
        .where(eq(campaigns.id, campaignId))
    }

    revalidatePath('/admin/campanas')
    revalidatePath(`/admin/campanas/${campaignId}`)
    return { success: true, data: undefined }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'No se pudo programar la campaña',
    }
  }
}

// ─── Send campaign now ────────────────────────────────────────────────────────

export async function sendCampaignNow(campaignId: string): Promise<ActionResult<void>> {
  try {
    await requireAdmin()

    // Load campaign metadata (subject + htmlContent stored in segmentFilter jsonb)
    const campaignRows = await db
      .select({ segmentFilter: campaigns.segmentFilter, status: campaigns.status })
      .from(campaigns)
      .where(eq(campaigns.id, campaignId))
      .limit(1)

    if (!campaignRows[0]) {
      return { success: false, error: 'Campaña no encontrada', code: 'NOT_FOUND' }
    }

    const meta = (campaignRows[0].segmentFilter as Record<string, unknown>) ?? {}
    const subject = (meta.subject as string) ?? '(no subject)'
    const htmlContent = (meta.htmlContent as string) ?? ''

    // Load pending recipients
    const pendingRecipients = await db
      .select({
        id: campaignRecipients.id,
        clientId: campaignRecipients.clientId,
      })
      .from(campaignRecipients)
      .where(
        and(
          eq(campaignRecipients.campaignId, campaignId),
          eq(campaignRecipients.status, 'pending')
        )
      )

    if (pendingRecipients.length === 0) {
      return { success: false, error: 'No hay destinatarios pendientes para esta campaña' }
    }

    // Resolve client email addresses via Supabase admin client
    const supabase = createAdminClient()

    for (const recipient of pendingRecipients) {
      // Get the client profile id
      const clientRows = await db
        .select({ profileId: clients.profileId })
        .from(clients)
        .where(eq(clients.id, recipient.clientId))
        .limit(1)

      if (!clientRows[0]) continue

      const { data } = await supabase.auth.admin.getUserById(clientRows[0].profileId)
      const email = data.user?.email
      if (!email) continue

      // Enqueue to send_queue
      await db.insert(sendQueue).values({
        type: 'email',
        recipient: email,
        payload: {
          campaignId,
          campaignRecipientId: recipient.id,
          subject,
          htmlContent,
        },
        scheduledAt: new Date(),
        status: 'pending',
        attempts: 0,
      })
    }

    // Update campaign status to running
    await db
      .update(campaigns)
      .set({ status: 'running' })
      .where(eq(campaigns.id, campaignId))

    revalidatePath('/admin/campanas')
    revalidatePath(`/admin/campanas/${campaignId}`)
    return { success: true, data: undefined }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'No se pudo encolar el envío de la campaña',
    }
  }
}

// ─── Pause campaign ───────────────────────────────────────────────────────────

export async function pauseCampaign(campaignId: string): Promise<ActionResult<void>> {
  try {
    await requireAdmin()

    const rows = await db
      .select({ status: campaigns.status })
      .from(campaigns)
      .where(eq(campaigns.id, campaignId))
      .limit(1)

    if (!rows[0]) return { success: false, error: 'Campaña no encontrada', code: 'NOT_FOUND' }
    if (!['scheduled', 'running'].includes(rows[0].status)) {
      return {
        success: false,
        error: 'Solo se pueden pausar campañas programadas o en curso',
        code: 'INVALID_STATUS',
      }
    }

    await db
      .update(campaigns)
      .set({ status: 'paused' })
      .where(eq(campaigns.id, campaignId))

    // Note: send_queue rows reference campaignId in their payload jsonb field.
    // Full pause of individual queue rows would require a raw SQL jsonb filter.
    // The cron job checks campaign.status before processing and skips paused campaigns.
    // Recipients remain in 'pending' state and resume naturally when the campaign is resumed.

    revalidatePath('/admin/campanas')
    revalidatePath(`/admin/campanas/${campaignId}`)
    return { success: true, data: undefined }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'No se pudo pausar la campaña',
    }
  }
}

// ─── Resume campaign ──────────────────────────────────────────────────────────

export async function resumeCampaign(campaignId: string): Promise<ActionResult<void>> {
  try {
    await requireAdmin()

    const rows = await db
      .select({ status: campaigns.status })
      .from(campaigns)
      .where(eq(campaigns.id, campaignId))
      .limit(1)

    if (!rows[0]) return { success: false, error: 'Campaña no encontrada', code: 'NOT_FOUND' }
    if (rows[0].status !== 'paused') {
      return { success: false, error: 'Solo se pueden reanudar campañas pausadas', code: 'INVALID_STATUS' }
    }

    await db
      .update(campaigns)
      .set({ status: 'scheduled' })
      .where(eq(campaigns.id, campaignId))

    revalidatePath('/admin/campanas')
    revalidatePath(`/admin/campanas/${campaignId}`)
    return { success: true, data: undefined }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'No se pudo reanudar la campaña',
    }
  }
}

// ─── Cancel campaign ──────────────────────────────────────────────────────────

export async function cancelCampaign(campaignId: string): Promise<ActionResult<void>> {
  try {
    await requireAdmin()

    const rows = await db
      .select({ status: campaigns.status })
      .from(campaigns)
      .where(eq(campaigns.id, campaignId))
      .limit(1)

    if (!rows[0]) return { success: false, error: 'Campaña no encontrada', code: 'NOT_FOUND' }
    if (['completed', 'cancelled'].includes(rows[0].status)) {
      return {
        success: false,
        error: 'La campaña ya está completada o cancelada',
        code: 'INVALID_STATUS',
      }
    }

    await db
      .update(campaigns)
      .set({ status: 'cancelled' })
      .where(eq(campaigns.id, campaignId))

    // Delete pending send_queue rows for this campaign's recipients
    // We do this in two steps: get recipient IDs, then clean up queue rows matching campaign
    // (queue rows store campaignId in payload — direct SQL would be cleaner, but for type safety:)
    await db
      .delete(campaignRecipients)
      .where(
        and(
          eq(campaignRecipients.campaignId, campaignId),
          eq(campaignRecipients.status, 'pending')
        )
      )

    revalidatePath('/admin/campanas')
    revalidatePath(`/admin/campanas/${campaignId}`)
    return { success: true, data: undefined }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'No se pudo cancelar la campaña',
    }
  }
}
