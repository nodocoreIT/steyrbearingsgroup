import { NextRequest, NextResponse } from 'next/server'
import { semanticSearch } from '@/lib/search/semantic'
import { textSearch } from '@/lib/search/text'
import { logSearchQuery } from '@/lib/analytics/search'

// Simple in-memory rate limiter: max 20 requests/minute per IP
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT = 20
const WINDOW_MS = 60_000

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + WINDOW_MS })
    return true
  }

  if (entry.count >= RATE_LIMIT) return false
  entry.count++
  return true
}

export async function GET(req: NextRequest) {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: 'Too many requests — max 20/min' },
      { status: 429 }
    )
  }

  const { searchParams } = req.nextUrl
  const query = searchParams.get('q') ?? ''
  const type = (searchParams.get('type') ?? 'hybrid') as 'semantic' | 'text' | 'hybrid'

  if (!query.trim()) {
    return NextResponse.json({ results: [], type: 'text', count: 0 })
  }

  let results: Awaited<ReturnType<typeof textSearch>>
  let resolvedType: 'semantic' | 'text' = 'text'

  try {
    if (type === 'text') {
      results = await textSearch(query)
      resolvedType = 'text'
    } else if (type === 'semantic') {
      const semResults = await semanticSearch(query)
      results = semResults
      resolvedType = 'semantic'
    } else {
      // hybrid: try semantic, fall back to text
      try {
        const semResults = await semanticSearch(query)
        results = semResults
        resolvedType = 'semantic'
      } catch {
        results = await textSearch(query)
        resolvedType = 'text'
      }
    }
  } catch {
    results = []
    resolvedType = 'text'
  }

  // Log search query non-blocking
  logSearchQuery({ query, type: resolvedType, resultsCount: results.length }).catch(() => {})

  // Strip internal fields (similarity score) before returning to public callers
  const sanitized = results.map(({ similarity: _s, ...product }: typeof results[number] & { similarity?: number }) => product)

  return NextResponse.json({
    results: sanitized,
    type: resolvedType,
    count: sanitized.length,
  })
}
