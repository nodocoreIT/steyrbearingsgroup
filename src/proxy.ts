import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

// Routes that are accessible without authentication
const publicRoutes = ['/', '/catalogo', '/login', '/register']
const publicPrefixes = ['/catalogo/', '/_next/', '/api/webhooks/']

function isPublicRoute(pathname: string): boolean {
  if (publicRoutes.includes(pathname)) return true
  if (publicPrefixes.some((prefix) => pathname.startsWith(prefix))) return true
  return false
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Always refresh the Supabase session
  const { supabaseResponse, user } = await updateSession(request)

  // Admin routes require authentication
  if (pathname.startsWith('/admin')) {
    if (!user) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirectTo', pathname)
      return NextResponse.redirect(loginUrl)
    }

    // Settings and financial routes require admin_general or admin_secundario
    // The actual role check is done server-side; middleware only gates unauthenticated access
    // Fine-grained role enforcement happens in page Server Components via requireAdmin()
  }

  // Redirect authenticated users away from login/register to dashboard
  if (user && (pathname === '/login' || pathname === '/register')) {
    return NextResponse.redirect(new URL('/admin/dashboard', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public folder assets
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
