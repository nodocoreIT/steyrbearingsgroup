export const dynamic = 'force-dynamic'

import { getClientWithScore } from '@/lib/clients/queries'
import { updateClient } from '@/lib/clients/actions'
import { notFound, redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
// Note: Button in this project does not support asChild

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditarClientePage({ params }: Props) {
  const { id } = await params
  const client = await getClientWithScore(id)
  if (!client) notFound()

  async function handleUpdate(formData: FormData) {
    'use server'
    const result = await updateClient(id, formData)
    if (result.success) {
      redirect(`/admin/clientes/${id}`)
    }
  }

  return (
    <div className="space-y-6 max-w-xl">
      <div className="flex items-center gap-4">
        <Link href={`/admin/clientes/${id}`} className="text-sm text-muted-foreground hover:underline">
          ← Volver
        </Link>
      </div>

      <h1 className="text-2xl font-bold">Editar cliente</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Datos del cliente</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={handleUpdate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Nombre completo</Label>
              <Input
                id="fullName"
                name="fullName"
                defaultValue={client.fullName}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="companyName">Empresa</Label>
              <Input
                id="companyName"
                name="companyName"
                defaultValue={client.companyName ?? ''}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                name="phone"
                defaultValue={client.phone ?? ''}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="razonSocial">Razón social</Label>
              <Input
                id="razonSocial"
                name="razonSocial"
                defaultValue={client.razonSocial ?? ''}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cuit">CUIT</Label>
              <Input
                id="cuit"
                name="cuit"
                defaultValue={client.cuit}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="industry">Industria</Label>
              <Input
                id="industry"
                name="industry"
                defaultValue={client.industry ?? ''}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit">Guardar cambios</Button>
              <Link
                href={`/admin/clientes/${id}`}
                className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
              >
                Cancelar
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
