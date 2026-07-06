export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { getSearchAnalytics } from '@/lib/analytics/search'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

// ─── Date filter ──────────────────────────────────────────────────────────────

type DaysPreset = '7' | '30' | '90'

function DateFilter({ current }: { current: DaysPreset }) {
  const options: { label: string; value: DaysPreset }[] = [
    { label: 'Últimos 7 días', value: '7' },
    { label: 'Últimos 30 días', value: '30' },
    { label: 'Últimos 90 días', value: '90' },
  ]
  return (
    <div className="flex gap-2 flex-wrap">
      {options.map((opt) => (
        <Link
          key={opt.value}
          href={`/admin/analytics/busquedas?days=${opt.value}`}
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

// ─── Search type badge ────────────────────────────────────────────────────────

function SearchTypeBadge({ type }: { type?: string }) {
  const styles: Record<string, string> = {
    semantic: 'bg-purple-100 text-purple-800',
    text: 'bg-blue-100 text-blue-700',
    hybrid: 'bg-indigo-100 text-indigo-700',
  }
  const labels: Record<string, string> = {
    semantic: 'Semántica',
    text: 'Texto',
    hybrid: 'Híbrida',
  }
  const t = type ?? 'text'
  return (
    <Badge className={`text-xs ${styles[t] ?? 'bg-gray-100 text-gray-600'}`}>
      {labels[t] ?? t}
    </Badge>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

interface PageProps {
  searchParams: Promise<{ days?: string }>
}

export default async function BusquedasPage({ searchParams }: PageProps) {
  const params = await searchParams
  const preset = (['7', '30', '90'].includes(params.days ?? '') ? params.days : '30') as DaysPreset
  const days = Number(preset)

  const analytics = await getSearchAnalytics(days)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Búsquedas</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Análisis de búsquedas realizadas en el catálogo.
          </p>
        </div>
        <DateFilter current={preset} />
      </div>

      {/* No-results summary card */}
      {analytics.noResultCount > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-amber-800">Oportunidad de catálogo</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-amber-700 text-sm">
              <span className="font-bold text-lg">{analytics.noResultCount}</span>{' '}
              {analytics.noResultCount === 1
                ? 'búsqueda sin resultados — posible producto a agregar al catálogo.'
                : 'búsquedas sin resultados — posibles productos a agregar al catálogo.'}
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top search queries */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Búsquedas más frecuentes</CardTitle>
            <CardDescription>
              Términos más buscados en los últimos {days} días, con tipo de búsqueda.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {analytics.topQueries.length === 0 ? (
              <p className="p-6 text-sm text-muted-foreground">
                No hay búsquedas registradas en este período.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Consulta</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Veces</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analytics.topQueries.map((row, idx) => (
                    <TableRow key={`${row.query}-${idx}`}>
                      <TableCell className="text-muted-foreground font-mono text-xs w-8">
                        {idx + 1}
                      </TableCell>
                      <TableCell className="font-medium max-w-[200px] truncate">
                        {row.query}
                      </TableCell>
                      <TableCell>
                        <SearchTypeBadge type={row.type} />
                      </TableCell>
                      <TableCell className="text-right font-mono">{row.count}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* No-results queries */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Búsquedas sin resultados</CardTitle>
            <CardDescription>
              Términos que no encontraron ningún producto — gaps en el catálogo.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {analytics.noResultQueries.length === 0 ? (
              <p className="p-6 text-sm text-muted-foreground">
                No hay búsquedas sin resultados. ¡Excelente cobertura de catálogo!
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Consulta sin resultados</TableHead>
                    <TableHead className="text-right">Veces</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analytics.noResultQueries.map((row, idx) => (
                    <TableRow key={`${row.query}-${idx}`}>
                      <TableCell className="text-muted-foreground font-mono text-xs w-8">
                        {idx + 1}
                      </TableCell>
                      <TableCell className="font-medium max-w-[240px] truncate text-red-700">
                        {row.query}
                      </TableCell>
                      <TableCell className="text-right font-mono text-red-600">
                        {row.count}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
