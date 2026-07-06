/**
 * AFIP validation cache — reads/writes to clients table afip_* columns.
 * TTL: 24 hours (from app_config or env fallback).
 */

import { db } from '@/db'
import { clients } from '@/db/schema'
import { eq } from 'drizzle-orm'
import type { AfipValidationResult } from './index'

const CACHE_TTL_HOURS = 24

function isCacheValid(cachedAt: Date | null): boolean {
  if (!cachedAt) return false
  const ageMs = Date.now() - cachedAt.getTime()
  return ageMs < CACHE_TTL_HOURS * 60 * 60 * 1000
}

export async function getCachedAfipResult(
  cuit: string
): Promise<AfipValidationResult | null> {
  const rows = await db
    .select({
      afipStatus: clients.afipStatus,
      afipCachedAt: clients.afipCachedAt,
      razonSocial: clients.razonSocial,
    })
    .from(clients)
    .where(eq(clients.cuit, cuit))
    .limit(1)

  const row = rows[0]
  if (!row || !isCacheValid(row.afipCachedAt)) return null

  if (row.afipStatus === 'validated') {
    return {
      valid: true,
      persona: {
        idPersona: cuit.replace(/-/g, ''),
        tipoClave: 'CUIT',
        tipoPersona: 'JURIDICA',
        estadoClave: 'ACTIVO',
        razonSocial: row.razonSocial ?? undefined,
      },
    }
  }

  if (row.afipStatus === 'invalid') {
    return { valid: false, reason: 'not_found' }
  }

  return null
}

export async function setCachedAfipResult(
  cuit: string,
  result: AfipValidationResult
): Promise<void> {
  const now = new Date()

  await db
    .update(clients)
    .set({
      afipStatus: result.valid ? 'validated' : 'invalid',
      afipCachedAt: now,
      razonSocial: result.valid
        ? (result.persona.razonSocial ?? result.persona.nombre ?? null)
        : undefined,
      updatedAt: now,
    })
    .where(eq(clients.cuit, cuit))
}
