export const dynamic = 'force-dynamic'

import { getAllAlerts } from '@/lib/alerts/no-purchase'
import { acknowledgeAlertAction, resolveAlertAction } from '@/lib/alerts/actions'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: 'bg-red-100 text-red-800',
    acknowledged: 'bg-yellow-100 text-yellow-800',
    resolved: 'bg-green-100 text-green-800',
  }
  const labels: Record<string, string> = {
    pending: 'Pendiente',
    acknowledged: 'Visto',
    resolved: 'Resuelto',
  }
  return (
    <Badge className={`text-xs ${styles[status] ?? 'bg-gray-100 text-gray-800'}`}>
      {labels[status] ?? status}
    </Badge>
  )
}

export default async function NoPurchaseAlertsPage() {
  const alerts = await getAllAlerts()
  const pending = alerts.filter((a) => a.status === 'pending')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Alertas de sin compras</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Clientes que no han realizado una compra dentro del umbral configurado.
        </p>
      </div>

      {/* Summary card */}
      <Card className="border-red-200 bg-red-50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-red-800">Total en riesgo</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-red-700">{pending.length}</p>
          <p className="text-sm text-red-600">clientes con alertas de sin compras pendientes</p>
        </CardContent>
      </Card>

      {/* Alerts table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Alertas</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {alerts.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              Sin alertas. Los clientes están comprando dentro del umbral configurado.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="px-4 py-3">Cliente</th>
                    <th className="px-4 py-3">Última compra</th>
                    <th className="px-4 py-3 text-right">Días desde</th>
                    <th className="px-4 py-3 text-right">Umbral</th>
                    <th className="px-4 py-3">Estado</th>
                    <th className="px-4 py-3">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {alerts.map((alert) => (
                    <tr key={alert.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium">
                        {alert.clientName ?? alert.clientId.slice(0, 8)}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {alert.lastPurchaseAt
                          ? new Date(alert.lastPurchaseAt).toLocaleDateString('es-AR')
                          : 'Nunca'}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-medium">
                        {alert.daysSincePurchase}d
                      </td>
                      <td className="px-4 py-3 text-right text-muted-foreground font-mono">
                        {alert.thresholdDays}d
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={alert.status} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          {alert.status === 'pending' && (
                            <form action={acknowledgeAlertAction}>
                              <input type="hidden" name="alertId" value={alert.id} />
                              <Button type="submit" size="sm" variant="outline">
                                Marcar como visto
                              </Button>
                            </form>
                          )}
                          {alert.status !== 'resolved' && (
                            <form action={resolveAlertAction}>
                              <input type="hidden" name="alertId" value={alert.id} />
                              <Button type="submit" size="sm" variant="outline">
                                Resolver
                              </Button>
                            </form>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
