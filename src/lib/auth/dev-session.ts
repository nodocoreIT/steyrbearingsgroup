/**
 * DEV-ONLY auth bypass.
 * Never imported in production — all exports are guarded by NODE_ENV check.
 */

import type { AuthUser } from './get-user'

export const DEV_PROFILES: Record<string, AuthUser & { label: string }> = {
  '11111111-0000-4000-a000-000000000001': {
    id: '11111111-0000-4000-a000-000000000001',
    email: 'diego@seekingbusiness.com',
    role: 'admin_general',
    fullName: 'Diego Rodríguez',
    companyName: 'Seeking Business',
    label: 'Admin General (Diego)',
  },
  '11111111-0000-4000-a000-000000000002': {
    id: '11111111-0000-4000-a000-000000000002',
    email: 'laura@seekingbusiness.com',
    role: 'admin_secundario',
    fullName: 'Laura Méndez',
    companyName: 'Seeking Business',
    label: 'Admin Secundario (Laura)',
  },
  '11111111-0000-4000-a000-000000000003': {
    id: '11111111-0000-4000-a000-000000000003',
    email: 'martin@seekingbusiness.com',
    role: 'vendedor',
    fullName: 'Martín Ferreyra',
    companyName: 'Seeking Business',
    label: 'Vendedor (Martín)',
  },
  '22222222-0000-4000-a000-000000000001': {
    id: '22222222-0000-4000-a000-000000000001',
    email: 'carlos@maquinariasdelsur.com',
    role: 'cliente',
    fullName: 'Carlos Ibáñez',
    companyName: 'Maquinarias del Sur S.A.',
    label: 'Cliente (Carlos)',
  },
  '22222222-0000-4000-a000-000000000002': {
    id: '22222222-0000-4000-a000-000000000002',
    email: 'patricia@metalurgica.com',
    role: 'cliente',
    fullName: 'Patricia Suárez',
    companyName: 'Metalúrgica Rosario S.R.L.',
    label: 'Cliente (Patricia)',
  },
}

export const DEV_COOKIE = 'dev_profile_id'

export function isDevMode(): boolean {
  return (
    process.env.NODE_ENV !== 'production' &&
    (!process.env.NEXT_PUBLIC_SUPABASE_URL ||
      process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder') ||
      process.env.NEXT_PUBLIC_SUPABASE_URL === '')
  )
}

export function getDevUserById(profileId: string): AuthUser | null {
  const profile = DEV_PROFILES[profileId]
  if (!profile) return null
  // Strip the label field — return only AuthUser shape
  const { label: _label, ...user } = profile
  return user
}
