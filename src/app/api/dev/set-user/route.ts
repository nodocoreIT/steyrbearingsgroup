import { NextRequest, NextResponse } from 'next/server'
import { DEV_PROFILES, DEV_COOKIE } from '@/lib/auth/dev-session'

// Guard: this endpoint only works in development
export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 })
  }

  const { profileId } = await request.json()

  const response = NextResponse.json({ ok: true })

  if (!profileId) {
    // Clear — log out
    response.cookies.delete(DEV_COOKIE)
    return response
  }

  if (!DEV_PROFILES[profileId]) {
    return NextResponse.json({ error: 'Unknown profile ID' }, { status: 400 })
  }

  response.cookies.set(DEV_COOKIE, profileId, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    // No maxAge — session cookie only
  })

  return response
}
