import { createClient } from '@/lib/supabase/server'
import { db } from '@/db'
import { profiles } from '@/db/schema'
import { eq } from 'drizzle-orm'
import type { AppRole } from '@/db/schema'
import { cookies } from 'next/headers'

export type AuthUser = {
  id: string
  email: string | undefined
  role: AppRole
  fullName: string | null
  companyName: string | null
}

export async function getUser(): Promise<AuthUser | null> {
  // Dev bypass: when Supabase is not configured, read from dev cookie
  if (process.env.NODE_ENV !== 'production') {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
    if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
      const { getDevUserById, DEV_COOKIE } = await import('./dev-session')
      const cookieStore = await cookies()
      const profileId = cookieStore.get(DEV_COOKIE)?.value
      if (profileId) return getDevUserById(profileId)
      return null
    }
  }

  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) return null

  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1)

  if (!profile) return null

  return {
    id: user.id,
    email: user.email,
    role: profile.role,
    fullName: profile.fullName,
    companyName: profile.companyName ?? null,
  }
}

export async function requireUser(): Promise<AuthUser> {
  const user = await getUser()
  if (!user) {
    throw new Error('Unauthorized')
  }
  return user
}

export async function requireAdmin(): Promise<AuthUser> {
  const user = await requireUser()
  if (user.role !== 'admin_general' && user.role !== 'admin_secundario') {
    throw new Error('Forbidden: admin role required')
  }
  return user
}
