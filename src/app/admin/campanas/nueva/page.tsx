export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { resolveSegment, type SegmentFilter } from '@/lib/campaigns/queries'
import { createCampaign } from '@/lib/campaigns/actions'

// Server action for form submission
async function handleCreateCampaign(formData: FormData) {
  'use server'

  const name = formData.get('name') as string
  const subject = formData.get('subject') as string
  const htmlContent = formData.get('htmlContent') as string
  const segmentType = formData.get('segmentType') as string
  const bcraRiskLevel = formData.get('bcraRiskLevel') as string | null
  const minScoreRaw = formData.get('minScore') as string | null
  const scheduleType = formData.get('scheduleType') as string

  const industry = formData.get('industry') as string | null

  let segmentFilter: SegmentFilter
  if (segmentType === 'bcra_risk' && bcraRiskLevel) {
    segmentFilter = { type: 'bcra_risk', riskLevel: bcraRiskLevel }
  } else if (segmentType === 'min_score' && minScoreRaw) {
    segmentFilter = { type: 'min_score', minScore: Number(minScoreRaw) }
  } else if (segmentType === 'by_industry' && industry) {
    segmentFilter = { type: 'by_industry', industry }
  } else {
    segmentFilter = { type: 'all' }
  }

  let scheduledAt: Date | null = null
  if (scheduleType === 'schedule') {
    const scheduledAtRaw = formData.get('scheduledAt') as string
    if (scheduledAtRaw) {
      scheduledAt = new Date(scheduledAtRaw)
    }
  }

  const result = await createCampaign({
    name,
    subject,
    htmlContent,
    segmentFilter,
    scheduledAt,
  })

  if (result.success) {
    redirect(`/admin/campanas/${result.data.id}`)
  }
}

export default async function NuevaCampanaPage() {
  // Precompute "all clients" count for the default preview
  const allCount = await resolveSegment({ type: 'all' }).then((r) => r.length)

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Nueva Campaña</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Creá una campaña de email para enviar a un segmento de tus clientes.
        </p>
      </div>

      <form action={handleCreateCampaign} className="space-y-6">
        {/* Campaign name */}
        <div className="space-y-1">
          <label htmlFor="name" className="text-sm font-medium">
            Nombre de la campaña
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            placeholder="ej. Promociones de julio"
            className="w-full rounded-md border px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Subject line */}
        <div className="space-y-1">
          <label htmlFor="subject" className="text-sm font-medium">
            Asunto del email
          </label>
          <input
            id="subject"
            name="subject"
            type="text"
            required
            placeholder="ej. Oferta especial para vos este mes"
            className="w-full rounded-md border px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* HTML content */}
        <div className="space-y-1">
          <label htmlFor="htmlContent" className="text-sm font-medium">
            Contenido del email (HTML)
          </label>
          <textarea
            id="htmlContent"
            name="htmlContent"
            required
            rows={10}
            placeholder="<p>¡Hola! Tenemos una oferta especial para vos...</p>"
            className="w-full rounded-md border px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
          />
        </div>

        {/* Segment filter */}
        <div className="space-y-3">
          <label className="text-sm font-medium">Segmento de destinatarios</label>
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm">
              <input type="radio" name="segmentType" value="all" defaultChecked />
              Todos los clientes ({allCount} destinatarios)
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="radio" name="segmentType" value="bcra_risk" />
              Por nivel de riesgo BCRA
            </label>
            <div className="pl-6">
              <select
                name="bcraRiskLevel"
                className="rounded-md border px-3 py-2 text-sm bg-background"
              >
                <option value="normal">Normal</option>
                <option value="con_seguimiento">Con seguimiento</option>
                <option value="riesgo">Riesgo</option>
                <option value="irrecuperable">Irrecuperable</option>
              </select>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="radio" name="segmentType" value="min_score" />
              Por score mínimo
            </label>
            <div className="pl-6 flex items-center gap-2">
              <input
                type="number"
                name="minScore"
                min={0}
                max={5}
                step={0.5}
                placeholder="ej. 3.5"
                className="w-24 rounded-md border px-3 py-2 text-sm bg-background"
              />
              <span className="text-sm text-muted-foreground">estrellas o más</span>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="radio" name="segmentType" value="by_industry" />
              Por industria
            </label>
            <div className="pl-6">
              <input
                type="text"
                name="industry"
                placeholder="ej. Automotriz, Minería, Agricultura"
                className="w-64 rounded-md border px-3 py-2 text-sm bg-background"
              />
            </div>
          </div>
        </div>

        {/* Schedule */}
        <div className="space-y-3">
          <label className="text-sm font-medium">Envío</label>
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm">
              <input type="radio" name="scheduleType" value="now" defaultChecked />
              Crear como borrador (enviar manualmente desde el detalle)
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="radio" name="scheduleType" value="schedule" />
              Programar
            </label>
            <div className="pl-6">
              <input
                type="datetime-local"
                name="scheduledAt"
                className="rounded-md border px-3 py-2 text-sm bg-background"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-3">
          <button
            type="submit"
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Crear Campaña
          </button>
          <a
            href="/admin/campanas"
            className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            Cancelar
          </a>
        </div>
      </form>
    </div>
  )
}
