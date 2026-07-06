'use client'

import Link from 'next/link'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useVoiceConsultationCount } from '@/lib/voice/realtime'

type AppRole = 'admin_general' | 'admin_secundario' | 'vendedor' | 'cliente'

interface Notification {
  id: string
  type: string
  title: string
  body: string
  read: boolean
  payload: Record<string, unknown> | null
  createdAt: string
}

interface NotificationBellProps {
  role: AppRole
  initialCount: number
}

function getNotificationHref(n: Notification): string {
  const p = n.payload ?? {}
  switch (n.type) {
    case 'client_pending_activation':
      return p.clientId ? `/admin/clientes/${p.clientId}` : '/admin/clientes'
    case 'new_quote_request':
    case 'quote_approved':
    case 'quote_rejected':
    case 'quote_sent':
      return p.quoteId ? `/admin/presupuestos/${p.quoteId}` : '/admin/presupuestos'
    case 'no_purchase_alert':
      return p.clientId ? `/admin/clientes/${p.clientId}` : '/admin/clientes'
    case 'voice_consultation':
      return '/admin/consultas'
    default:
      return '/admin/dashboard'
  }
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'ahora'
  if (mins < 60) return `hace ${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `hace ${hrs}h`
  return `hace ${Math.floor(hrs / 24)}d`
}

export function NotificationBell({ role, initialCount }: NotificationBellProps) {
  const voiceCount = useVoiceConsultationCount(role, initialCount)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications')
      if (!res.ok) return
      const data = await res.json() as { notifications: Notification[] }
      setNotifications(data.notifications ?? [])
    } catch {
      // Non-critical
    }
  }, [])

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 60_000)
    return () => clearInterval(interval)
  }, [fetchNotifications])

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function markAsRead(id: string) {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
    try {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId: id }),
      })
    } catch {
      // Non-critical
    }
  }

  const totalCount = voiceCount + notifications.length

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={`Notificaciones — ${totalCount} pendiente${totalCount !== 1 ? 's' : ''}`}
        className="relative flex h-9 w-9 items-center justify-center rounded-md hover:bg-muted transition-colors"
      >
        <BellIcon className="h-5 w-5" />
        {totalCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
            {totalCount > 99 ? '99+' : totalCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 rounded-lg border bg-popover shadow-lg z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 border-b">
            <span className="text-sm font-semibold">Notificaciones</span>
            {notifications.length > 0 && (
              <button
                type="button"
                onClick={async () => {
                  for (const n of notifications) await markAsRead(n.id)
                }}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Marcar todas como leídas
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 && voiceCount === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-muted-foreground">
                Sin notificaciones pendientes
              </p>
            ) : (
              <>
                {notifications.map((n) => (
                  <div key={n.id} className="flex items-start gap-3 px-4 py-3 hover:bg-muted/50 border-b last:border-0">
                    <div className="flex-1 min-w-0">
                      <Link
                        href={getNotificationHref(n)}
                        onClick={() => { markAsRead(n.id); setOpen(false) }}
                        className="block"
                      >
                        <p className="text-sm font-medium leading-tight">{n.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{n.body}</p>
                        <p className="text-xs text-muted-foreground/60 mt-1">{timeAgo(n.createdAt)}</p>
                      </Link>
                    </div>
                    <button
                      type="button"
                      onClick={() => markAsRead(n.id)}
                      className="text-muted-foreground/40 hover:text-muted-foreground transition-colors mt-0.5 shrink-0"
                      aria-label="Marcar como leída"
                    >
                      ×
                    </button>
                  </div>
                ))}
                {voiceCount > 0 && (
                  <Link
                    href="/admin/consultas"
                    onClick={() => setOpen(false)}
                    className="flex items-start gap-3 px-4 py-3 hover:bg-muted/50 border-b last:border-0 block"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium">Consultas de voz pendientes</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{voiceCount} consulta{voiceCount !== 1 ? 's' : ''} esperando revisión.</p>
                    </div>
                  </Link>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function BellIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  )
}
