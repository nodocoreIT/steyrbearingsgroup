import { redirect } from 'next/navigation'
import { createCategory } from '@/lib/categories/actions'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'

export default function NuevaCategoriaPage() {
  async function handleCreate(formData: FormData) {
    'use server'
    const result = await createCategory(formData)
    if (result.success) redirect('/admin/productos/categorias')
  }

  return (
    <div className="max-w-md space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Nueva Categoría</h1>
        <p className="text-sm text-muted-foreground">Creá una categoría de productos</p>
      </div>

      <form action={handleCreate} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="name">Nombre</Label>
          <Input id="name" name="name" required placeholder="ej. Rodamientos" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="slug">
            Slug <span className="text-muted-foreground text-xs">(se genera automáticamente si se deja vacío)</span>
          </Label>
          <Input id="slug" name="slug" placeholder="ej. rodamientos" />
        </div>
        <div className="flex gap-2">
          <Button type="submit">Crear</Button>
          <Link
            href="/admin/productos/categorias"
            className={buttonVariants({ variant: 'outline' })}
          >
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  )
}
