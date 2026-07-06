import OpenAI from 'openai'

export class EmbeddingError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message)
    this.name = 'EmbeddingError'
  }
}

let _openai: OpenAI | null = null

function getOpenAI(): OpenAI {
  if (!_openai) {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) throw new EmbeddingError('OPENAI_API_KEY is not set')
    _openai = new OpenAI({ apiKey })
  }
  return _openai
}

/**
 * Generate a 1536-dimension embedding for the given text using
 * OpenAI text-embedding-3-small.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  if (!text?.trim()) throw new EmbeddingError('Cannot embed empty text')

  try {
    const client = getOpenAI()
    const response = await client.embeddings.create({
      model: 'text-embedding-3-small',
      input: text.slice(0, 8191), // API hard limit
    })

    const embedding = response.data[0]?.embedding
    if (!embedding || embedding.length !== 1536) {
      throw new EmbeddingError(`Unexpected embedding dimensions: ${embedding?.length}`)
    }

    return embedding
  } catch (err) {
    if (err instanceof EmbeddingError) throw err
    throw new EmbeddingError('Failed to generate embedding', err)
  }
}

/**
 * Build the canonical embedding text for a product.
 */
export function buildProductEmbeddingText(product: {
  name: string
  description?: string | null
  specs?: unknown
}): string {
  const parts = [product.name]
  if (product.description) parts.push(product.description)
  if (product.specs && typeof product.specs === 'object') {
    parts.push(JSON.stringify(product.specs))
  }
  return parts.join(' ')
}
