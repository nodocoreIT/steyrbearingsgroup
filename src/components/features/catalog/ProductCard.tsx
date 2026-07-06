import Link from 'next/link'
import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { AddToListButton } from './AddToListButton'

interface ProductCardProps {
  id: string
  name: string
  sku: string
  description?: string | null
  images?: string[] | null
  categoryName?: string | null
  /** Slug used for the public URL — falls back to SKU */
  slug?: string
  isAuthenticated?: boolean
}

export function ProductCard({
  id,
  name,
  sku,
  description,
  images,
  categoryName,
  slug,
  isAuthenticated = false,
}: ProductCardProps) {
  const href = `/catalogo/${encodeURIComponent(slug ?? sku)}`
  const firstImage = images?.[0]

  return (
    <Card className="flex flex-col h-full">
      <Link href={href} className="block">
        {firstImage ? (
          <div className="relative aspect-[4/3] overflow-hidden rounded-t-xl bg-muted">
            <Image src={firstImage} alt={name} fill className="object-cover" />
          </div>
        ) : (
          <div className="relative aspect-[4/3] overflow-hidden rounded-t-xl bg-muted">
            <Image
              src="/imagen_no_disponible.png"
              alt="Imagen no disponible"
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              className="object-contain"
            />
          </div>
        )}
      </Link>

      <CardHeader>
        <CardTitle className="line-clamp-2 text-sm">
          <Link href={href} className="hover:underline">{name}</Link>
        </CardTitle>
        {categoryName && (
          <Badge variant="secondary" className="w-fit text-xs">
            {categoryName}
          </Badge>
        )}
      </CardHeader>

      {description && (
        <CardContent className="flex-1">
          <p className="text-xs text-muted-foreground line-clamp-3">{description}</p>
        </CardContent>
      )}

      <CardFooter className="flex items-center justify-between gap-2 pt-2">
        <span className="text-xs font-mono text-muted-foreground">{sku}</span>
        <div className="flex items-center gap-2">
          <Link href={href} className="text-xs font-bold text-primary underline hover:opacity-80">
            Ver detalles
          </Link>
          <AddToListButton
            productId={id}
            isAuthenticated={isAuthenticated}
            returnUrl="/catalogo"
          />
        </div>
      </CardFooter>
    </Card>
  )
}
