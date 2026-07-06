import Anthropic from '@anthropic-ai/sdk'
import { db } from '@/db'
import { clients, profiles, clientScores, scoreHistory } from '@/db/schema'
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
 * Generates a natural-language explanation for why a client has their current score.
 * Uses the last 3 score_history entries and purchase summary data.
 * Returns a fallback string on Claude error.
 */
export async function explainClientScore(clientId: string): Promise<string> {
  // Fetch client info + current score
  const [clientData] = await db
    .select({
      name: clients.razonSocial,
      profileName: profiles.fullName,
      score: clientScores.score,
      snapshot: clientScores.scoringConfigSnapshot,
    })
    .from(clients)
    .innerJoin(profiles, eq(profiles.id, clients.profileId))
    .leftJoin(clientScores, eq(clientScores.clientId, clients.id))
    .where(eq(clients.id, clientId))
    .limit(1)

  if (!clientData) {
    return 'No se encontraron datos para este cliente.'
  }

  const name = clientData.name ?? clientData.profileName ?? 'Cliente'
  const score = clientData.score ? Number(clientData.score).toFixed(1) : '0.0'

  // Extract metrics from snapshot
  const snapshot = clientData.snapshot as {
    input?: {
      purchaseVolume?: number
      purchaseFrequency?: number
      acceptedQuotes?: number
      sentQuotes?: number
    }
  } | null

  const volume = snapshot?.input?.purchaseVolume ?? 0
  const frequency = snapshot?.input?.purchaseFrequency ?? 0
  const acceptedQuotes = snapshot?.input?.acceptedQuotes ?? 0
  const sentQuotes = snapshot?.input?.sentQuotes ?? 0
  const paymentRate =
    sentQuotes > 0 ? Math.round((acceptedQuotes / sentQuotes) * 100) : 0

  // Fetch last 3 score history entries for trend context
  const history = await db
    .select({ score: scoreHistory.score, calculatedAt: scoreHistory.calculatedAt })
    .from(scoreHistory)
    .where(eq(scoreHistory.clientId, clientId))
    .orderBy(desc(scoreHistory.calculatedAt))
    .limit(3)

  const historyText =
    history.length > 0
      ? history
          .map((h) => `${Number(h.score).toFixed(1)} estrellas`)
          .join(', ')
      : 'sin historial previo'

  const prompt = `Sos un asistente comercial de una empresa de rodamientos. Explicá en 2-3 oraciones por qué el cliente ${name} tiene un puntaje de ${score}/5 estrellas. Datos: volumen de compra $${volume.toLocaleString('es-AR')}, frecuencia ${frequency} pedidos en los últimos 12 meses, tasa de aceptación de presupuestos ${paymentRate}%. Historial reciente de puntajes: ${historyText}. Usá lenguaje claro, sin tecnicismos.`

  try {
    const anthropic = getAnthropic()
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 200,
      messages: [{ role: 'user', content: prompt }],
    })

    const content = message.content[0]
    if (content.type === 'text') {
      return content.text.trim()
    }
    return 'No se pudo generar la explicación en este momento.'
  } catch {
    return `El cliente ${name} tiene un puntaje de ${score}/5 basado en su historial de compras y comportamiento de pago.`
  }
}
