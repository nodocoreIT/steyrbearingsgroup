export const dynamic = 'force-dynamic'

import { getAllClients } from '@/lib/clients/queries'
import { deleteClient } from '@/lib/clients/actions'
import { createAdminClient } from '@/lib/supabase/admin'
import { Badge } from '@/components/ui/badge'
import { SearchInput } from '@/components/ui/search-input'
import Link from 'next/link'
import { Pencil, Trash2 } from 'lucide-react'
import { ActionTooltip } from '@/components/ui/action-tooltip'
import { NormalizeNamesButton } from '@/components/features/clients/NormalizeNamesButton'

interface SearchParams {
  search?: string
  validationStatus?: string
  bcraRiskLevel?: string
  page?: string
}

interface Props {
  searchParams: Promise<SearchParams>
}

function AfipBadge({ status }: { status: string }) {
  if (status === 'validated') {
    return <Badge className="bg-green-100 text-green-800">Validado</Badge>
  }
  if (status === 'invalid') {
    return <Badge className="bg-red-100 text-red-800">Inválido</Badge>
  }
  return <Badge className="bg-yellow-100 text-yellow-800">Pendiente</Badge>
}

function BcraBadge({ riskLevel }: { riskLevel: string | null }) {
  if (!riskLevel || riskLevel === 'unknown') {
    return <Badge variant="outline">Desconocido</Badge>
  }
  if (riskLevel === 'normal') {
    return <Badge className="bg-green-100 text-green-800">Normal</Badge>
  }
  if (riskLevel === 'con_seguimiento') {
    return <Badge className="bg-yellow-100 text-yellow-800">Con seguimiento</Badge>
  }
  if (riskLevel === 'riesgo') {
    return <Badge className="bg-orange-100 text-orange-800">Riesgo</Badge>
  }
  return <Badge className="bg-red-100 text-red-800">Irrecuperable</Badge>
}

export default async function ClientesPage({ searchParams }: Props) {
  const params = await searchParams
  const page = Number(params.page ?? 1)

  const [clients, authData] = await Promise.all([
    getAllClients({
      search: params.search,
      validationStatus: (params.validationStatus as 'pending' | 'validated' | 'invalid' | 'all') ?? 'all',
      bcraRiskLevel: params.bcraRiskLevel,
      page,
    }),
    createAdminClient().auth.admin.listUsers({ perPage: 1000 }),
  ])

  const unconfirmedIds = new Set(
    (authData.data?.users ?? [])
      .filter((u) => !u.email_confirmed_at)
      .map((u) => u.id)
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Clientes</h1>
        <div className="flex items-center gap-2">
          <NormalizeNamesButton />
          <Link
            href="/admin/clientes/nuevo"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Nuevo cliente
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <form className="flex gap-3">
          <SearchInput
            param="search"
            defaultValue={params.search}
            placeholder="Buscar por nombre o CUIT…"
            className="w-64"
          />
          <select
            name="validationStatus"
            defaultValue={params.validationStatus ?? 'all'}
            className="border rounded-md px-3 py-2 text-sm bg-background"
          >
            <option value="all">Todos los estados AFIP</option>
            <option value="validated">Validado</option>
            <option value="pending">Pendiente</option>
            <option value="invalid">Inválido</option>
          </select>
          <select
            name="bcraRiskLevel"
            defaultValue={params.bcraRiskLevel ?? ''}
            className="border rounded-md px-3 py-2 text-sm bg-background"
          >
            <option value="">Todos los riesgos BCRA</option>
            <option value="normal">Normal</option>
            <option value="con_seguimiento">Con seguimiento</option>
            <option value="riesgo">Riesgo</option>
            <option value="irrecuperable">Irrecuperable</option>
          </select>
          <button
            type="submit"
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm"
          >
            Filtrar
          </button>
        </form>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Nombre</th>
              <th className="text-left px-4 py-3 font-medium">CUIT</th>
              <th className="text-left px-4 py-3 font-medium">AFIP</th>
              <th className="text-left px-4 py-3 font-medium">BCRA</th>
              <th className="text-left px-4 py-3 font-medium">Registrado</th>
              <th className="px-4 py-3 font-medium w-20"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {clients.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  No se encontraron clientes.
                </td>
              </tr>
            ) : (
              clients.map((client) => (
                <tr key={client.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/clientes/${client.id}`}
                        className="font-medium hover:underline"
                      >
                        {client.razonSocial ?? client.fullName}
                      </Link>
                      {unconfirmedIds.has(client.profileId) && (
                        <Badge className="bg-yellow-100 text-yellow-800 text-[10px] px-1.5 py-0 leading-4">
                          Sin activar
                        </Badge>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground font-mono">
                    {client.cuit}
                  </td>
                  <td className="px-4 py-3">
                    <AfipBadge status={client.afipStatus} />
                  </td>
                  <td className="px-4 py-3">
                    <BcraBadge riskLevel={client.bcraRiskLevel} />
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(client.createdAt).toLocaleDateString('es-AR')}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <ActionTooltip label="Editar">
                        <Link
                          href={`/admin/clientes/${client.id}/editar`}
                          className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </Link>
                      </ActionTooltip>
                      <ActionTooltip label="Eliminar">
                        <form
                          action={async () => {
                            'use server'
                            await deleteClient(client.id)
                          }}
                        >
                          <button
                            type="submit"
                            className="p-1.5 rounded hover:bg-red-50 text-muted-foreground hover:text-red-600 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </form>
                      </ActionTooltip>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {clients.length === 20 && (
        <div className="flex justify-end gap-2">
          {page > 1 && (
            <Link
              href={`?page=${page - 1}${params.search ? `&search=${params.search}` : ''}`}
              className="px-3 py-1 border rounded-md text-sm"
            >
              Anterior
            </Link>
          )}
          <Link
            href={`?page=${page + 1}${params.search ? `&search=${params.search}` : ''}`}
            className="px-3 py-1 border rounded-md text-sm"
          >
            Siguiente
          </Link>
        </div>
      )}
    </div>
  )
}
