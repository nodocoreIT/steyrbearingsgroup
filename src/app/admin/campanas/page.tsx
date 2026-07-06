import { getAllCampaigns } from '@/lib/campaigns/queries'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

function CampaignStatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'draft':
      return <Badge variant="outline">Borrador</Badge>
    case 'scheduled':
      return <Badge className="bg-blue-100 text-blue-800">Programada</Badge>
    case 'running':
      return <Badge className="bg-yellow-100 text-yellow-800">En curso</Badge>
    case 'paused':
      return <Badge className="bg-orange-100 text-orange-800">Pausada</Badge>
    case 'completed':
      return <Badge className="bg-green-100 text-green-800">Completada</Badge>
    case 'cancelled':
      return <Badge className="bg-red-100 text-red-800">Cancelada</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

export default async function CampanasPage() {
  const campaigns = await getAllCampaigns()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Campañas</h1>
        <Link
          href="/admin/campanas/nueva"
          className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Nueva Campaña
        </Link>
      </div>

      {campaigns.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-muted-foreground">Sin campañas aún. Creá la primera.</p>
          <Link
            href="/admin/campanas/nueva"
            className="mt-4 inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Nueva Campaña
          </Link>
        </div>
      ) : (
        <div className="rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium">Nombre</th>
                <th className="px-4 py-3 text-left font-medium">Tipo</th>
                <th className="px-4 py-3 text-left font-medium">Estado</th>
                <th className="px-4 py-3 text-left font-medium">Destinatarios</th>
                <th className="px-4 py-3 text-left font-medium">Creada</th>
                <th className="px-4 py-3 text-left font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((campaign) => (
                <tr key={campaign.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">{campaign.name}</td>
                  <td className="px-4 py-3 capitalize">{campaign.type}</td>
                  <td className="px-4 py-3">
                    <CampaignStatusBadge status={campaign.status} />
                  </td>
                  <td className="px-4 py-3">{campaign.recipientCount}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(campaign.createdAt).toLocaleDateString('es-AR')}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/campanas/${campaign.id}`}
                      className="text-blue-600 hover:underline"
                    >
                      Ver
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
