import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/db'
import { voiceConsultations, clients } from '@/db/schema'
import { eq } from 'drizzle-orm'

interface VoiceSubmitBody {
  transcript: string
  recipientRole: 'vendedor' | 'admin_general'
  clientId?: string
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: VoiceSubmitBody
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { transcript, recipientRole } = body

  if (!transcript?.trim()) {
    return NextResponse.json({ error: 'Transcript is required' }, { status: 400 })
  }

  if (!['vendedor', 'admin_general'].includes(recipientRole)) {
    return NextResponse.json({ error: 'Invalid recipient role' }, { status: 400 })
  }

  // Resolve client from authenticated user
  const clientRows = await db
    .select({ id: clients.id })
    .from(clients)
    .where(eq(clients.profileId, user.id))
    .limit(1)

  if (!clientRows[0]) {
    return NextResponse.json({ error: 'Client profile not found' }, { status: 403 })
  }

  const [consultation] = await db
    .insert(voiceConsultations)
    .values({
      clientId: clientRows[0].id,
      recipientRole,
      transcript: transcript.trim(),
      status: 'transcribed',
    })
    .returning({ id: voiceConsultations.id })

  return NextResponse.json({ success: true, consultationId: consultation.id })
}
