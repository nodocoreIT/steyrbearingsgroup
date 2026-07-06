export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { getDemandForecast } from '@/lib/ai/demand-forecast'
import {
  getSalesSummary,
  getSalespersonPerformance,
  getTopProducts,
  getClientPortfolioHealth,
  getMonthlyRevenueTrend,
} from '@/lib/analytics/dashboard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

// ─── Formatting helpers ───────────────────────────────────────────────────────

function formatARS(value: number): string {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(value)
}

function formatPct(value: number | null): string {
  if (value === null) return '—'
  return `${(value * 100).toFixed(1)}%`
}

// ─── Date range helper ────────────────────────────────────────────────────────

type DatePreset = '30d' | '90d' | '365d' | 'all'

function getDateRange(preset: DatePreset): { from?: Date; to?: Date } {
  if (preset === 'all') return {}
  const days = preset === '30d' ? 30 : preset === '90d' ? 90 : 365
  const from = new Date()
  from.setDate(from.getDate() - days)
  return { from }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SummaryCard({
  label,
  value,
  sub,
}: {
  label: string
  value: string
  sub?: string
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription className="text-xs">{label}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </CardContent>
    </Card>
  )
}

function DateRangeFilter({ current }: { current: DatePreset }) {
  const options: { label: string; value: DatePreset }[] = [
    { label: 'Últimos 30 días', value: '30d' },
    { label: 'Últimos 90 días', value: '90d' },
    { label: 'Último año', value: '365d' },
    { label: 'Todo el tiempo', value: 'all' },
  ]
  return (
    <div className="flex gap-2 flex-wrap">
      {options.map((opt) => (
        <Link
          key={opt.value}
          href={`/admin/analytics?range=${opt.value}`}
          className={`text-sm px-3 py-1.5 rounded-md border transition-colors ${
            current === opt.value
              ? 'bg-foreground text-background border-foreground'
              : 'hover:bg-muted border-border'
          }`}
        >
          {opt.label}
        </Link>
      ))}
    </div>
  )
}

function TrendArrow({ trend }: { trend: 'up' | 'down' | 'stable' }) {
  if (trend === 'up') return <span className="text-green-600 text-lg">↑</span>
  if (trend === 'down') return <span className="text-red-500 text-lg">↓</span>
  return <span className="text-gray-500 text-lg">→</span>
}

function TrendBadge({ trend }: { trend: 'up' | 'down' | 'stable' }) {
  const classes = {
    up: 'bg-green-100 text-green-800',
    down: 'bg-red-100 text-red-800',
    stable: 'bg-gray-100 text-gray-800',
  }
  const labels = { up: 'Creciendo', down: 'Bajando', stable: 'Estable' }
  return (
    <Badge className={`text-xs ${classes[trend]}`}>
      {labels[trend]}
    </Badge>
  )
}

function ScoreBar({
  distribution,
  total,
}: {
  distribution: Record<string, number>
  total: number
}) {
  const bands = [
    { key: '0-1', label: '0–1★', color: 'bg-red-400' },
    { key: '1-2', label: '1–2★', color: 'bg-orange-400' },
    { key: '2-3', label: '2–3★', color: 'bg-yellow-400' },
    { key: '3-4', label: '3–4★', color: 'bg-blue-400' },
    { key: '4-5', label: '4–5★', color: 'bg-green-500' },
  ]
  return (
    <div className="space-y-1.5">
      {bands.map(({ key, label, color }) => {
        const n = distribution[key] ?? 0
        const pct = total > 0 ? (n / total) * 100 : 0
        return (
          <div key={key} className="flex items-center gap-2 text-xs">
            <span className="w-12 text-muted-foreground">{label}</span>
            <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
              <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
            </div>
            <span className="w-6 text-right font-mono">{n}</span>
          </div>
        )
      })}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

interface PageProps {
  searchParams: Promise<{ range?: string }>
}

export default async function AnalyticsPage({ searchParams }: PageProps) {
  const params = await searchParams
  const preset = (['30d', '90d', '365d', 'all'].includes(params.range ?? '')
    ? params.range
    : '30d') as DatePreset

  const dateRange = getDateRange(preset)

  const [summary, salespersons, topProducts, portfolioHealth, revenueTrend, forecast] =
    await Promise.all([
      getSalesSummary(dateRange),
      getSalespersonPerformance(),
      getTopProducts(10),
      getClientPortfolioHealth(),
      getMonthlyRevenueTrend(12),
      getDemandForecast(),
    ])

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Dashboard de inteligencia de negocio — facturación, performance de vendedores y salud de clientes.
          </p>
        </div>
        <DateRangeFilter current={preset} />
      </div>

      {/* ── Revenue summary cards ── */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard label="Facturación total" value={formatARS(summary.totalRevenue)} />
        <SummaryCard
          label="Presupuestos aceptados"
          value={String(summary.totalQuotes)}
          sub={`en el período seleccionado`}
        />
        <SummaryCard
          label="Valor promedio"
          value={formatARS(summary.avgQuoteValue)}
          sub="por presupuesto aceptado"
        />
        <SummaryCard
          label="Conversión"
          value={formatPct(summary.conversionRate)}
          sub="enviados → aceptados"
        />
      </section>

      {/* ── Monthly trend + Top products ── */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly revenue trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Facturación mensual</CardTitle>
            <CardDescription>Últimos 12 meses — presupuestos aceptados</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {revenueTrend.length === 0 ? (
              <p className="p-6 text-sm text-muted-foreground">No hay datos suficientes aún.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mes</TableHead>
                    <TableHead className="text-right">Facturación</TableHead>
                    <TableHead className="text-right">Presupuestos</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {revenueTrend.map((row) => (
                    <TableRow key={row.month}>
                      <TableCell className="font-mono text-xs">{row.month}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatARS(row.revenue)}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {row.quoteCount}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Top products */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Productos más cotizados</CardTitle>
            <CardDescription>Por frecuencia de aparición en presupuestos</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {topProducts.length === 0 ? (
              <p className="p-6 text-sm text-muted-foreground">Sin datos de productos aún.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead className="text-right"># Presup.</TableHead>
                    <TableHead className="text-right">Unidades</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topProducts.map((p) => (
                    <TableRow key={p.productId}>
                      <TableCell className="font-medium max-w-[180px] truncate">
                        {p.name}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {p.sku}
                      </TableCell>
                      <TableCell className="text-right">{p.quoteCount}</TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {p.totalQuantity}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </section>

      {/* ── Client portfolio health ── */}
      <section>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Salud del portfolio de clientes</CardTitle>
            <CardDescription>
              Actividad en últimos 90 días · Alertas pendientes · Distribución de puntaje
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Total clientes</p>
                <p className="text-2xl font-bold">{portfolioHealth.totalClients}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Activos (90d)</p>
                <p className="text-2xl font-bold text-green-700">{portfolioHealth.activeClients}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">En riesgo</p>
                <p className="text-2xl font-bold text-red-600">{portfolioHealth.atRiskClients}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Puntaje promedio</p>
                <p className="text-2xl font-bold">
                  {portfolioHealth.avgScore.toFixed(1)}
                  <span className="text-sm text-muted-foreground font-normal"> / 5</span>
                </p>
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">
                Distribución de puntajes
              </p>
              <ScoreBar
                distribution={portfolioHealth.scoreDistribution}
                total={portfolioHealth.totalClients}
              />
            </div>
          </CardContent>
        </Card>
      </section>

      {/* ── Salesperson performance table ── */}
      <section>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Performance de vendedores</CardTitle>
              <CardDescription>Todos los vendedores — ordenados por facturación</CardDescription>
            </div>
            <Link
              href="/admin/analytics/vendedores"
              className="text-xs text-muted-foreground hover:text-foreground underline"
            >
              Ver detalle →
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {salespersons.length === 0 ? (
              <p className="p-6 text-sm text-muted-foreground">No hay vendedores registrados.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vendedor</TableHead>
                    <TableHead className="text-right">Creados</TableHead>
                    <TableHead className="text-right">Aceptados</TableHead>
                    <TableHead className="text-right">Facturación</TableHead>
                    <TableHead className="text-right">Conversión</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {salespersons.map((sp) => (
                    <TableRow key={sp.salespersonId} className="hover:bg-muted/30">
                      <TableCell className="font-medium">{sp.name}</TableCell>
                      <TableCell className="text-right">{sp.quotesCreated}</TableCell>
                      <TableCell className="text-right">{sp.quotesAccepted}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatARS(sp.totalRevenue)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge
                          className={
                            sp.conversionRate === null
                              ? 'bg-gray-100 text-gray-600'
                              : sp.conversionRate >= 0.5
                              ? 'bg-green-100 text-green-800'
                              : sp.conversionRate >= 0.25
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }
                        >
                          {formatPct(sp.conversionRate)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </section>

      {/* ── Demand forecast (existing) ── */}
      <section>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Pronóstico de demanda</CardTitle>
                <CardDescription>
                  Basado en los últimos 24 meses de presupuestos aceptados por categoría.
                </CardDescription>
              </div>
              <form
                action={async () => {
                  'use server'
                  const { revalidatePath } = await import('next/cache')
                  revalidatePath('/admin/analytics')
                }}
              >
                <button
                  type="submit"
                  className="text-sm text-muted-foreground hover:text-foreground underline"
                >
                  Actualizar pronóstico
                </button>
              </form>
            </div>
          </CardHeader>
          <CardContent>
            {forecast.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No hay suficientes datos para generar un pronóstico. Se necesitan al menos
                algunos pedidos aceptados en el sistema.
              </p>
            ) : (
              <div className="space-y-3">
                {forecast.map((item, idx) => (
                  <div
                    key={`${item.category}-${idx}`}
                    className="flex items-start gap-4 p-4 rounded-lg border bg-card"
                  >
                    <div className="flex items-center gap-2 w-8">
                      <TrendArrow trend={item.trend} />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{item.category}</span>
                        <TrendBadge trend={item.trend} />
                      </div>
                      <p className="text-xs text-muted-foreground italic">{item.reasoning}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-muted-foreground">Confianza</span>
                      <p className="text-sm font-semibold">
                        {Math.round(item.confidence * 100)}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
