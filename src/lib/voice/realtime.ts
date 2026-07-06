'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type AppRole = 'admin_general' | 'admin_secundario' | 'vendedor' | 'cliente'

function roleToRecipient(role: AppRole): string {
  if (role === 'admin_general' || role === 'admin_secundario') return 'admin_general'
  return 'vendedor'
}

/**
 * Subscribes to voice_consultations INSERT events via Supabase Realtime.
 * Returns the live count of pending consultations for the current user's role.
 *
 * Usage:
 *   const count = useVoiceConsultationCount('admin_general', serverCount)
 */
export function useVoiceConsultationCount(
  role: AppRole,
  initialCount = 0
): number {
  const [count, setCount] = useState(initialCount)

  useEffect(() => {
    const supabase = createClient()
    const recipientRole = roleToRecipient(role)

    const channel = supabase
      .channel('voice-consultations-badge')
      .on(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        'postgres_changes' as any,
        {
          event: 'INSERT',
          schema: 'public',
          table: 'voice_consultations',
          filter: `recipient_role=eq.${recipientRole}`,
        },
        () => {
          setCount((prev) => prev + 1)
        }
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [role])

  return count
}
