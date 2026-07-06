export const dynamic = 'force-dynamic'

import { getPriceListById, getPriceListRules, getPriceListClientsCount } from '@/lib/pricing/queries'
import {
  addPriceListRule,
  updatePriceListRule,
  deletePriceListRule,
} from '@/lib/pricing/actions'
import { getAllProducts } from '@/lib/products/queries'
import { getAllCategories } from '@/lib/categories/queries'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { requireAdmin } from '@/lib/auth/get-user'
import { notFound } from 'next/navigation'
import Link from 'next/link'

interface Props {
  params: Promise<{ id: string }>
}

export default async function PriceListDetailPage({ params }: Props) {
  await requireAdmin()
  const { id } = await params

  const [list, rules, clientCount, productsResult, categoriesList] = await Promise.all([
    getPriceListById(id),
    getPriceListRules(id),
    getPriceListClientsCount(id),
    getAllProducts({ active: true, limit: 500 }),
    getAllCategories(),
  ])

  if (!list) notFound()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/precios" className="text-sm text-muted-foreground hover:underline">
          ← Listas de Precios
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold">{list.name}</h1>
        {list.description && (
          <p className="text-muted-foreground text-sm mt-1">{list.description}</p>
        )}
        <p className="text-xs text-muted-foreground mt-1">
          {clientCount} cliente{clientCount !== 1 ? 's' : ''} usando esta lista
        </p>
      </div>

      {/* Add rule form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Agregar Regla</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            action={async (formData: FormData) => {
              'use server'
              const productId = formData.get('productId') as string
              const categoryId = formData.get('categoryId') as string
              const marginPercent = Number(formData.get('marginPercent'))

              if (!marginPercent) return

              await addPriceListRule(id, {
                productId: productId || undefined,
                categoryId: categoryId || undefined,
                marginPercent,
              })
            }}
            className="grid grid-cols-1 gap-4 sm:grid-cols-4"
          >
            <div className="space-y-1">
              <Label htmlFor="productId">Producto (opcional)</Label>
              <select
                id="productId"
                name="productId"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">— Seleccionar producto —</option>
                {productsResult.data.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.sku})
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="categoryId">Categoría (opcional)</Label>
              <select
                id="categoryId"
                name="categoryId"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">— Seleccionar categoría —</option>
                {categoriesList.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="marginPercent">Margen %</Label>
              <Input
                id="marginPercent"
                name="marginPercent"
                type="number"
                step="0.01"
                min="0"
                max="999"
                placeholder="25"
                required
              />
            </div>
            <div className="flex items-end">
              <Button type="submit" className="w-full">
                Agregar Regla
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Rules table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Reglas{' '}
            <Badge variant="secondary" className="ml-2">
              {rules.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {rules.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">Sin reglas aún. Agregá una arriba.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Destino</th>
                  <th className="px-4 py-3 font-medium">Tipo</th>
                  <th className="px-4 py-3 font-medium text-right">Margen %</th>
                  <th className="px-4 py-3 font-medium" />
                </tr>
              </thead>
              <tbody>
                {rules.map((rule) => (
                  <tr key={rule.id} className="border-b last:border-0">
                    <td className="px-4 py-3">
                      {rule.productName
                        ? `${rule.productName} (${rule.productSku})`
                        : rule.categoryName ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline">
                        {rule.productId ? 'Producto' : 'Categoría'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right font-mono">
                      {Number(rule.marginPercent).toFixed(2)}%
                    </td>
                    <td className="px-4 py-3 text-right">
                      <form
                        action={async () => {
                          'use server'
                          await deletePriceListRule(rule.id)
                        }}
                        className="inline"
                      >
                        <Button type="submit" size="sm" variant="destructive">
                          Eliminar
                        </Button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
