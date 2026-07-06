export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { getProductById } from '@/lib/products/queries'
import { getAllCategories } from '@/lib/categories/queries'
import { updateProduct } from '@/lib/products/actions'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ImagePicker } from '@/components/features/products/ImagePicker'

interface Props {
  params: Promise<{ id: string }>
}

function specsToText(specs: unknown): string {
  if (!specs || typeof specs !== 'object') return ''
  return Object.entries(specs as Record<string, string>)
    .map(([k, v]) => `${k}: ${v}`)
    .join('\n')
}

export default async function EditarProductoPage({ params }: Props) {
  const { id } = await params
  const [product, categories] = await Promise.all([
    getProductById(id),
    getAllCategories(),
  ])

  if (!product) notFound()

  async function handleUpdate(formData: FormData) {
    'use server'
    const result = await updateProduct(id, formData)
    if (result.success) redirect('/admin/productos')
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Editar Producto</h1>
        <p className="text-sm text-muted-foreground font-mono">{product.sku}</p>
      </div>

      <form action={handleUpdate} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Nombre</Label>
            <Input id="name" name="name" required defaultValue={product.name} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sku">SKU</Label>
            <Input id="sku" name="sku" required defaultValue={product.sku} />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="categoryId">Categoría</Label>
          <select
            id="categoryId"
            name="categoryId"
            defaultValue={product.categoryId ?? ''}
            className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <option value="">Sin categoría</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="description">Descripción</Label>
          <textarea
            id="description"
            name="description"
            rows={4}
            defaultValue={product.description ?? ''}
            className="w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 resize-y"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="specs">
            Especificaciones <span className="text-muted-foreground text-xs">(clave: valor, una por línea)</span>
          </Label>
          <textarea
            id="specs"
            name="specs"
            rows={4}
            defaultValue={specsToText(product.specs)}
            className="w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm font-mono outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 resize-y"
          />
        </div>

        <div className="space-y-1.5">
          <Label>Imágenes</Label>
          <ImagePicker defaultImages={product.images ?? []} />
        </div>

        <div className="flex items-center gap-2">
          <input type="hidden" name="active" value="false" />
          <input
            id="active"
            name="active"
            type="checkbox"
            value="true"
            defaultChecked={product.active}
            className="size-4 rounded border border-input"
          />
          <Label htmlFor="active">Activo (visible en el catálogo)</Label>
        </div>

        <div className="flex gap-2 pt-2">
          <Button type="submit">Guardar Cambios</Button>
          <Link href="/admin/productos" className={buttonVariants({ variant: 'outline' })}>
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  )
}
