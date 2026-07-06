'use client'

import Link from 'next/link'
import { useState, useEffect, useCallback } from 'react'
import { useVoiceConsultationCount } from '@/lib/voice/realtime'

type AppRole = 'admin_general' | 'admin_secundario' | 'vendedor' | 'cliente'

interface NotificationBellProps {
  role: AppRole
  initialCount: number
}

export function NotificationBell({ role, initialCount }: NotificationBellProps) {
  const voiceCount = useVoiceConsultationCount(role, initialCount)
  const [unreadCount, setUnreadCount] = useState(0)

  const fetchUnread = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications')
      if (!res.ok) return
      const data = (await res.json()) as { notifications: Array<{ id: string }> }
      setUnreadCount(data.notifications?.length ?? 0)
    } catch {
      // Non-critical — ignore
    }
  }, [])

  useEffect(() => {
    fetchUnread()
    // Poll every 60s
    const interval = setInterval(fetchUnread, 60_000)
    return () => clearInterval(interval)
  }, [fetchUnread])

  const totalCount = voiceCount + unreadCount

  return (
    <Link
      href="/admin/consultas"
      aria-label={`Notificaciones — ${totalCount} pendiente${totalCount !== 1 ? 's' : ''}`}
      className="relative flex h-9 w-9 items-center justify-center rounded-md hover:bg-muted transition-colors"
    >
      <BellIcon className="h-5 w-5" />
      {totalCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
          {totalCount > 99 ? '99+' : totalCount}
        </span>
      )}
    </Link>
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
