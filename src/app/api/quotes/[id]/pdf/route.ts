import { NextRequest, NextResponse } from 'next/server'
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { renderToBuffer } = require('@react-pdf/renderer') as { renderToBuffer: (element: unknown) => Promise<Buffer> }
import { QuotePDF } from '@/lib/pdf/quote-pdf'
import { getQuoteById } from '@/lib/quotes/queries'
import { getClientIdByProfileId } from '@/lib/interest-lists/queries'
import { createClient } from '@/lib/supabase/server'
import { isAdmin, isVendedor } from '@/lib/auth/roles'
import { db } from '@/db'
import { profiles } from '@/db/schema'
import { eq } from 'drizzle-orm'
import React from 'react'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  // Auth check
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Fetch quote
  const quote = await getQuoteById(id)
  if (!quote) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // Resolve user role
  const profileRows = await db
    .select({ role: profiles.role })
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1)

  const role = profileRows[0]?.role

  // Access control:
  // - Admin or secondary admin: always allowed
  // - Vendedor: allowed if they are the salesperson on this quote
  // - Cliente: allowed only if they own the quote AND it's been sent/accepted
  if (role && isAdmin(role)) {
    // Admin access — allowed
  } else if (role && isVendedor(role)) {
    if (quote.salespersonId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  } else {
    // Cliente path
    const clientId = await getClientIdByProfileId(user.id)
    if (!clientId || quote.clientId !== clientId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    const allowedStatuses = ['sent', 'accepted', 'declined']
    if (!allowedStatuses.includes(quote.status)) {
      return NextResponse.json({ error: 'Quote not yet available' }, { status: 403 })
    }
  }

  // Build PDF
  const pdfItems = quote.items.map((item) => ({
    productName: item.productName,
    productSku: item.productSku,
    quantity: item.quantity,
    unitPrice: Number(item.unitPrice),
    subtotal: Number(item.subtotal),
  }))

  const element = React.createElement(QuotePDF, {
    quoteId: id,
    createdAt: quote.createdAt,
    clientName: quote.clientName ?? 'Unknown',
    salespersonName: quote.salespersonName,
    items: pdfItems,
    total: quote.total,
    notes: quote.notes,
  })

  const buffer = await renderToBuffer(element)
  // Cast to ArrayBuffer so TypeScript's BodyInit type accepts it
  const body = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength)

  return new Response(body as ArrayBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="presupuesto-${id.slice(0, 8)}.pdf"`,
      'Cache-Control': 'no-store',
    },
  })
}
