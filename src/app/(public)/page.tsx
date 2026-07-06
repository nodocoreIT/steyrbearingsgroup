export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { getActiveProducts } from '@/lib/products/queries'
import { getAllCategories } from '@/lib/categories/queries'
import { ProductCard } from '@/components/features/catalog/ProductCard'
import { CategoryCard } from '@/components/features/catalog/CategoryCard'
import { ProductGrid } from '@/components/features/catalog/ProductGrid'
import { HeroCarousel } from '@/components/features/catalog/HeroCarousel'
import { BrandsMarquee } from '@/components/features/catalog/BrandsMarquee'
import { buttonVariants } from '@/components/ui/button'
import { Button } from '@/components/ui/button'

const CATEGORY_IMAGES: Record<string, string> = {
  'rodamiento-de-ruedas':    '/categorias/rodamiento-ruedas.png',
  'rodamientos-de-cajas':    '/categorias/rodamiento-cajas.png',
  'rodamientos-diferencial': '/categorias/rodamiento-diferencial.png',
  'rodamientos-agricolas':   '/categorias/agricola.png',
  'rodamiento-de-usos':      '/categorias/multiples-usos.png',
  'crapodinas-de-embrague':  '/categorias/crapodina%20de%20embrague.png',
}

export default async function CatalogHomePage() {
  const [recentProducts, categories] = await Promise.all([
    getActiveProducts(8),
    getAllCategories(),
  ])

  return (
    <div className="space-y-12">
      <HeroCarousel />

      {/* Hero — stacks vertically on mobile */}
      <section className="py-8 sm:py-12 text-center space-y-4">
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">
          Rodamientos y Componentes Industriales
        </h1>
        <p className="text-muted-foreground max-w-xl mx-auto text-sm sm:text-base">
          Explorá nuestro catálogo y agregá productos a tu lista de interés para solicitar un presupuesto.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
          <Link href="/catalogo" className={buttonVariants({ size: 'lg' })}>
            Ver Catálogo
          </Link>
          {/* Voice search placeholder — Slice 3 */}
          <Button variant="outline" size="lg" disabled>
            Búsqueda por voz (próximamente)
          </Button>
        </div>
      </section>

      {/* Featured categories — 2 cols on mobile, 4 on md+ */}
      {categories.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Categorías</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categories.slice(0, 8).map((cat) => (
              <CategoryCard
                key={cat.id}
                name={cat.name}
                slug={cat.slug}
                image={CATEGORY_IMAGES[cat.slug]}
                productCount={cat.productCount}
              />
            ))}
          </div>
        </section>
      )}

      {/* Recently added products */}
      {recentProducts.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Recién agregados</h2>
            <Link href="/catalogo" className="text-sm text-primary hover:underline">
              Ver todos
            </Link>
          </div>
          <ProductGrid>
            {recentProducts.map((p) => (
              <ProductCard
                key={p.id}
                id={p.id}
                name={p.name}
                sku={p.sku}
                images={p.images}
                categoryName={p.categoryName}
                slug={p.sku}
              />
            ))}
          </ProductGrid>
        </section>
      )}
      <BrandsMarquee />
    </div>
  )
}
