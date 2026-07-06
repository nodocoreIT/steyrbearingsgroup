'use server'

import { revalidatePath } from 'next/cache'
import { db } from '@/db'
import { products } from '@/db/schema'
import { eq } from 'drizzle-orm'
import type { ActionResult } from '@/lib/types/action-result'

function parseImages(raw: string): string[] {
  return raw
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)
}

function parseSpecs(raw: string): Record<string, string> {
  const result: Record<string, string> = {}
  for (const line of raw.split('\n')) {
    const idx = line.indexOf(':')
    if (idx === -1) continue
    const key = line.slice(0, idx).trim()
    const val = line.slice(idx + 1).trim()
    if (key) result[key] = val
  }
  return result
}

async function triggerEmbedding(productId: string) {
  // Fire-and-forget: do not await, embedding failure must not block product save
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  fetch(`${baseUrl}/api/embeddings/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-internal-token': process.env.INTERNAL_API_SECRET ?? '',
    },
    body: JSON.stringify({ productId }),
  }).catch(() => {
    // Intentionally swallowed — embedding is async and non-critical
  })
}

export async function createProduct(formData: FormData): Promise<ActionResult<{ id: string }>> {
  try {
    const name = formData.get('name') as string
    const sku = formData.get('sku') as string
    const description = formData.get('description') as string | null
    const categoryId = formData.get('categoryId') as string | null
    const imagesRaw = (formData.get('images') as string) ?? ''
    const specsRaw = (formData.get('specs') as string) ?? ''
    const active = formData.get('active') === 'true'

    if (!name?.trim()) return { success: false, error: 'El nombre es obligatorio' }
    if (!sku?.trim()) return { success: false, error: 'El SKU es obligatorio' }

    const [row] = await db
      .insert(products)
      .values({
        name: name.trim(),
        sku: sku.trim(),
        description: description?.trim() ?? null,
        categoryId: categoryId || null,
        images: parseImages(imagesRaw),
        specs: parseSpecs(specsRaw),
        active,
      })
      .returning({ id: products.id })

    triggerEmbedding(row.id)

    revalidatePath('/admin/productos')
    revalidatePath('/catalogo')
    return { success: true, data: { id: row.id } }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    if (msg.includes('unique')) return { success: false, error: 'Ya existe un producto con este SKU' }
    return { success: false, error: msg }
  }
}

export async function updateProduct(
  id: string,
  formData: FormData
): Promise<ActionResult<void>> {
  try {
    const name = formData.get('name') as string
    const sku = formData.get('sku') as string
    const description = formData.get('description') as string | null
    const categoryId = formData.get('categoryId') as string | null
    const imagesRaw = (formData.get('images') as string) ?? ''
    const specsRaw = (formData.get('specs') as string) ?? ''
    const active = formData.get('active') === 'true'

    if (!name?.trim()) return { success: false, error: 'El nombre es obligatorio' }
    if (!sku?.trim()) return { success: false, error: 'El SKU es obligatorio' }

    await db
      .update(products)
      .set({
        name: name.trim(),
        sku: sku.trim(),
        description: description?.trim() ?? null,
        categoryId: categoryId || null,
        images: parseImages(imagesRaw),
        specs: parseSpecs(specsRaw),
        active,
        updatedAt: new Date(),
      })
      .where(eq(products.id, id))

    triggerEmbedding(id)

    revalidatePath('/admin/productos')
    revalidatePath(`/admin/productos/${id}`)
    revalidatePath('/catalogo')
    return { success: true, data: undefined }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return { success: false, error: msg }
  }
}

export async function toggleProductActive(id: string): Promise<ActionResult<void>> {
  try {
    const current = await db.query.products.findFirst({
      where: eq(products.id, id),
      columns: { active: true },
    })
    if (!current) return { success: false, error: 'Producto no encontrado' }

    await db
      .update(products)
      .set({ active: !current.active, updatedAt: new Date() })
      .where(eq(products.id, id))

    revalidatePath('/admin/productos')
    revalidatePath('/catalogo')
    return { success: true, data: undefined }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

export async function deleteProduct(id: string): Promise<ActionResult<void>> {
  try {
    await db.delete(products).where(eq(products.id, id))
    revalidatePath('/admin/productos')
    return { success: true, data: undefined }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

export async function cloneProduct(id: string): Promise<ActionResult<{ id: string }>> {
  try {
    const [original] = await db.select().from(products).where(eq(products.id, id)).limit(1)
    if (!original) return { success: false, error: 'Producto no encontrado' }

    const newSku = `${original.sku}-COPIA-${Date.now().toString(36).toUpperCase()}`
    const [created] = await db
      .insert(products)
      .values({
        categoryId: original.categoryId,
        sku: newSku,
        name: `${original.name} (copia)`,
        description: original.description,
        specs: original.specs as Record<string, string> | null,
        images: original.images,
        active: false,
      })
      .returning({ id: products.id })

    revalidatePath('/admin/productos')
    return { success: true, data: { id: created.id } }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}
