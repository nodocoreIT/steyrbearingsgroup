import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { products, productEmbeddings } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { generateEmbedding, buildProductEmbeddingText, EmbeddingError } from '@/lib/ai/embeddings'

// Internal-only route: callers must supply the x-internal-token header
function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.INTERNAL_API_SECRET
  if (!secret) return false
  return req.headers.get('x-internal-token') === secret
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let productId: string | undefined
  try {
    const body = await req.json()
    productId = body?.productId as string | undefined
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!productId) {
    return NextResponse.json({ error: 'productId is required' }, { status: 400 })
  }

  // Fetch product from DB
  const rows = await db
    .select()
    .from(products)
    .where(eq(products.id, productId))
    .limit(1)

  const product = rows[0]
  if (!product) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 })
  }

  try {
    const text = buildProductEmbeddingText(product)
    const embedding = await generateEmbedding(text)

    // Upsert into product_embeddings
    await db
      .insert(productEmbeddings)
      .values({
        productId: product.id,
        embedding,
        modelVersion: 'text-embedding-3-small',
      })
      .onConflictDoUpdate({
        target: productEmbeddings.productId,
        set: {
          embedding,
          modelVersion: 'text-embedding-3-small',
          createdAt: new Date(),
        },
      })

    return NextResponse.json({ success: true, productId: product.id })
  } catch (err) {
    if (err instanceof EmbeddingError) {
      return NextResponse.json({ error: err.message }, { status: 502 })
    }
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
