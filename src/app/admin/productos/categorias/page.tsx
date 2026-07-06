export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { getAllCategories } from '@/lib/categories/queries'
import { deleteCategory } from '@/lib/categories/actions'
import { Button, buttonVariants } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export default async function CategoriasPage() {
  const categories = await getAllCategories()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Categorías</h1>
          <p className="text-sm text-muted-foreground">{categories.length} categorías</p>
        </div>
        <Link href="/admin/productos/categorias/nueva" className={buttonVariants()}>
          Nueva Categoría
        </Link>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Slug</TableHead>
            <TableHead className="text-right">Productos</TableHead>
            <TableHead className="w-28" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {categories.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                Sin categorías aún.
              </TableCell>
            </TableRow>
          )}
          {categories.map((cat) => (
            <TableRow key={cat.id}>
              <TableCell className="font-medium">{cat.name}</TableCell>
              <TableCell>
                <Badge variant="secondary">{cat.slug}</Badge>
              </TableCell>
              <TableCell className="text-right">{cat.productCount}</TableCell>
              <TableCell>
                <div className="flex gap-2 justify-end">
                  <Link
                    href={`/admin/productos/categorias/${cat.id}/editar`}
                    className={buttonVariants({ variant: 'outline', size: 'sm' })}
                  >
                    Editar
                  </Link>
                  <form
                    action={async () => {
                      'use server'
                      await deleteCategory(cat.id)
                    }}
                  >
                    <Button
                      variant="destructive"
                      size="sm"
                      type="submit"
                      disabled={cat.productCount > 0}
                    >
                      Eliminar
                    </Button>
                  </form>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
