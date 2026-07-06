export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { db } from '@/db'
import { products, productEmbeddings } from '@/db/schema'
import { eq, isNull, desc } from 'drizzle-orm'
import { getAllProducts } from '@/lib/products/queries'
import { getAllCategories } from '@/lib/categories/queries'
import { toggleProductActive, deleteProduct, cloneProduct } from '@/lib/products/actions'
import { Button, buttonVariants } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Pencil, Trash2, Copy } from 'lucide-react'
import { ActionTooltip } from '@/components/ui/action-tooltip'
import { SearchInput } from '@/components/ui/search-input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface PageProps {
  searchParams: Promise<{ q?: string; categoryId?: string; page?: string; tab?: string }>
}

async function getProductsWithoutEmbeddings() {
  return db
    .select({
      id: products.id,
      name: products.name,
      sku: products.sku,
    })
    .from(products)
    .leftJoin(productEmbeddings, eq(productEmbeddings.productId, products.id))
    .where(isNull(productEmbeddings.id))
    .orderBy(desc(products.createdAt))
}

export default async function ProductosPage({ searchParams }: PageProps) {
  const params = await searchParams
  const { q, categoryId, page, tab = 'products' } = params

  const [{ data: productList, total, totalPages }, categoriesList, productsWithoutEmbeddings] =
    await Promise.all([
      getAllProducts({
        search: q,
        categoryId,
        page: page ? Number(page) : 1,
      }),
      getAllCategories(),
      tab === 'embeddings' ? getProductsWithoutEmbeddings() : Promise.resolve([]),
    ])

  const currentPage = page ? Number(page) : 1

  const tabs = [
    { id: 'products', label: 'Productos' },
    { id: 'categories', label: 'Categorías' },
    { id: 'embeddings', label: 'Embeddings' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Productos</h1>
          <p className="text-sm text-muted-foreground">{total} total</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/productos/importar"
            className={buttonVariants({ variant: 'outline' })}
          >
            Importar CSV
          </Link>
          <Link href="/admin/productos/nuevo" className={buttonVariants()}>
            Nuevo Producto
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        {tabs.map((t) => (
          <Link
            key={t.id}
            href={`/admin/productos?tab=${t.id}`}
            className={[
              'px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px',
              tab === t.id
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            ].join(' ')}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {/* Products tab */}
      {tab === 'products' && (
        <div className="space-y-4">
          {/* Filters */}
          <form className="flex gap-2" method="GET">
            <input type="hidden" name="tab" value="products" />
            <SearchInput
              param="q"
              defaultValue={q}
              placeholder="Buscar productos…"
              className="w-48 h-8"
            />
            <select
              name="categoryId"
              defaultValue={categoryId}
              className="h-8 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <option value="">Todas las categorías</option>
              {categoriesList.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <Button type="submit" size="sm">Filtrar</Button>
            <Link href="/admin/productos" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
              Limpiar
            </Link>
          </form>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="w-56" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {productList.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No se encontraron productos.
                  </TableCell>
                </TableRow>
              )}
              {productList.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell className="text-muted-foreground text-xs font-mono">{p.sku}</TableCell>
                  <TableCell>
                    {p.categoryName ? (
                      <Badge variant="secondary">{p.categoryName}</Badge>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <form
                      action={async () => {
                        'use server'
                        await toggleProductActive(p.id)
                      }}
                    >
                      <button
                        type="submit"
                        className={[
                          'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-opacity hover:opacity-75 cursor-pointer',
                          p.active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-700',
                        ].join(' ')}
                        title={p.active ? 'Clic para desactivar' : 'Clic para activar'}
                      >
                        {p.active ? 'Activo' : 'Inactivo'}
                      </button>
                    </form>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 justify-end">
                      <ActionTooltip label="Editar">
                        <Link
                          href={`/admin/productos/${p.id}/editar`}
                          className={buttonVariants({ variant: 'ghost', size: 'sm' })}
                        >
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </ActionTooltip>
                      <ActionTooltip label="Clonar">
                        <form
                          action={async () => {
                            'use server'
                            await cloneProduct(p.id)
                          }}
                        >
                          <Button variant="ghost" size="sm" type="submit">
                            <Copy className="h-4 w-4" />
                          </Button>
                        </form>
                      </ActionTooltip>
                      <ActionTooltip label="Borrar">
                        <form
                          action={async () => {
                            'use server'
                            await deleteProduct(p.id)
                          }}
                        >
                          <Button
                            variant="ghost"
                            size="sm"
                            type="submit"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </form>
                      </ActionTooltip>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {totalPages > 1 && (
            <div className="flex gap-2 items-center justify-center">
              {currentPage > 1 && (
                <Link
                  href={`?tab=products&page=${currentPage - 1}${q ? `&q=${q}` : ''}${categoryId ? `&categoryId=${categoryId}` : ''}`}
                  className={buttonVariants({ variant: 'outline', size: 'sm' })}
                >
                  Anterior
                </Link>
              )}
              <span className="text-sm text-muted-foreground">
                Página {currentPage} de {totalPages}
              </span>
              {currentPage < totalPages && (
                <Link
                  href={`?tab=products&page=${currentPage + 1}${q ? `&q=${q}` : ''}${categoryId ? `&categoryId=${categoryId}` : ''}`}
                  className={buttonVariants({ variant: 'outline', size: 'sm' })}
                >
                  Siguiente
                </Link>
              )}
            </div>
          )}
        </div>
      )}

      {/* Categories tab */}
      {tab === 'categories' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Link
              href="/admin/productos/categorias/nueva"
              className={buttonVariants()}
            >
              Nueva Categoría
            </Link>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead className="text-right">Productos</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {categoriesList.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    Sin categorías aún.
                  </TableCell>
                </TableRow>
              )}
              {categoriesList.map((cat) => (
                <TableRow key={cat.id}>
                  <TableCell className="font-medium">{cat.name}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{cat.slug}</Badge>
                  </TableCell>
                  <TableCell className="text-right">{cat.productCount}</TableCell>
                  <TableCell>
                    <Link
                      href={`/admin/productos/categorias/${cat.id}/editar`}
                      className={buttonVariants({ variant: 'outline', size: 'sm' })}
                    >
                      Editar
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Embeddings tab */}
      {tab === 'embeddings' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {productsWithoutEmbeddings.length} producto
              {productsWithoutEmbeddings.length !== 1 ? 's' : ''} sin embeddings
            </p>
          </div>

          {productsWithoutEmbeddings.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              Todos los productos tienen embeddings.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead className="w-32" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {productsWithoutEmbeddings.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell className="text-xs font-mono text-muted-foreground">{p.sku}</TableCell>
                    <TableCell>
                      <EmbedButton productId={p.id} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      )}
    </div>
  )
}

function EmbedButton({ productId }: { productId: string }) {
  async function generate() {
    'use server'
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
    await fetch(`${baseUrl}/api/embeddings/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-token': process.env.INTERNAL_API_SECRET ?? '',
      },
      body: JSON.stringify({ productId }),
    })
  }

  return (
    <form action={generate}>
      <Button type="submit" size="sm" variant="outline">
        Generar
      </Button>
    </form>
  )
}
