'use client'

import { useState, useTransition } from 'react'
import { updateScoringConfig, triggerRecalculate } from '@/lib/scoring/actions'
import type { ScoringConfig } from '@/db/schema/scoring_config'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface Props {
  initialConfig: ScoringConfig[]
}

const FACTOR_LABELS: Record<string, string> = {
  volume: 'Volumen de compra',
  frequency: 'Frecuencia de pedidos',
  payment: 'Comportamiento de pago',
}

interface FactorState {
  factor: 'volume' | 'frequency' | 'payment'
  weight: number
  enabled: boolean
}

function buildInitialState(config: ScoringConfig[]): FactorState[] {
  const factors: Array<'volume' | 'frequency' | 'payment'> = ['volume', 'frequency', 'payment']
  return factors.map((f) => {
    const row = config.find((c) => c.factor === f)
    return { factor: f, weight: row?.weight ?? 0, enabled: row?.enabled ?? true }
  })
}

export function ScoringConfigForm({ initialConfig }: Props) {
  const [factors, setFactors] = useState<FactorState[]>(() =>
    buildInitialState(initialConfig)
  )
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [recalcPending, startRecalc] = useTransition()
  const [savePending, startSave] = useTransition()

  const enabledSum = factors.filter((f) => f.enabled).reduce((s, f) => s + f.weight, 0)
  const isValid = enabledSum === 100

  function updateFactor(idx: number, changes: Partial<FactorState>) {
    setFactors((prev) => prev.map((f, i) => (i === idx ? { ...f, ...changes } : f)))
    setSuccess(false)
    setError(null)
  }

  function handleSave() {
    setError(null)
    setSuccess(false)
    startSave(async () => {
      const result = await updateScoringConfig(factors)
      if (result.success) {
        setSuccess(true)
      } else {
        setError(result.error)
      }
    })
  }

  async function handleRecalculate() {
    startRecalc(async () => {
      try {
        const data = await triggerRecalculate()
        alert(`Recalculación completa. Procesados: ${data.processed}, Errores: ${data.errors?.length ?? 0}`)
      } catch {
        alert('Error al recalcular. Revisá los logs del servidor.')
      }
    })
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {factors.map((factor, idx) => (
          <div
            key={factor.factor}
            className="flex items-center gap-4 p-4 rounded-lg border bg-card"
          >
            <input
              type="checkbox"
              id={`enabled-${factor.factor}`}
              checked={factor.enabled}
              onChange={(e) => updateFactor(idx, { enabled: e.target.checked })}
              className="h-4 w-4 accent-primary"
            />
            <Label
              htmlFor={`enabled-${factor.factor}`}
              className="flex-1 font-medium cursor-pointer"
            >
              {FACTOR_LABELS[factor.factor]}
            </Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={0}
                max={100}
                value={factor.weight}
                onChange={(e) => updateFactor(idx, { weight: Number(e.target.value) })}
                disabled={!factor.enabled}
                className="w-20 text-right"
              />
              <span className="text-sm text-muted-foreground">%</span>
            </div>
          </div>
        ))}
      </div>

      {/* Weight sum indicator */}
      <div
        className={`text-sm font-medium ${isValid ? 'text-green-600' : 'text-red-500'}`}
      >
        Total habilitado: {enabledSum}% {isValid ? '✓' : '(debe ser igual a 100)'}
      </div>

      {error && (
        <p className="text-sm text-red-500 bg-red-50 p-3 rounded-md">{error}</p>
      )}
      {success && (
        <p className="text-sm text-green-600 bg-green-50 p-3 rounded-md">
          Configuración guardada correctamente.
        </p>
      )}

      <div className="flex gap-3">
        <Button onClick={handleSave} disabled={!isValid || savePending}>
          {savePending ? 'Guardando...' : 'Guardar'}
        </Button>
        <Button
          variant="outline"
          onClick={handleRecalculate}
          disabled={recalcPending}
        >
          {recalcPending ? 'Recalculando...' : 'Recalcular todos ahora'}
        </Button>
      </div>
    </div>
  )
}
