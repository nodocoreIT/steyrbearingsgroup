export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { getAllProducts } from '@/lib/products/queries'
import { getAllCategories } from '@/lib/categories/queries'
import { createClient } from '@/lib/supabase/server'
import { ProductCard } from '@/components/features/catalog/ProductCard'
import { ProductGrid } from '@/components/features/catalog/ProductGrid'
import { SearchBar } from '@/components/features/catalog/SearchBar'
import { buttonVariants } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Suspense } from 'react'

interface PageProps {
  searchParams: Promise<{
    q?: string
    categorySlug?: string
    categoryId?: string
    page?: string
  }>
}

function CategoryList({
  categories,
  resolvedCategoryId,
  q,
}: {
  categories: Array<{ id: string; name: string; slug: string; productCount: number }>
  resolvedCategoryId: string | undefined
  q: string | undefined
}) {
  return (
    <ul className="space-y-1">
      <li>
        <Link
          href="/catalogo"
          className={[
            'text-sm block rounded px-2 py-1 hover:bg-muted transition-colors',
            !resolvedCategoryId ? 'font-semibold bg-muted' : 'text-muted-foreground',
          ].join(' ')}
        >
          Todos los productos
        </Link>
      </li>
      {categories.map((cat) => (
        <li key={cat.id}>
          <Link
            href={`/catalogo?categoryId=${cat.id}${q ? `&q=${encodeURIComponent(q)}` : ''}`}
            className={[
              'text-sm block rounded px-2 py-1 hover:bg-muted transition-colors',
              resolvedCategoryId === cat.id
                ? 'font-semibold bg-muted'
                : 'text-muted-foreground',
            ].join(' ')}
          >
            {cat.name}{' '}
            <span className="text-xs opacity-60">({cat.productCount})</span>
          </Link>
        </li>
      ))}
    </ul>
  )
}

export default async function CatalogoPage({ searchParams }: PageProps) {
  const params = await searchParams
  const { q, categorySlug, categoryId, page } = params

  const categories = await getAllCategories()

  const resolvedCategoryId =
    categoryId ||
    (categorySlug ? (categories.find((c) => c.slug === categorySlug)?.id ?? undefined) : undefined)

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const isAuthenticated = !!user

  const { data: productList, total, totalPages } = await getAllProducts({
    search: q,
    categoryId: resolvedCategoryId,
    active: true,
    page: page ? Number(page) : 1,
  })

  const currentPage = page ? Number(page) : 1

  return (
    <div className="flex gap-6">
      {/* Sidebar filters — hidden on mobile, shown on md+ */}
      <aside className="hidden md:block w-56 shrink-0 space-y-6">
        <div className="space-y-2">
          <h3 className="text-sm font-semibold">Categorías</h3>
          <CategoryList
            categories={categories}
            resolvedCategoryId={resolvedCategoryId}
            q={q}
          />
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 space-y-6">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Mobile filter button */}
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger className="rounded-md border px-3 py-2 text-sm font-medium hover:bg-muted flex items-center gap-2">
                <FilterIcon className="h-4 w-4" />
                Filtros
                {resolvedCategoryId && (
                  <span className="ml-1 rounded-full bg-primary w-2 h-2 inline-block" />
                )}
              </SheetTrigger>
              <SheetContent side="left" className="w-64">
                <SheetHeader>
                  <SheetTitle>Categorías</SheetTitle>
                </SheetHeader>
                <div className="mt-4">
                  <CategoryList
                    categories={categories}
                    resolvedCategoryId={resolvedCategoryId}
                    q={q}
                  />
                </div>
              </SheetContent>
            </Sheet>
          </div>

          <Suspense>
            <SearchBar placeholder="Buscar por nombre, SKU, descripción…" />
          </Suspense>
          {q && (
            <Badge variant="secondary" className="gap-1">
              Buscando: &quot;{q}&quot;&nbsp;
              <Link href={`/catalogo${resolvedCategoryId ? `?categoryId=${resolvedCategoryId}` : ''}`}>
                ×
              </Link>
            </Badge>
          )}
        </div>

        <p className="text-sm text-muted-foreground">
          {total} producto{total !== 1 ? 's' : ''} encontrado{total !== 1 ? 's' : ''}
        </p>

        {productList.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <p>Ningún producto coincide con tu búsqueda.</p>
            <Link
              href="/catalogo"
              className={buttonVariants({ variant: 'outline', size: 'sm' }) + ' mt-4 inline-flex'}
            >
              Limpiar filtros
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {productList.map((p) => (
              <ProductCard
                key={p.id}
                id={p.id}
                name={p.name}
                sku={p.sku}
                description={p.description}
                images={p.images}
                categoryName={p.categoryName}
                slug={p.sku}
                isAuthenticated={isAuthenticated}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex gap-2 items-center justify-center pt-4">
            {currentPage > 1 && (
              <Link
                href={`/catalogo?page=${currentPage - 1}${q ? `&q=${q}` : ''}${resolvedCategoryId ? `&categoryId=${resolvedCategoryId}` : ''}`}
                className={buttonVariants({ variant: 'outline', size: 'sm' })}
              >
                Anterior
              </Link>
            )}
            <span className="text-sm text-muted-foreground">
              {currentPage} / {totalPages}
            </span>
            {currentPage < totalPages && (
              <Link
                href={`/catalogo?page=${currentPage + 1}${q ? `&q=${q}` : ''}${resolvedCategoryId ? `&categoryId=${resolvedCategoryId}` : ''}`}
                className={buttonVariants({ variant: 'outline', size: 'sm' })}
              >
                Siguiente
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function FilterIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  )
}
