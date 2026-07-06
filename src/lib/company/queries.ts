import { db } from '@/db'
import { appConfig } from '@/db/schema'
import { eq } from 'drizzle-orm'

export interface CompanySettings {
  name: string
  cuit: string
  phone: string
  email: string
  address: string
  city: string
  province: string
  whatsapp: string
  instagram: string
  website: string
}

const COMPANY_KEY = 'company.settings'

const DEFAULTS: CompanySettings = {
  name: '',
  cuit: '',
  phone: '',
  email: '',
  address: '',
  city: '',
  province: '',
  whatsapp: '',
  instagram: '',
  website: '',
}

export async function getCompanySettings(): Promise<CompanySettings> {
  const rows = await db
    .select({ value: appConfig.value })
    .from(appConfig)
    .where(eq(appConfig.key, COMPANY_KEY))
    .limit(1)

  if (!rows[0]) return DEFAULTS

  return { ...DEFAULTS, ...(rows[0].value as Partial<CompanySettings>) }
}
