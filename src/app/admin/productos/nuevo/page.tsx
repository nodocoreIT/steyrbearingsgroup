export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getAllCategories } from '@/lib/categories/queries'
import { createProduct } from '@/lib/products/actions'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ImagePicker } from '@/components/features/products/ImagePicker'

export default async function NuevoProductoPage() {
  const categories = await getAllCategories()

  async function handleCreate(formData: FormData) {
    'use server'
    const result = await createProduct(formData)
    if (result.success) redirect('/admin/productos')
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Nuevo Producto</h1>
        <p className="text-sm text-muted-foreground">Completá los datos del producto</p>
      </div>

      <form action={handleCreate} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Nombre</Label>
            <Input id="name" name="name" required placeholder="ej. Rodamiento rígido de bolas 6203" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sku">SKU</Label>
            <Input id="sku" name="sku" required placeholder="ej. 6203-2RS" />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="categoryId">Categoría</Label>
          <select
            id="categoryId"
            name="categoryId"
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
            placeholder="Descripción detallada del producto"
            className="w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 resize-y"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="specs">
            Especificaciones{' '}
            <span className="text-muted-foreground text-xs">(clave: valor, una por línea)</span>
          </Label>
          <textarea
            id="specs"
            name="specs"
            rows={4}
            placeholder="Diámetro interior: 17mm&#10;Diámetro exterior: 40mm&#10;Ancho: 12mm"
            className="w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm font-mono outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 resize-y"
          />
        </div>

        <div className="space-y-1.5">
          <Label>Imágenes</Label>
          <ImagePicker />
        </div>

        <div className="flex items-center gap-2">
          <input type="hidden" name="active" value="false" />
          <input
            id="active"
            name="active"
            type="checkbox"
            value="true"
            defaultChecked
            className="size-4 rounded border border-input"
          />
          <Label htmlFor="active">Activo (visible en el catálogo)</Label>
        </div>

        <div className="flex gap-2 pt-2">
          <Button type="submit">Crear Producto</Button>
          <Link href="/admin/productos" className={buttonVariants({ variant: 'outline' })}>
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  )
}
