export const dynamic = 'force-dynamic'

import { getScoringConfig, getLastRecalculationDate } from '@/lib/scoring/actions'
import { ScoringConfigForm } from '@/components/features/settings/ScoringConfigForm'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default async function ScoringSettingsPage() {
  const [config, lastRecalc] = await Promise.all([
    getScoringConfig(),
    getLastRecalculationDate(),
  ])

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Configuración de Scoring</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Configurá los pesos de cada factor de scoring. Los pesos habilitados deben sumar 100.
        </p>
      </div>

      {lastRecalc && (
        <p className="text-xs text-muted-foreground">
          Último recálculo:{' '}
          {new Date(lastRecalc).toLocaleString('es-AR', {
            dateStyle: 'medium',
            timeStyle: 'short',
          })}
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Factores de Scoring</CardTitle>
          <CardDescription>
            Habilitá o deshabilitá factores y asigná su peso (%). Solo los factores habilitados
            se cuentan; sus pesos deben sumar 100.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScoringConfigForm initialConfig={config} />
        </CardContent>
      </Card>
    </div>
  )
}
