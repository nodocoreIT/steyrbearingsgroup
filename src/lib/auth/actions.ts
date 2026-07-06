'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { db } from '@/db'
import { profiles } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { isCliente } from '@/lib/auth/roles'

type AuthState = { error?: string; success?: boolean } | null

export async function signIn(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { data: authData, error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    const msg = error.message.toLowerCase()

    if (msg.includes('too many requests')) {
      return { error: 'Demasiados intentos. Esperá unos minutos antes de volver a intentar.' }
    }

    if (msg.includes('invalid login credentials') || msg.includes('invalid email or password')) {
      // Supabase uses the same error for wrong password AND unconfirmed email.
      // Use admin client to distinguish between the two.
      try {
        const admin = createAdminClient()
        const { data: list } = await admin.auth.admin.listUsers({ perPage: 1000 })
        const match = list?.users?.find((u) => u.email === data.email)
        if (match && !match.email_confirmed_at) {
          return { error: 'Tu cuenta aún no fue activada. Revisá tu email o contactanos.' }
        }
      } catch {
        // If admin lookup fails, fall through to generic message
      }
      return { error: 'Email o contraseña incorrectos.' }
    }

    if (msg.includes('email not confirmed') || msg.includes('not confirmed')) {
      return { error: 'Tu cuenta aún no fue activada. Revisá tu email o contactanos.' }
    }

    return { error: 'No se pudo iniciar sesión. Intentá de nuevo.' }
  }

  const userId = authData.user?.id
  if (userId) {
    const [profile] = await db
      .select({ role: profiles.role })
      .from(profiles)
      .where(eq(profiles.id, userId))
      .limit(1)

    if (profile && isCliente(profile.role)) {
      redirect('/mi-cuenta')
    }
  }

  redirect('/admin/dashboard')
}

export async function signUp(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signUp(data)

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/')
}

export async function resetPassword(formData: FormData) {
  const supabase = await createClient()
  const email = formData.get('email') as string

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/confirm`,
  })

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}
