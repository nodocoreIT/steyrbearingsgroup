export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { db } from '@/db'
import { profiles, appConfig } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { canAccessSettings } from '@/lib/auth/roles'

async function getThreshold(): Promise<number> {
  const rows = await db
    .select({ value: appConfig.value })
    .from(appConfig)
    .where(eq(appConfig.key, 'no_purchase_threshold_days'))
    .limit(1)

  const val = rows[0]?.value
  if (typeof val === 'number') return val
  if (val && typeof val === 'object' && 'value' in val) return Number((val as { value: unknown }).value)
  return 60
}

async function saveThreshold(formData: FormData) {
  'use server'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const profileRows = await db
    .select({ role: profiles.role })
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1)

  if (!canAccessSettings(profileRows[0]?.role ?? 'cliente')) return

  const days = Number(formData.get('threshold_days'))
  if (!Number.isInteger(days) || days < 1) return

  await db
    .insert(appConfig)
    .values({
      key: 'no_purchase_threshold_days',
      value: days,
      updatedBy: user.id,
    })
    .onConflictDoUpdate({
      target: appConfig.key,
      set: {
        value: days,
        updatedAt: new Date(),
        updatedBy: user.id,
      },
    })

  revalidatePath('/admin/settings/alertas')
}

export default async function AlertasSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const profileRows = await db
    .select({ role: profiles.role })
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1)

  const userRole = profileRows[0]?.role ?? 'cliente'
  const isAdmin = canAccessSettings(userRole)

  const threshold = await getThreshold()

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Configuración de alertas de sin compras</h1>
        <p className="text-muted-foreground text-sm">
          Configurá el umbral para las alertas de sin compras.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Umbral de alerta</CardTitle>
          <CardDescription>
            Los clientes que no hayan realizado una compra en esta cantidad de días generarán una alerta.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isAdmin ? (
            <form action={saveThreshold} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="threshold_days">Días sin compra</Label>
                <Input
                  id="threshold_days"
                  name="threshold_days"
                  type="number"
                  min={1}
                  defaultValue={threshold}
                  className="w-32"
                  required
                />
              </div>
              <Button type="submit">Guardar</Button>
            </form>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Umbral actual:{' '}
                <span className="font-medium text-foreground">{threshold} días</span>
              </p>
              <p className="text-xs text-muted-foreground">
                Solo el Admin General puede modificar esta configuración.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
