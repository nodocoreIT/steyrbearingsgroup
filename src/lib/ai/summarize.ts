import Anthropic from '@anthropic-ai/sdk'
import { db } from '@/db'
import { voiceConsultations } from '@/db/schema'
import { eq, desc } from 'drizzle-orm'

let _anthropic: Anthropic | null = null

function getAnthropic(): Anthropic {
  if (!_anthropic) {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not set')
    _anthropic = new Anthropic({ apiKey })
  }
  return _anthropic
}

/**
 * Fetches the last 10 voice consultations for a client and generates
 * a 2-3 sentence summary using Claude.
 * Returns a fallback string on Claude error.
 */
export async function summarizeVoiceConsultations(clientId: string): Promise<string> {
  const consultations = await db
    .select({
      id: voiceConsultations.id,
      transcript: voiceConsultations.transcript,
      status: voiceConsultations.status,
      createdAt: voiceConsultations.createdAt,
    })
    .from(voiceConsultations)
    .where(eq(voiceConsultations.clientId, clientId))
    .orderBy(desc(voiceConsultations.createdAt))
    .limit(10)

  // Filter to consultations that have transcripts
  const withTranscript = consultations.filter((c) => c.transcript?.trim())

  if (withTranscript.length < 3) {
    return 'Insuficientes consultas registradas para generar un resumen (se necesitan al menos 3 con transcripción).'
  }

  const transcriptText = withTranscript
    .map(
      (c, i) =>
        `Consulta ${i + 1} (${new Date(c.createdAt).toLocaleDateString('es-AR')}): ${c.transcript}`
    )
    .join('\n\n')

  const prompt = `Sos un asistente de una empresa de rodamientos industriales. Resumí en 2-3 oraciones las siguientes consultas de voz de un cliente, destacando los temas principales y cualquier necesidad recurrente.

${transcriptText}

Respondé directamente con el resumen, sin encabezados ni listas.`

  try {
    const anthropic = getAnthropic()
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 250,
      messages: [{ role: 'user', content: prompt }],
    })

    const content = message.content[0]
    if (content.type === 'text') {
      return content.text.trim()
    }
    return 'No se pudo generar el resumen en este momento.'
  } catch {
    return 'No se pudo generar el resumen en este momento. Por favor, intentá nuevamente más tarde.'
  }
}
