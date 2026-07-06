'use server'

import { revalidatePath } from 'next/cache'
import { db } from '@/db'
import { categories } from '@/db/schema'
import { eq } from 'drizzle-orm'
import type { ActionResult } from '@/lib/types/action-result'

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
}

export async function createCategory(formData: FormData): Promise<ActionResult<{ id: string }>> {
  try {
    const name = formData.get('name') as string
    if (!name?.trim()) return { success: false, error: 'El nombre es obligatorio' }

    const slug = formData.get('slug') as string || slugify(name)

    const [row] = await db
      .insert(categories)
      .values({ name: name.trim(), slug })
      .returning({ id: categories.id })

    revalidatePath('/admin/productos/categorias')
    return { success: true, data: { id: row.id } }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    if (msg.includes('unique')) return { success: false, error: 'Ya existe una categoría con este slug' }
    return { success: false, error: msg }
  }
}

export async function updateCategory(
  id: string,
  formData: FormData
): Promise<ActionResult<void>> {
  try {
    const name = formData.get('name') as string
    if (!name?.trim()) return { success: false, error: 'El nombre es obligatorio' }

    const slug = formData.get('slug') as string || slugify(name)

    await db
      .update(categories)
      .set({ name: name.trim(), slug })
      .where(eq(categories.id, id))

    revalidatePath('/admin/productos/categorias')
    return { success: true, data: undefined }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return { success: false, error: msg }
  }
}

export async function deleteCategory(id: string): Promise<ActionResult<void>> {
  try {
    await db.delete(categories).where(eq(categories.id, id))
    revalidatePath('/admin/productos/categorias')
    return { success: true, data: undefined }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return { success: false, error: msg }
  }
}

// Categories don't have an active flag in the current schema — this is a no-op stub
// kept for API surface parity with the task spec.
export async function toggleCategoryActive(_id: string): Promise<ActionResult<void>> {
  return { success: false, error: 'Not supported: categories schema has no active flag' }
}
