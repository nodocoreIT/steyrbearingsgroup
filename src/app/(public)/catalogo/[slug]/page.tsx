export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { db } from '@/db'
import { products, categories } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { ProductSpecs } from '@/components/features/catalog/ProductSpecs'
import { ProductCard } from '@/components/features/catalog/ProductCard'
import { ProductGrid } from '@/components/features/catalog/ProductGrid'
import { buttonVariants } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface Props {
  params: Promise<{ slug: string }>
}

async function getProductBySku(sku: string) {
  const rows = await db
    .select({
      id: products.id,
      sku: products.sku,
      name: products.name,
      description: products.description,
      specs: products.specs,
      images: products.images,
      active: products.active,
      categoryId: products.categoryId,
      createdAt: products.createdAt,
      categoryName: categories.name,
      categorySlug: categories.slug,
    })
    .from(products)
    .leftJoin(categories, eq(categories.id, products.categoryId))
    .where(eq(products.sku, sku))
    .limit(1)

  return rows[0] ?? null
}

interface RelatedProduct {
  id: string
  name: string
  sku: string
  description?: string | null
  images?: string[] | null
  categoryName?: string | null
}

async function getRelatedProducts(productName: string, excludeId: string): Promise<RelatedProduct[]> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
    const res = await fetch(
      `${baseUrl}/api/search?q=${encodeURIComponent(productName)}&type=hybrid`,
      { next: { revalidate: 3600 } }
    )
    if (!res.ok) return []
    const data = (await res.json()) as { results?: RelatedProduct[] }
    return (data.results ?? [])
      .filter((r) => r.id !== excludeId)
      .slice(0, 4)
  } catch {
    return []
  }
}

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params
  const decodedSku = decodeURIComponent(slug)

  const product = await getProductBySku(decodedSku)
  if (!product || !product.active) notFound()

  const related = await getRelatedProducts(product.name, product.id)
  const firstImage = product.images?.[0]

  return (
    <div className="space-y-10">
      {/* Breadcrumb */}
      <nav className="text-sm text-muted-foreground flex gap-2 items-center">
        <Link href="/" className="hover:underline">Inicio</Link>
        <span>/</span>
        <Link href="/catalogo" className="hover:underline">Catálogo</Link>
        {product.categoryName && (
          <>
            <span>/</span>
            <Link
              href={`/catalogo?categorySlug=${product.categorySlug}`}
              className="hover:underline"
            >
              {product.categoryName}
            </Link>
          </>
        )}
        <span>/</span>
        <span className="text-foreground">{product.name}</span>
      </nav>

      {/* Product detail */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Image */}
        <div className="space-y-3">
          {firstImage ? (
            <div className="relative aspect-square rounded-xl overflow-hidden bg-muted border">
              <Image src={firstImage} alt={product.name} fill className="object-cover" />
            </div>
          ) : (
            <div className="relative aspect-square rounded-xl overflow-hidden bg-muted border">
              <Image src="/imagen_no_disponible.png" alt="Imagen no disponible" fill sizes="(max-width: 768px) 100vw, 50vw" className="object-contain" />
            </div>
          )}
          {/* Additional images */}
          {(product.images?.length ?? 0) > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {(product.images as string[]).slice(1).map((img, i) => (
                <div
                  key={i}
                  className="relative size-16 shrink-0 rounded-lg overflow-hidden border bg-muted"
                >
                  <Image src={img} alt={`${product.name} ${i + 2}`} fill className="object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="space-y-4">
          {product.categoryName && (
            <Badge variant="secondary">{product.categoryName}</Badge>
          )}
          <h1 className="text-2xl font-semibold">{product.name}</h1>
          <p className="text-sm font-mono text-muted-foreground">SKU: {product.sku}</p>

          {product.description && (
            <p className="text-sm leading-relaxed text-muted-foreground">{product.description}</p>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-3 pt-2">
            <Link
              href={`/mi-lista?addProduct=${product.id}`}
              className={buttonVariants()}
            >
              Agregar al carrito
            </Link>
            <Link
              href={`/mi-lista?addProduct=${product.id}&requestQuote=true`}
              className={buttonVariants({ variant: 'outline' })}
            >
              Solicitar presupuesto directo
            </Link>
          </div>
        </div>
      </div>

      {/* Specs */}
      {Boolean(product.specs) && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Especificaciones técnicas</h2>
          <ProductSpecs specs={product.specs} />
        </section>
      )}

      {/* Related products */}
      {related.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Productos relacionados</h2>
          <ProductGrid>
            {related.map((r) => (
              <ProductCard
                key={r.id}
                id={r.id}
                name={r.name}
                sku={r.sku}
                description={r.description}
                images={r.images}
                categoryName={r.categoryName}
                slug={r.sku}
              />
            ))}
          </ProductGrid>
        </section>
      )}
    </div>
  )
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  const product = await getProductBySku(decodeURIComponent(slug))
  if (!product) return {}
  return {
    title: `${product.name} — Rodamientos`,
    description: product.description ?? `Repuesto industrial ${product.sku}`,
  }
}
