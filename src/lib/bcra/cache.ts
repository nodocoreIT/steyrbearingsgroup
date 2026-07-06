/**
 * BCRA validation cache — reads/writes to clients table bcra_* columns.
 * TTL: 24 hours.
 */

import { db } from '@/db'
import { clients } from '@/db/schema'
import { eq } from 'drizzle-orm'
import type { BcraCheckResult, BcraRiskLevel } from './index'
import { deriveBcraRiskLevel } from './index'

const CACHE_TTL_HOURS = 24

function isCacheValid(cachedAt: Date | null): boolean {
  if (!cachedAt) return false
  const ageMs = Date.now() - cachedAt.getTime()
  return ageMs < CACHE_TTL_HOURS * 60 * 60 * 1000
}

export async function getCachedBcraResult(
  cuit: string
): Promise<BcraCheckResult | null> {
  const rows = await db
    .select({
      bcraStatus: clients.bcraStatus,
      bcraCachedAt: clients.bcraCachedAt,
      bcraRiskLevel: clients.bcraRiskLevel,
    })
    .from(clients)
    .where(eq(clients.cuit, cuit))
    .limit(1)

  const row = rows[0]
  if (!row || !isCacheValid(row.bcraCachedAt)) return null

  if (row.bcraStatus === 'clear' || row.bcraStatus === 'risk') {
    // Return a synthetic result for UI purposes — real items not cached in DB
    const riskMap: Record<string, number> = {
      normal: 1,
      con_seguimiento: 2,
      riesgo: 3,
      irrecuperable: 5,
    }
    const situacionMax = riskMap[row.bcraRiskLevel ?? 'normal'] ?? 1
    return { found: true, situacionMax, items: [] }
  }

  return null
}

export async function setCachedBcraResult(
  cuit: string,
  result: BcraCheckResult
): Promise<void> {
  const now = new Date()
  const riskLevel: BcraRiskLevel = deriveBcraRiskLevel(result)

  const bcraStatus =
    !result.found
      ? 'unavailable'
      : riskLevel === 'normal'
        ? 'clear'
        : 'risk'

  await db
    .update(clients)
    .set({
      bcraStatus: bcraStatus as 'clear' | 'risk' | 'pending' | 'unavailable',
      bcraCachedAt: now,
      bcraRiskLevel: riskLevel,
      updatedAt: now,
    })
    .where(eq(clients.cuit, cuit))
}
