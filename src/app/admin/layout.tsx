import type { ReactNode } from 'react'
import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  LayoutDashboard,
  Users,
  FileText,
  Package,
  MessageSquare,
  Megaphone,
  Settings,
  BarChart2,
  UserCheck,
  Search,
  Bell,
  ExternalLink,
  LogOut,
} from 'lucide-react'
import { signOut } from '@/lib/auth/actions'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/db'
import { profiles } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { getPendingConsultationCount } from '@/lib/voice/queries'
import { NotificationBell } from '@/components/features/admin/NotificationBell'
import type { RecipientRole } from '@/lib/voice/queries'

async function getNavData() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const profileRows = await db
      .select({ role: profiles.role, fullName: profiles.fullName })
      .from(profiles)
      .where(eq(profiles.id, user.id))
      .limit(1)

    const profile = profileRows[0]
    if (!profile) return null

    const recipientRole: RecipientRole =
      profile.role === 'admin_general' || profile.role === 'admin_secundario'
        ? 'admin_general'
        : 'vendedor'

    const pendingCount = await getPendingConsultationCount(recipientRole)

    return { profile, pendingCount }
  } catch {
    return null
  }
}

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const navData = await getNavData()

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top navbar */}
      <header className="border-b px-6 h-14 flex items-center justify-between shrink-0 bg-white">
        <Image src="/logo-transparente.png" alt="Logo" height={36} width={120} className="object-contain" />
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            target="_blank"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Ver sitio
          </Link>
          <NotificationBell
            role={navData?.profile.role ?? 'admin_general'}
            initialCount={navData?.pendingCount ?? 0}
          />
          {navData?.profile.fullName && (
            <span className="text-sm text-muted-foreground">
              {navData.profile.fullName}
            </span>
          )}
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        {/* Sidebar */}
        <aside className="w-56 border-r bg-muted/40 p-4 shrink-0 flex flex-col">
          <nav className="space-y-1 flex-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              Menu
            </p>
            <NavLink href="/admin/dashboard" icon={LayoutDashboard}>Dashboard</NavLink>
            <NavLink href="/admin/clientes" icon={Users}>Clientes</NavLink>
            <NavLink href="/admin/presupuestos" icon={FileText}>Presupuestos</NavLink>
            <NavLink href="/admin/productos" icon={Package}>Productos</NavLink>
            <NavLink href="/admin/consultas" icon={MessageSquare}>Consultas</NavLink>
            <NavLink href="/admin/campanas" icon={Megaphone}>Campañas</NavLink>
            <NavLink href="/admin/settings" icon={Settings}>Configuración</NavLink>

            <div className="pt-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                Analytics
              </p>
              <NavLink href="/admin/analytics" icon={BarChart2}>Dashboard BI</NavLink>
              <NavLink href="/admin/analytics/vendedores" icon={UserCheck}>Vendedores</NavLink>
              <NavLink href="/admin/analytics/busquedas" icon={Search}>Búsquedas</NavLink>
              <NavLink href="/admin/analytics/no-purchase-alerts" icon={Bell}>Alertas</NavLink>
            </div>
          </nav>

          {/* Logout */}
          <div className="border-t pt-3 mt-3">
            <form action={signOut}>
              <button
                type="submit"
                className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-destructive transition-colors"
              >
                <LogOut className="h-4 w-4 shrink-0" />
                Cerrar sesión
              </button>
            </form>
          </div>
        </aside>

        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  )
}

function NavLink({
  href,
  icon: Icon,
  children,
}: {
  href: string
  icon: React.ComponentType<{ className?: string }>
  children: ReactNode
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm hover:bg-muted transition-colors"
    >
      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
      {children}
    </Link>
  )
}
