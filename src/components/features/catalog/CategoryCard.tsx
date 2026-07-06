import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'

interface CategoryCardProps {
  name: string
  slug: string
  image?: string
  productCount?: number
}

export function CategoryCard({ name, slug, image, productCount }: CategoryCardProps) {
  return (
    <Link href={`/catalogo?categorySlug=${encodeURIComponent(slug)}`}>
      <Card className="hover:ring-2 hover:ring-primary/40 transition-all cursor-pointer h-full overflow-hidden">
        {image && (
          <div className="relative w-full aspect-square bg-white">
            <Image
              src={image}
              alt={name}
              fill
              className="object-contain p-3"
              sizes="(max-width: 768px) 50vw, 25vw"
            />
          </div>
        )}
        <CardContent className="p-3">
          <p className="text-sm font-semibold leading-tight">{name}</p>
          {productCount !== undefined && (
            <p className="text-xs text-muted-foreground mt-1">
              {productCount} producto{productCount !== 1 ? 's' : ''}
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
