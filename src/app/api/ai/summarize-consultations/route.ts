import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { summarizeVoiceConsultations } from '@/lib/ai/summarize'
import { isCliente } from '@/lib/auth/roles'
import type { AppRole } from '@/lib/auth/roles'
import { NextRequest } from 'next/server'

/**
 * POST /api/ai/summarize-consultations
 * Body: { clientId: string }
 * Auth: any role except 'cliente'
 * Returns: { summary: string }
 */
export async function POST(req: NextRequest) {
  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options)
          }
        },
      },
    }
  )

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const role = user.user_metadata?.role as AppRole | undefined
  if (!role || isCliente(role)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json().catch(() => ({}))
  const { clientId } = body as { clientId?: string }

  if (!clientId || typeof clientId !== 'string') {
    return Response.json({ error: 'clientId is required' }, { status: 400 })
  }

  const summary = await summarizeVoiceConsultations(clientId)
  return Response.json({ summary })
}
