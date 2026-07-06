'use server'

import { acknowledgeAlert, resolveAlert } from './no-purchase'
import { revalidatePath } from 'next/cache'

export async function acknowledgeAlertAction(formData: FormData) {
  const alertId = formData.get('alertId')
  if (typeof alertId !== 'string') return
  await acknowledgeAlert(alertId)
  revalidatePath('/admin/analytics/no-purchase-alerts')
}

export async function resolveAlertAction(formData: FormData) {
  const alertId = formData.get('alertId')
  if (typeof alertId !== 'string') return
  await resolveAlert(alertId)
  revalidatePath('/admin/analytics/no-purchase-alerts')
}
