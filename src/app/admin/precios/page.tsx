import { getAllPriceLists } from '@/lib/pricing/queries'
import { createPriceList } from '@/lib/pricing/actions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { requireAdmin } from '@/lib/auth/get-user'

export default async function PreciosPage() {
  await requireAdmin()

  const lists = await getAllPriceLists()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Listas de Precios</h1>
          <p className="text-sm text-muted-foreground">
            Configurá reglas de margen por producto o categoría.
          </p>
        </div>
      </div>

      {/* Create form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Nueva Lista de Precios</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            action={async (formData: FormData) => {
              'use server'
              const name = formData.get('name') as string
              const description = formData.get('description') as string
              if (!name) return
              await createPriceList({ name, description: description || undefined })
            }}
            className="flex flex-col gap-4 sm:flex-row sm:items-end"
          >
            <div className="flex-1 space-y-1">
              <Label htmlFor="name">Nombre</Label>
              <Input id="name" name="name" placeholder="ej. Mayorista Nivel A" required />
            </div>
            <div className="flex-1 space-y-1">
              <Label htmlFor="description">Descripción (opcional)</Label>
              <Input id="description" name="description" placeholder="ej. 25% de margen para compradores mayoristas" />
            </div>
            <Button type="submit">Crear</Button>
          </form>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {lists.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">Sin listas de precios aún.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Nombre</th>
                  <th className="px-4 py-3 font-medium">Descripción</th>
                  <th className="px-4 py-3 font-medium text-right">Reglas</th>
                  <th className="px-4 py-3 font-medium text-right">Creada</th>
                  <th className="px-4 py-3 font-medium" />
                </tr>
              </thead>
              <tbody>
                {lists.map((list) => (
                  <tr key={list.id} className="border-b last:border-0 hover:bg-muted/40">
                    <td className="px-4 py-3 font-medium">{list.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {list.description ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Badge variant="secondary">{list.ruleCount}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right text-muted-foreground">
                      {new Date(list.createdAt).toLocaleDateString('es-AR')}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/precios/${list.id}`}
                        className={buttonVariants({ variant: 'outline', size: 'sm' })}
                      >
                        Ver reglas
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
