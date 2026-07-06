'use client'

import { registerClient } from '@/lib/clients/actions'
import { useActionState } from 'react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

type State = { error?: string; clientId?: string } | null

async function createClientAction(_prev: State, formData: FormData): Promise<State> {
  const result = await registerClient({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    fullName: formData.get('fullName') as string,
    cuit: formData.get('cuit') as string,
    phone: (formData.get('phone') as string) || undefined,
    companyName: (formData.get('companyName') as string) || undefined,
  })

  if (!result.success) return { error: result.error }
  return { clientId: result.data.clientId }
}

export default function NuevoClientePage() {
  const router = useRouter()
  const [state, action, isPending] = useActionState<State, FormData>(createClientAction, null)

  useEffect(() => {
    if (state?.clientId) {
      router.push(`/admin/clientes/${state.clientId}`)
    }
  }, [state, router])

  return (
    <div className="space-y-6 max-w-xl">
      <div className="flex items-center gap-4">
        <Link href="/admin/clientes" className="text-sm text-muted-foreground hover:underline">
          ← Clientes
        </Link>
      </div>

      <h1 className="text-2xl font-bold">Nuevo cliente</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Datos del cliente</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={action} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Nombre completo *</Label>
              <Input id="fullName" name="fullName" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="companyName">Empresa</Label>
              <Input id="companyName" name="companyName" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cuit">CUIT *</Label>
              <Input id="cuit" name="cuit" placeholder="20-12345678-9" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input id="phone" name="phone" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input id="email" name="email" type="email" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña *</Label>
              <Input id="password" name="password" type="password" required />
            </div>

            {state?.error && (
              <p className="text-sm text-destructive">{state.error}</p>
            )}

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Creando…' : 'Crear cliente'}
              </Button>
              <Link
                href="/admin/clientes"
                className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
              >
                Cancelar
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
