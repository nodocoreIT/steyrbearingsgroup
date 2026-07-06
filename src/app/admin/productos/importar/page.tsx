'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { importProductsFromCSV } from './actions'

interface ParsedRow {
  name: string
  sku: string
  categorySlug: string
  description: string
  active: boolean
  error?: string
}

function parseCSV(text: string): ParsedRow[] {
  const lines = text.split('\n').filter((l) => l.trim())
  if (lines.length < 2) return []

  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase())
  const nameIdx = headers.indexOf('name')
  const skuIdx = headers.indexOf('sku')
  const categoryIdx = headers.indexOf('category_slug')
  const descIdx = headers.indexOf('description')
  const activeIdx = headers.indexOf('active')

  return lines.slice(1).map((line) => {
    const cols = line.split(',').map((c) => c.trim().replace(/^"|"$/g, ''))
    const name = nameIdx >= 0 ? cols[nameIdx] : ''
    const sku = skuIdx >= 0 ? cols[skuIdx] : ''

    const error = !name ? 'Falta nombre' : !sku ? 'Falta SKU' : undefined

    return {
      name,
      sku,
      categorySlug: categoryIdx >= 0 ? cols[categoryIdx] : '',
      description: descIdx >= 0 ? cols[descIdx] : '',
      active: activeIdx >= 0 ? cols[activeIdx] !== 'false' : true,
      error,
    }
  })
}

export default function ImportarPage() {
  const [rows, setRows] = useState<ParsedRow[]>([])
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<{ imported: number; errors: string[] } | null>(null)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const text = await file.text()
    setRows(parseCSV(text))
    setResult(null)
  }

  async function handleImport() {
    if (rows.length === 0) return
    setImporting(true)

    const fd = new FormData()
    const validRows = rows.filter((r) => !r.error)
    fd.append('rows', JSON.stringify(validRows))

    try {
      const res = await importProductsFromCSV(fd)
      setResult(res)
    } finally {
      setImporting(false)
    }
  }

  const validCount = rows.filter((r) => !r.error).length
  const errorCount = rows.filter((r) => r.error).length

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Importar Productos (CSV)</h1>
        <p className="text-sm text-muted-foreground">
          Columnas requeridas: <code className="font-mono text-xs">name, sku, category_slug, description, active</code>
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="csv">Archivo CSV</Label>
        <input
          id="csv"
          type="file"
          accept=".csv,text/csv"
          onChange={handleFileChange}
          className="block text-sm"
        />
      </div>

      {rows.length > 0 && (
        <div className="space-y-3">
          <div className="flex gap-2 items-center">
            <Badge variant="default">{validCount} válidos</Badge>
            {errorCount > 0 && <Badge variant="secondary">{errorCount} errores</Badge>}
          </div>

          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="px-3 py-2 text-left font-medium">Nombre</th>
                  <th className="px-3 py-2 text-left font-medium">SKU</th>
                  <th className="px-3 py-2 text-left font-medium">Categoría</th>
                  <th className="px-3 py-2 text-left font-medium">Activo</th>
                  <th className="px-3 py-2 text-left font-medium">Estado</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={i} className={row.error ? 'bg-destructive/5' : ''}>
                    <td className="px-3 py-2">{row.name || <span className="text-muted-foreground">—</span>}</td>
                    <td className="px-3 py-2 font-mono text-xs">{row.sku || <span className="text-muted-foreground">—</span>}</td>
                    <td className="px-3 py-2 text-xs">{row.categorySlug || '—'}</td>
                    <td className="px-3 py-2 text-xs">{row.active ? 'Sí' : 'No'}</td>
                    <td className="px-3 py-2">
                      {row.error ? (
                        <Badge variant="secondary" className="text-destructive">{row.error}</Badge>
                      ) : (
                        <Badge variant="default">OK</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Button onClick={handleImport} disabled={importing || validCount === 0}>
            {importing ? 'Importando…' : `Importar ${validCount} producto${validCount !== 1 ? 's' : ''}`}
          </Button>
        </div>
      )}

      {result && (
        <div className="rounded-lg border p-4 space-y-2">
          <p className="font-medium">{result.imported} producto{result.imported !== 1 ? 's' : ''} importado{result.imported !== 1 ? 's' : ''}</p>
          {result.errors.length > 0 && (
            <ul className="text-sm text-destructive space-y-1">
              {result.errors.map((e, i) => <li key={i}>{e}</li>)}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
