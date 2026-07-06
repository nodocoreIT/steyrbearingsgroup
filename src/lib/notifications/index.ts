import { db } from '@/db'
import { notifications, profiles } from '@/db/schema'
import { eq } from 'drizzle-orm'

// ─── Types ────────────────────────────────────────────────────────────────────

export type NotificationType =
  | 'quote_approved'
  | 'quote_rejected'
  | 'quote_sent'
  | 'new_quote_request'
  | 'no_purchase_alert'
  | 'voice_consultation'
  | 'client_pending_activation'

interface NotificationPayload {
  quoteId?: string
  clientId?: string
  clientName?: string
  requestId?: string
  alertId?: string
  consultationId?: string
  [key: string]: unknown
}

// ─── Title / body builders ────────────────────────────────────────────────────

function buildNotificationContent(
  type: NotificationType,
  payload: NotificationPayload
): { title: string; body: string } {
  switch (type) {
    case 'quote_approved':
      return {
        title: 'Quote approved',
        body: `Quote ${payload.quoteId ? payload.quoteId.slice(0, 8) : ''} has been approved and is ready to send.`,
      }
    case 'quote_rejected':
      return {
        title: 'Quote rejected',
        body: `Quote ${payload.quoteId ? payload.quoteId.slice(0, 8) : ''} was rejected. Please review the comments.`,
      }
    case 'quote_sent':
      return {
        title: 'Quote sent to client',
        body: `Quote ${payload.quoteId ? payload.quoteId.slice(0, 8) : ''} has been sent to the client.`,
      }
    case 'new_quote_request':
      return {
        title: 'New quote request',
        body: `${payload.clientName ?? 'A client'} has requested a quote.`,
      }
    case 'no_purchase_alert':
      return {
        title: 'No-purchase alert',
        body: `Client ${payload.clientName ?? payload.clientId ?? ''} has not purchased recently.`,
      }
    case 'voice_consultation':
      return {
        title: 'Nueva consulta de voz',
        body: 'Hay una consulta de voz pendiente de revisión.',
      }
    case 'client_pending_activation':
      return {
        title: 'Nuevo cliente registrado',
        body: `${payload.clientName ?? 'Un cliente'} se registró y está esperando activación.`,
      }
    default:
      return { title: 'Notificación', body: 'Tenés una nueva notificación.' }
  }
}

// ─── Resolve target user IDs ──────────────────────────────────────────────────

/**
 * Returns the user IDs that should receive this notification.
 * For admin-targeted notifications, finds all admin_general + admin_secundario profiles.
 */
async function resolveTargetUserIds(
  type: NotificationType,
  payload: NotificationPayload
): Promise<string[]> {
  const adminTypes: NotificationType[] = [
    'quote_approved',
    'quote_rejected',
    'quote_sent',
    'new_quote_request',
    'no_purchase_alert',
    'voice_consultation',
    'client_pending_activation',
  ]

  if (adminTypes.includes(type)) {
    // Notify all admins
    const admins = await db
      .select({ id: profiles.id })
      .from(profiles)
      .where(
        eq(profiles.role, 'admin_general')
      )

    const secondaryAdmins = await db
      .select({ id: profiles.id })
      .from(profiles)
      .where(
        eq(profiles.role, 'admin_secundario')
      )

    return [...admins, ...secondaryAdmins].map((a) => a.id)
  }

  return []
}

// ─── Main notify function ─────────────────────────────────────────────────────

/**
 * Fire-and-forget notification helper.
 * Inserts notification records into the database.
 * Never throws — all errors are caught and logged silently.
 */
export async function notify(
  type: NotificationType,
  payload: Record<string, unknown>
): Promise<void> {
  try {
    const targetUserIds = await resolveTargetUserIds(type, payload as NotificationPayload)

    if (targetUserIds.length === 0) return

    const { title, body } = buildNotificationContent(type, payload as NotificationPayload)

    await db.insert(notifications).values(
      targetUserIds.map((userId) => ({
        userId,
        type,
        title,
        body,
        read: false,
        payload,
      }))
    )
  } catch (err) {
    // Never throw — notifications are non-critical
    if (process.env.NODE_ENV === 'development') {
      console.error('[notify] Failed to insert notification:', err)
    }
  }
}
