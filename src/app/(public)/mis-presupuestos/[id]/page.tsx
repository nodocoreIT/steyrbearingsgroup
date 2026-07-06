export const dynamic = 'force-dynamic'

import { getQuoteById } from '@/lib/quotes/queries'
import { clientAcceptQuote, clientDeclineQuote } from '@/lib/quotes/actions'
import { getClientIdByProfileId } from '@/lib/interest-lists/queries'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'

interface Props {
  params: Promise<{ id: string }>
}

export default async function MiPresupuestoDetailPage({ params }: Props) {
  const { id } = await params

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const clientId = await getClientIdByProfileId(user.id)
  if (!clientId) redirect('/mis-presupuestos')

  const quote = await getQuoteById(id)
  if (!quote) notFound()

  // Security: ensure this quote belongs to the authenticated client
  if (quote.clientId !== clientId) notFound()

  // Prices are ONLY visible after the quote has been approved and sent
  const pricesVisible = quote.status === 'sent' || quote.status === 'accepted' || quote.status === 'declined'
  const canRespond = quote.status === 'sent'

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href="/mis-presupuestos" className="text-sm text-muted-foreground hover:underline">
          ← Mis Presupuestos
        </Link>
      </div>

      <div className="flex items-start justify-between">
        <h1 className="text-2xl font-bold">Detalle del Presupuesto</h1>
        <Badge
          className={
            quote.status === 'sent'
              ? 'bg-blue-100 text-blue-700'
              : quote.status === 'accepted'
                ? 'bg-emerald-100 text-emerald-700'
                : quote.status === 'declined'
                  ? 'bg-red-100 text-red-700'
                  : 'bg-gray-100 text-gray-700'
          }
        >
          {quote.status === 'sent'
            ? 'Listo para revisar'
            : quote.status === 'accepted'
              ? 'Aceptado'
              : quote.status === 'declined'
                ? 'Declinado'
                : 'En proceso'}
        </Badge>
      </div>

      <p className="text-sm text-muted-foreground">
        Solicitado el {new Date(quote.createdAt).toLocaleDateString('es-AR')}
      </p>

      {/* Products table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Productos</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="px-4 py-3 font-medium">Producto</th>
                <th className="px-4 py-3 font-medium text-right">Cant.</th>
                {pricesVisible && (
                  <>
                    <th className="px-4 py-3 font-medium text-right">Precio unit.</th>
                    <th className="px-4 py-3 font-medium text-right">Subtotal</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {quote.items.map((item) => (
                <tr key={item.id} className="border-b last:border-0">
                  <td className="px-4 py-3">
                    <div className="font-medium">{item.productName}</div>
                    <div className="text-xs text-muted-foreground font-mono">{item.productSku}</div>
                  </td>
                  <td className="px-4 py-3 text-right">{item.quantity}</td>
                  {pricesVisible && (
                    <>
                      <td className="px-4 py-3 text-right font-mono">
                        ${Number(item.unitPrice).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-medium">
                        ${Number(item.subtotal).toFixed(2)}
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
            {pricesVisible && (
              <tfoot>
                <tr className="border-t">
                  <td colSpan={2} className="px-4 py-3 text-right font-semibold">
                    Total
                  </td>
                  <td />
                  <td className="px-4 py-3 text-right font-bold font-mono text-lg">
                    ${quote.total.toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </CardContent>
      </Card>

      {!pricesVisible && (
        <p className="text-sm text-muted-foreground bg-muted/50 rounded-md p-4">
          Los precios se mostrarán cuando nuestro equipo revise y envíe el presupuesto.
        </p>
      )}

      {/* Accept / Decline */}
      {canRespond && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tu Respuesta</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-3">
            <form
              action={async () => {
                'use server'
                await clientAcceptQuote(id)
              }}
            >
              <Button type="submit" className="bg-green-600 hover:bg-green-700 text-white">
                Aceptar Presupuesto
              </Button>
            </form>
            <form
              action={async () => {
                'use server'
                await clientDeclineQuote(id)
              }}
            >
              <Button type="submit" variant="outline">
                Declinar
              </Button>
            </form>
            <Link
              href={`/api/quotes/${id}/pdf`}
              target="_blank"
              className={buttonVariants({ variant: 'outline' })}
            >
              Descargar PDF
            </Link>
          </CardContent>
        </Card>
      )}

      {/* PDF for accepted quotes */}
      {quote.status === 'accepted' && (
        <div className="flex justify-end">
          <Link
            href={`/api/quotes/${id}/pdf`}
            target="_blank"
            className={buttonVariants({ variant: 'outline' })}
          >
            Descargar PDF
          </Link>
        </div>
      )}
    </div>
  )
}
