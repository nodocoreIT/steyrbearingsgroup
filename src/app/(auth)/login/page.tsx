'use client'

import { signIn } from '@/lib/auth/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import Image from 'next/image'
import { useActionState } from 'react'

type ActionState = { error?: string; success?: boolean } | null

export default function LoginPage() {
  const [state, action, isPending] = useActionState<ActionState, FormData>(
    signIn as (state: ActionState, payload: FormData) => Promise<ActionState>,
    null
  )

  return (
    <Card>
      <CardHeader className="items-center text-center space-y-3">
        <Image
          src="/logo-transparente.png"
          alt="Logo"
          width={150}
          height={50}
          className="object-contain"
        />
        <div>
          <CardTitle>Iniciar sesión</CardTitle>
          <CardDescription className="mt-1">Ingresá tu email y contraseña para acceder a tu cuenta.</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <form action={action} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="vos@empresa.com"
              required
              autoComplete="email"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
            />
          </div>
          {state?.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? 'Ingresando…' : 'Iniciar sesión'}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          ¿No tenés cuenta?{' '}
          <Link href="/register" className="underline">
            Registrarse
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
