'use server'

import { db } from '@/db'
import { appConfig } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { ActionResult } from '@/lib/types/action-result'
import type { CompanySettings } from './queries'

const COMPANY_KEY = 'company.settings'

export async function saveCompanySettings(formData: FormData): Promise<ActionResult<void>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'No autorizado', code: 'UNAUTHENTICATED' }

    const settings: CompanySettings = {
      name: (formData.get('name') as string | null)?.trim() ?? '',
      cuit: (formData.get('cuit') as string | null)?.trim() ?? '',
      phone: (formData.get('phone') as string | null)?.trim() ?? '',
      email: (formData.get('email') as string | null)?.trim() ?? '',
      address: (formData.get('address') as string | null)?.trim() ?? '',
      city: (formData.get('city') as string | null)?.trim() ?? '',
      province: (formData.get('province') as string | null)?.trim() ?? '',
      whatsapp: (formData.get('whatsapp') as string | null)?.trim() ?? '',
      instagram: (formData.get('instagram') as string | null)?.trim() ?? '',
      website: (formData.get('website') as string | null)?.trim() ?? '',
    }

    await db
      .insert(appConfig)
      .values({ key: COMPANY_KEY, value: settings, updatedBy: user.id })
      .onConflictDoUpdate({
        target: appConfig.key,
        set: { value: settings, updatedAt: new Date(), updatedBy: user.id },
      })

    revalidatePath('/admin/settings/empresa')
    return { success: true, data: undefined }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'No se pudo guardar la configuración',
    }
  }
}
