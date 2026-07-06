export const dynamic = 'force-dynamic'

import { getClientWithScore, getClientValidationStatus } from '@/lib/clients/queries'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { notFound } from 'next/navigation'
import { revalidateClient } from '@/lib/clients/actions'
import Link from 'next/link'
import { db } from '@/db'
import { voiceConsultations } from '@/db/schema'
import { eq, desc } from 'drizzle-orm'
import { ConsultationSummary } from '@/components/features/clients/ConsultationSummary'

interface Props {
  params: Promise<{ id: string }>
}

function AfipStatusSection({ status, cachedAt }: { status: string; cachedAt: Date | null }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Estado AFIP:</span>
        {status === 'validated' && (
          <Badge className="bg-green-100 text-green-800">Validado</Badge>
        )}
        {status === 'pending' && (
          <Badge className="bg-yellow-100 text-yellow-800">Pendiente</Badge>
        )}
        {status === 'invalid' && (
          <Badge className="bg-red-100 text-red-800">Inválido</Badge>
        )}
      </div>
      {cachedAt && (
        <p className="text-xs text-muted-foreground">
          Última verificación: {new Date(cachedAt).toLocaleString('es-AR')}
        </p>
      )}
    </div>
  )
}

function BcraStatusSection({
  status,
  riskLevel,
  cachedAt,
}: {
  status: string
  riskLevel: string | null
  cachedAt: Date | null
}) {
  const riskColors: Record<string, string> = {
    normal: 'bg-green-100 text-green-800',
    con_seguimiento: 'bg-yellow-100 text-yellow-800',
    riesgo: 'bg-orange-100 text-orange-800',
    irrecuperable: 'bg-red-100 text-red-800',
    unknown: 'bg-gray-100 text-gray-800',
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Crédito BCRA:</span>
        {riskLevel ? (
          <Badge className={riskColors[riskLevel] ?? 'bg-gray-100 text-gray-800'}>
            {riskLevel.replace('_', ' ')}
          </Badge>
        ) : (
          <Badge variant="outline">{status}</Badge>
        )}
      </div>
      {cachedAt && (
        <p className="text-xs text-muted-foreground">
          Última verificación: {new Date(cachedAt).toLocaleString('es-AR')}
        </p>
      )}
    </div>
  )
}

export default async function ClienteDetailPage({ params }: Props) {
  const { id } = await params

  const client = await getClientWithScore(id)
  if (!client) notFound()

  const [validation, consultations] = await Promise.all([
    getClientValidationStatus(id),
    db
      .select({
        id: voiceConsultations.id,
        transcript: voiceConsultations.transcript,
        status: voiceConsultations.status,
        createdAt: voiceConsultations.createdAt,
        audioUrl: voiceConsultations.audioUrl,
      })
      .from(voiceConsultations)
      .where(eq(voiceConsultations.clientId, id))
      .orderBy(desc(voiceConsultations.createdAt))
      .limit(5),
  ])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/clientes" className="text-sm text-muted-foreground hover:underline">
          ← Clientes
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold">
          {client.razonSocial ?? client.fullName}
        </h1>
        <p className="text-muted-foreground font-mono">{client.cuit}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Contact info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Contacto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            {client.phone && (
              <p>
                <span className="text-muted-foreground">Teléfono:</span> {client.phone}
              </p>
            )}
            <p>
              <span className="text-muted-foreground">Cliente desde:</span>{' '}
              {new Date(client.createdAt).toLocaleDateString('es-AR')}
            </p>
            {client.assignedSalespersonId && (
              <p>
                <span className="text-muted-foreground">Asignado a:</span>{' '}
                {client.assignedSalespersonId}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Score */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Score</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {client.score !== null ? (
              <>
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span
                      key={i}
                      className={
                        i < Math.round(Number(client.score))
                          ? 'text-yellow-400'
                          : 'text-gray-200'
                      }
                    >
                      ★
                    </span>
                  ))}
                  <span className="ml-2 text-sm font-medium">
                    {Number(client.score).toFixed(1)} / 5.0
                  </span>
                </div>
                {client.scoreLastCalculatedAt && (
                  <p className="text-xs text-muted-foreground">
                    Último cálculo:{' '}
                    {new Date(client.scoreLastCalculatedAt).toLocaleDateString('es-AR')}
                  </p>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Sin score aún.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Validation tab */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Validación</CardTitle>
            <form
              action={async () => {
                'use server'
                await revalidateClient(id)
              }}
            >
              <Button type="submit" variant="outline" size="sm">
                Revalidar
              </Button>
            </form>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {validation ? (
            <>
              <AfipStatusSection
                status={validation.afipStatus}
                cachedAt={validation.afipCachedAt}
              />
              <BcraStatusSection
                status={validation.bcraStatus}
                riskLevel={validation.bcraRiskLevel}
                cachedAt={validation.bcraCachedAt}
              />
              {validation.validationPending && (
                <p className="text-sm text-yellow-600 bg-yellow-50 p-3 rounded-md">
                  Este cliente tiene una validación pendiente. La verificación puede seguir en proceso.
                </p>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Datos de validación no disponibles.</p>
          )}
        </CardContent>
      </Card>

      {/* Voice consultation history */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Historial de consultas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {consultations.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay consultas de voz registradas.</p>
          ) : (
            <>
              <div className="space-y-3">
                {consultations.map((c) => (
                  <div
                    key={c.id}
                    className="p-3 rounded-md border text-sm space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {new Date(c.createdAt).toLocaleString('es-AR')}
                      </span>
                      <Badge
                        className={`text-xs ${
                          c.status === 'resolved'
                            ? 'bg-green-100 text-green-800'
                            : c.status === 'failed'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {c.status}
                      </Badge>
                    </div>
                    {c.transcript ? (
                      <p className="text-muted-foreground line-clamp-2">{c.transcript}</p>
                    ) : (
                      <p className="text-muted-foreground italic">Sin transcripción disponible.</p>
                    )}
                  </div>
                ))}
              </div>

              {/* AI Summary — client component */}
              <ConsultationSummary clientId={id} />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
