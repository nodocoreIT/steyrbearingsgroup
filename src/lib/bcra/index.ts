/**
 * BCRA Central de Deudores public API.
 * GET https://api.bcra.gob.ar/CentralDeDeudores/v1.0/Deudas/{cuit}
 */

import { normalizeCuit } from '@/lib/utils/cuit'

export interface BcraDeudaItem {
  periodo: string   // "AAAAMM"
  entidad: string
  situacion: number // 1=normal, 2-6=increasing risk
  monto: number
}

export type BcraCheckResult =
  | { found: true; situacionMax: number; items: BcraDeudaItem[] }
  | { found: false; reason: 'no_debts' | 'api_error' }

export type BcraRiskLevel =
  | 'normal'
  | 'con_seguimiento'
  | 'riesgo'
  | 'irrecuperable'
  | 'unknown'

const BCRA_BASE_URL = 'https://api.bcra.gob.ar/CentralDeDeudores/v1.0/Deudas'
const TIMEOUT_MS = 5000

export async function checkCuitBcra(cuit: string): Promise<BcraCheckResult> {
  const digits = normalizeCuit(cuit)

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const response = await fetch(`${BCRA_BASE_URL}/${digits}`, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    })

    clearTimeout(timer)

    if (response.status === 404) {
      return { found: false, reason: 'no_debts' }
    }

    if (!response.ok) {
      return { found: false, reason: 'api_error' }
    }

    const json = await response.json()

    // BCRA returns { results: { periodos: [...] } } or similar shape
    const periodos: Array<{
      periodo: string
      entidades: Array<{ entidad: string; situacion: number; monto: number }>
    }> = json?.results?.periodos ?? json?.periodos ?? []

    if (!periodos || periodos.length === 0) {
      return { found: false, reason: 'no_debts' }
    }

    const items: BcraDeudaItem[] = []
    for (const periodo of periodos) {
      for (const ent of periodo.entidades ?? []) {
        items.push({
          periodo: periodo.periodo,
          entidad: ent.entidad,
          situacion: ent.situacion,
          monto: ent.monto,
        })
      }
    }

    const situacionMax = items.reduce(
      (max, item) => Math.max(max, item.situacion),
      0
    )

    return { found: true, situacionMax, items }
  } catch {
    clearTimeout(timer)
    return { found: false, reason: 'api_error' }
  }
}

export function deriveBcraRiskLevel(result: BcraCheckResult): BcraRiskLevel {
  if (!result.found) return 'unknown'

  const { situacionMax } = result

  if (situacionMax <= 1) return 'normal'
  if (situacionMax === 2) return 'con_seguimiento'
  if (situacionMax <= 4) return 'riesgo'
  return 'irrecuperable'
}
