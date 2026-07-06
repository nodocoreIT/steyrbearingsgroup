import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { updateSession } from '@/lib/supabase/middleware'

type AppRole = 'admin_general' | 'admin_secundario' | 'vendedor' | 'cliente'

function startsWithAny(pathname: string, prefixes: string[]): boolean {
  return prefixes.some((p) => pathname === p || pathname.startsWith(p + '/'))
}

async function getRoleForUser(request: NextRequest, userId: string): Promise<AppRole | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

  if (!supabaseUrl.startsWith('http')) return null

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() { return request.cookies.getAll() },
      setAll() {},
    },
  })

  const { data } = await supabase.from('profiles').select('role').eq('id', userId).single()
  return (data?.role as AppRole) ?? null
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const { supabaseResponse, user } = await updateSession(request)

  // Admin routes — require session + non-client role
  if (startsWithAny(pathname, ['/admin'])) {
    if (!user) {
      const url = new URL('/login', request.url)
      url.searchParams.set('redirectTo', pathname)
      return NextResponse.redirect(url)
    }
    const role = await getRoleForUser(request, user.id)
    if (role === 'cliente') {
      return NextResponse.redirect(new URL('/mi-cuenta', request.url))
    }
    return supabaseResponse
  }

  // Client routes — require any session
  if (startsWithAny(pathname, ['/mi-cuenta', '/mis-presupuestos', '/mi-lista'])) {
    if (!user) {
      const url = new URL('/login', request.url)
      url.searchParams.set('redirectTo', pathname)
      return NextResponse.redirect(url)
    }
    return supabaseResponse
  }

  // Redirect authenticated users away from login/register
  if (user && (pathname === '/login' || pathname === '/register')) {
    const role = await getRoleForUser(request, user.id)
    const dest = role === 'cliente' ? '/mi-cuenta' : '/admin/dashboard'
    return NextResponse.redirect(new URL(dest, request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
