import type { AppRole } from '@/db/schema'

export type { AppRole }

export function isAdminGeneral(role: AppRole): boolean {
  return role === 'admin_general'
}

export function isAdmin(role: AppRole): boolean {
  return role === 'admin_general' || role === 'admin_secundario'
}

export function isVendedor(role: AppRole): boolean {
  return role === 'vendedor'
}

export function isCliente(role: AppRole): boolean {
  return role === 'cliente'
}

export function canApproveQuotes(role: AppRole): boolean {
  return isAdmin(role)
}

export function canAccessSettings(role: AppRole): boolean {
  return role === 'admin_general'
}

export function canReadScores(role: AppRole): boolean {
  return isAdmin(role) || isVendedor(role)
}

export const ROLE_LABELS: Record<AppRole, string> = {
  admin_general: 'Admin General',
  admin_secundario: 'Admin Secundario',
  vendedor: 'Vendedor',
  cliente: 'Cliente',
}
