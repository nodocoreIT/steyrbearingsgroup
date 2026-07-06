import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

  // In local dev without Supabase, use dev session cookie if present
  if (!supabaseUrl.startsWith('http') || supabaseUrl.includes('placeholder')) {
    const devProfileId = request.cookies.get('dev_profile_id')?.value
    if (devProfileId && process.env.NODE_ENV !== 'production') {
      // Return a minimal user object so middleware route guards work
      return { supabaseResponse, user: { id: devProfileId } as { id: string } }
    }
    return { supabaseResponse, user: null }
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Do not write code between createServerClient and supabase.auth.getUser()
  // A simple mistake could make it hard to debug session issues.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return { supabaseResponse, user }
}
