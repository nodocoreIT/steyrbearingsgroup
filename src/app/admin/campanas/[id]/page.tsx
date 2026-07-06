export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import { getCampaignById, getCampaignStats } from '@/lib/campaigns/queries'
import {
  sendCampaignNow,
  pauseCampaign,
  resumeCampaign,
  cancelCampaign,
} from '@/lib/campaigns/actions'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

interface Props {
  params: Promise<{ id: string }>
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'draft':
      return <Badge variant="outline">Borrador</Badge>
    case 'scheduled':
      return <Badge className="bg-blue-100 text-blue-800">Programada</Badge>
    case 'running':
      return <Badge className="bg-yellow-100 text-yellow-800">En curso</Badge>
    case 'completed':
      return <Badge className="bg-green-100 text-green-800">Completada</Badge>
    case 'paused':
      return <Badge className="bg-orange-100 text-orange-800">Pausada</Badge>
    case 'cancelled':
      return <Badge className="bg-red-100 text-red-800">Cancelada</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

function RecipientStatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'sent':
      return <Badge className="bg-green-100 text-green-800">Enviado</Badge>
    case 'failed':
      return <Badge className="bg-red-100 text-red-800">Fallido</Badge>
    default:
      return <Badge variant="outline">Pendiente</Badge>
  }
}

export default async function CampanaDetailPage({ params }: Props) {
  const { id } = await params
  const data = await getCampaignById(id)

  if (!data) return notFound()

  const { campaign, recipients } = data
  const stats = await getCampaignStats(id)

  const meta = (campaign.segmentFilter as Record<string, unknown>) ?? {}
  const subject = meta.subject as string | undefined
  const scheduledAt = meta.scheduledAt as string | undefined

  const sendAction = async () => {
    'use server'
    await sendCampaignNow(id)
  }

  const pauseAction = async () => {
    'use server'
    await pauseCampaign(id)
  }

  const resumeAction = async () => {
    'use server'
    await resumeCampaign(id)
  }

  const cancelAction = async () => {
    'use server'
    await cancelCampaign(id)
  }

  const canSend = campaign.status === 'draft'
  const canPause = ['scheduled', 'running'].includes(campaign.status)
  const canResume = campaign.status === 'paused'
  const canCancel = !['completed', 'cancelled'].includes(campaign.status)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <Link href="/admin/campanas" className="text-sm text-muted-foreground hover:underline">
            ← Campañas
          </Link>
          <h1 className="text-2xl font-bold mt-1">{campaign.name}</h1>
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <StatusBadge status={campaign.status} />
            <span className="text-sm text-muted-foreground capitalize">{campaign.type}</span>
            {scheduledAt && (
              <span className="text-sm text-muted-foreground">
                Programada: {new Date(scheduledAt).toLocaleString('es-AR')}
              </span>
            )}
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          {canSend && (
            <form action={sendAction}>
              <button
                type="submit"
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Enviar ahora
              </button>
            </form>
          )}
          {canPause && (
            <form action={pauseAction}>
              <button
                type="submit"
                className="rounded-md bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600"
              >
                Pausar
              </button>
            </form>
          )}
          {canResume && (
            <form action={resumeAction}>
              <button
                type="submit"
                className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
              >
                Reanudar
              </button>
            </form>
          )}
          {canCancel && (
            <form action={cancelAction}>
              <button
                type="submit"
                className="rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
              >
                Cancelar
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Subject */}
      {subject && (
        <div className="rounded-lg border p-4 space-y-1">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Asunto</p>
          <p className="text-sm font-medium">{subject}</p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-lg border p-4 space-y-1">
          <p className="text-xs text-muted-foreground">Total destinatarios</p>
          <p className="text-2xl font-bold">{stats.total}</p>
        </div>
        <div className="rounded-lg border p-4 space-y-1">
          <p className="text-xs text-muted-foreground">Enviados</p>
          <p className="text-2xl font-bold text-green-600">{stats.sent}</p>
        </div>
        <div className="rounded-lg border p-4 space-y-1">
          <p className="text-xs text-muted-foreground">Fallidos</p>
          <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
        </div>
        <div className="rounded-lg border p-4 space-y-1">
          <p className="text-xs text-muted-foreground">Pendientes</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
        </div>
      </div>

      {/* Recipients table */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Destinatarios</h2>
        {recipients.length === 0 ? (
          <p className="text-muted-foreground text-sm">Sin destinatarios.</p>
        ) : (
          <div className="rounded-lg border overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium">Cliente</th>
                  <th className="px-4 py-3 text-left font-medium">Estado</th>
                  <th className="px-4 py-3 text-left font-medium">Enviado</th>
                  <th className="px-4 py-3 text-left font-medium">Error</th>
                </tr>
              </thead>
              <tbody>
                {recipients.map((r) => (
                  <tr key={r.id} className="border-b last:border-0">
                    <td className="px-4 py-3">{r.razonSocial ?? r.clientId}</td>
                    <td className="px-4 py-3">
                      <RecipientStatusBadge status={r.status} />
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {r.sentAt ? new Date(r.sentAt).toLocaleString('es-AR') : '—'}
                    </td>
                    <td className="px-4 py-3 text-red-500 text-xs">{r.error ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
