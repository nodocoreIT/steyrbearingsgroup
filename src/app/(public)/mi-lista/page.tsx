import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { getUser } from '@/lib/auth/get-user'
import {
  getInterestListWithItems,
  getClientIdByProfileId,
  getVendedores,
} from '@/lib/interest-lists/queries'
import { removeFromInterestList, updateItemQuantity, requestQuote } from '@/lib/interest-lists/actions'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ShoppingCart, Trash2, Package } from 'lucide-react'

export default async function MiCarritoPage() {
  const user = await getUser()
  if (!user) redirect('/login?returnUrl=/mi-lista')

  const clientId = await getClientIdByProfileId(user.id)
  if (!clientId) {
    return (
      <div className="text-center py-16 space-y-4">
        <p className="text-muted-foreground">Todavía no tenés un perfil de cliente.</p>
        <Link href="/register" className={buttonVariants()}>Completar registro</Link>
      </div>
    )
  }

  const [data, vendedores] = await Promise.all([
    getInterestListWithItems(clientId),
    getVendedores(),
  ])

  if (!data || data.items.length === 0) {
    return (
      <div className="max-w-lg mx-auto text-center py-20 space-y-4">
        <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground/40" />
        <h1 className="text-2xl font-semibold">Tu carrito está vacío</h1>
        <p className="text-muted-foreground text-sm">Explorá el catálogo y agregá productos.</p>
        <Link href="/catalogo" className={buttonVariants({ size: 'lg' })}>
          Ir al catálogo
        </Link>
      </div>
    )
  }

  const { list, items } = data

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Mi Carrito</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {items.length} {items.length === 1 ? 'producto' : 'productos'}
        </p>
      </div>

      {/* Items */}
      <div className="space-y-3">
        {items.map((item) => {
          const firstImage = item.productImages?.[0]
          return (
            <div
              key={item.id}
              className="flex gap-4 items-center rounded-xl border p-4 bg-card"
            >
              {/* Thumbnail */}
              <div className="relative size-16 shrink-0 rounded-lg overflow-hidden bg-muted">
                <Image
                  src={firstImage ?? '/imagen_no_disponible.png'}
                  alt={item.productName}
                  fill
                  sizes="64px"
                  className="object-contain"
                />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{item.productName}</p>
                <p className="text-xs font-mono text-muted-foreground">{item.productSku}</p>
                <form
                  action={async (fd: FormData) => {
                    'use server'
                    const qty = Number(fd.get('quantity'))
                    if (!isNaN(qty) && qty >= 1) await updateItemQuantity(item.id, qty)
                  }}
                  className="flex items-center gap-2 mt-2"
                >
                  <label className="text-xs text-muted-foreground">Cant.:</label>
                  <Input
                    name="quantity"
                    type="number"
                    min="1"
                    defaultValue={item.quantity}
                    className="w-16 h-7 text-xs"
                  />
                  <Button type="submit" size="xs" variant="outline">Actualizar</Button>
                </form>
              </div>

              {/* Remove */}
              <form
                action={async () => {
                  'use server'
                  await removeFromInterestList(item.id)
                }}
              >
                <Button type="submit" variant="ghost" size="icon-sm" className="text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </form>
            </div>
          )
        })}
      </div>

      {/* Order summary + vendedor selector */}
      <div className="rounded-xl border bg-card p-6 space-y-5">
        <h2 className="font-semibold text-base flex items-center gap-2">
          <Package className="h-4 w-4" />
          Procesar pedido
        </h2>

        <form
          action={async (fd: FormData) => {
            'use server'
            const vendedorId = fd.get('vendedorId')?.toString() || undefined
            await requestQuote(list.id, vendedorId)
            redirect('/mis-presupuestos')
          }}
          className="space-y-4"
        >
          <div className="space-y-1.5">
            <label htmlFor="vendedorId" className="text-sm font-medium">
              Asignar vendedor <span className="text-muted-foreground font-normal">(opcional)</span>
            </label>
            <select
              id="vendedorId"
              name="vendedorId"
              className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              <option value="">— Sin preferencia —</option>
              {vendedores.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.fullName}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">
              Si no seleccionás uno, el pedido queda disponible para cualquier vendedor.
            </p>
          </div>

          <div className="border-t pt-4 flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {items.length} {items.length === 1 ? 'producto' : 'productos'} en el pedido
            </div>
            <Button type="submit" size="lg">
              Confirmar pedido →
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
