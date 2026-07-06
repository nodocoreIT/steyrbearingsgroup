/**
 * AFIP SOA public endpoint (community-maintained).
 * GET https://soa.afip.gob.ar/sr-padron/v2/persona/{cuit}
 */

import { normalizeCuit, isValidCuit } from '@/lib/utils/cuit'

export interface AfipPersona {
  idPersona: string
  tipoClave: string
  tipoPersona: 'JURIDICA' | 'FISICA' | string
  estadoClave: 'ACTIVO' | 'INACTIVO' | 'BLOQUEADO' | string
  nombre?: string
  razonSocial?: string
}

export type AfipValidationResult =
  | { valid: true; persona: AfipPersona }
  | { valid: false; reason: 'not_found' | 'inactive' | 'api_error' | 'invalid_cuit' }

const AFIP_BASE_URL = 'https://soa.afip.gob.ar/sr-padron/v2/persona'
const TIMEOUT_MS = 5000

export async function validateCuitAfip(cuit: string): Promise<AfipValidationResult> {
  // Validate checksum first — no external call if format is bad
  if (!isValidCuit(cuit)) {
    return { valid: false, reason: 'invalid_cuit' }
  }

  const digits = normalizeCuit(cuit)

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const response = await fetch(`${AFIP_BASE_URL}/${digits}`, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    })

    clearTimeout(timer)

    if (response.status === 404) {
      return { valid: false, reason: 'not_found' }
    }

    if (!response.ok) {
      return { valid: false, reason: 'api_error' }
    }

    const json = await response.json()

    if (!json.success || !json.data) {
      return { valid: false, reason: 'not_found' }
    }

    const persona = json.data as AfipPersona

    if (
      persona.estadoClave === 'INACTIVO' ||
      persona.estadoClave === 'BLOQUEADO'
    ) {
      return { valid: false, reason: 'inactive' }
    }

    return { valid: true, persona }
  } catch (err) {
    clearTimeout(timer)
    // AbortError or network error
    return { valid: false, reason: 'api_error' }
  }
}

/**
 * Returns a human-readable display name from an AfipPersona.
 */
export function getAfipDisplayName(persona: AfipPersona): string {
  if (persona.tipoPersona === 'JURIDICA') {
    return persona.razonSocial ?? persona.idPersona
  }
  return persona.nombre ?? persona.idPersona
}
