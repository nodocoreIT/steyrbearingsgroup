import { NextRequest, NextResponse } from 'next/server'
import { validateCuitAfip } from '@/lib/afip/index'
import { isValidCuit } from '@/lib/utils/cuit'

/**
 * GET /api/afip/validate?cuit={cuit}
 * Public endpoint for real-time AFIP CUIT validation during registration.
 * Returns { valid: boolean, persona?: AfipPersona, reason?: string }
 */
export async function GET(request: NextRequest) {
  const cuit = request.nextUrl.searchParams.get('cuit')

  if (!cuit) {
    return NextResponse.json({ valid: false, reason: 'invalid_cuit' }, { status: 400 })
  }

  if (!isValidCuit(cuit)) {
    return NextResponse.json({ valid: false, reason: 'invalid_cuit' })
  }

  const result = await validateCuitAfip(cuit)
  return NextResponse.json(result)
}
