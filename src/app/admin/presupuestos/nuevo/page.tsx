'use client'

import { useState, useTransition } from 'react'
import { createQuote, addQuoteItem, updateQuoteItem, removeQuoteItem, updateQuoteNotes, submitQuoteForApproval } from '@/lib/quotes/actions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useRouter } from 'next/navigation'

interface ClientOption {
  id: string
  name: string
  score: number | null
  bcraRiskLevel: string | null
}

interface ProductOption {
  id: string
  name: string
  sku: string
}

interface QuoteLineItem {
  id: string
  productId: string
  productName: string
  productSku: string
  quantity: number
  unitPrice: number
  marginPercent: number
  subtotal: number
}

// NOTE: In real usage this page receives server-side prefetched data via searchParams or
// parent layout props. For the client component pattern, data is fetched on mount via API
// or passed as props from a server wrapper. This implementation uses inline state for demo.
// Slice 5 will wire the full data flow.

export default function NuevoPresupuestoPage() {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [isPending, startTransition] = useTransition()

  // Step 1: client selection
  const [clientSearch, setClientSearch] = useState('')
  const [selectedClient, setSelectedClient] = useState<ClientOption | null>(null)
  const [quoteId, setQuoteId] = useState<string | null>(null)

  // Step 2: products
  const [productSearch, setProductSearch] = useState('')
  const [lineItems, setLineItems] = useState<QuoteLineItem[]>([])

  // Step 3: notes
  const [notes, setNotes] = useState('')

  // AI cross-sell suggestions
  const [suggestions, setSuggestions] = useState<
    Array<{ id: string; name: string; sku: string; reason: string }>
  >([])
  const [suggestionsLoading, setSuggestionsLoading] = useState(false)

  const total = lineItems.reduce((sum, item) => sum + item.subtotal, 0)

  async function handleLoadSuggestions() {
    if (!quoteId) return
    setSuggestionsLoading(true)
    setSuggestions([])
    try {
      const res = await fetch('/api/ai/cross-sell', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quoteId }),
      })
      if (res.ok) {
        const data = await res.json()
        setSuggestions(data.suggestions ?? [])
      }
    } finally {
      setSuggestionsLoading(false)
    }
  }

  function getBcraColor(level: string | null): string {
    if (!level) return 'bg-gray-100 text-gray-700'
    const colors: Record<string, string> = {
      normal: 'bg-green-100 text-green-700',
      con_seguimiento: 'bg-yellow-100 text-yellow-700',
      riesgo: 'bg-orange-100 text-orange-700',
      irrecuperable: 'bg-red-100 text-red-700',
    }
    return colors[level] ?? 'bg-gray-100 text-gray-700'
  }

  async function handleSelectClient(client: ClientOption) {
    setSelectedClient(client)
    startTransition(async () => {
      const result = await createQuote(client.id)
      if (result.success) {
        setQuoteId(result.data.id)
        setStep(2)
      } else {
        alert(result.error)
      }
    })
  }

  async function handleAddProduct(product: ProductOption) {
    if (!quoteId) return
    startTransition(async () => {
      const result = await addQuoteItem(quoteId, product.id, 1)
      if (result.success) {
        // Optimistically add line item — real data will come from server on revalidate
        setLineItems((prev) => [
          ...prev,
          {
            id: result.data.id,
            productId: product.id,
            productName: product.name,
            productSku: product.sku,
            quantity: 1,
            unitPrice: 0,
            marginPercent: 0,
            subtotal: 0,
          },
        ])
      } else {
        alert(result.error)
      }
    })
  }

  async function handleUpdateItem(
    itemId: string,
    field: 'quantity' | 'unitPrice' | 'marginPercent',
    value: number
  ) {
    const item = lineItems.find((i) => i.id === itemId)
    if (!item) return

    const updated = { ...item, [field]: value }
    updated.subtotal = updated.unitPrice * updated.quantity

    setLineItems((prev) => prev.map((i) => (i.id === itemId ? updated : i)))

    startTransition(async () => {
      await updateQuoteItem(itemId, { [field]: value })
    })
  }

  async function handleRemoveItem(itemId: string) {
    setLineItems((prev) => prev.filter((i) => i.id !== itemId))
    startTransition(async () => {
      await removeQuoteItem(itemId)
    })
  }

  async function handleSubmit() {
    if (!quoteId) return
    startTransition(async () => {
      if (notes) await updateQuoteNotes(quoteId, notes)
      const result = await submitQuoteForApproval(quoteId)
      if (result.success) {
        router.push(`/admin/presupuestos/${quoteId}`)
      } else {
        alert(result.error)
      }
    })
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold">Nuevo Presupuesto</h1>
        {/* Step indicator — horizontal on desktop, vertical on mobile */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mt-2 text-sm">
          {(['Seleccionar cliente', 'Agregar productos', 'Notas y envío'] as const).map((label, idx) => {
            const stepNum = idx + 1
            const isActive = step === stepNum
            const isDone = step > stepNum
            return (
              <div key={stepNum} className="flex items-center gap-1.5">
                <span
                  className={[
                    'flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold shrink-0',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : isDone
                        ? 'bg-green-100 text-green-700'
                        : 'bg-muted text-muted-foreground',
                  ].join(' ')}
                >
                  {isDone ? '✓' : stepNum}
                </span>
                <span
                  className={isActive ? 'font-medium' : 'text-muted-foreground'}
                >
                  {label}
                </span>
                {idx < 2 && (
                  <span className="hidden sm:inline text-muted-foreground">→</span>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Step 1: Client selection */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Seleccionar Cliente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="clientSearch">Buscar cliente</Label>
              <Input
                id="clientSearch"
                value={clientSearch}
                onChange={(e) => setClientSearch(e.target.value)}
                placeholder="Razón social o CUIT..."
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Escribí para buscar clientes. Los resultados se traen del servidor.
              {/* In production: fetch /api/clients?q=clientSearch and display results */}
            </p>
            {/* Demo: manual client ID entry for now */}
            <div className="border rounded-md p-4 space-y-3">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                Development shortcut — enter client ID directly
              </p>
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  const fd = new FormData(e.currentTarget)
                  const id = fd.get('clientId') as string
                  if (id) {
                    handleSelectClient({ id, name: 'Cliente ' + id.slice(0, 8), score: null, bcraRiskLevel: null })
                  }
                }}
                className="flex gap-2"
              >
                <Input name="clientId" placeholder="UUID del cliente" className="font-mono text-xs" />
                <Button type="submit" disabled={isPending}>
                  Seleccionar
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Products */}
      {step === 2 && selectedClient && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Client:{' '}
                <span className="font-normal">{selectedClient.name}</span>
                {selectedClient.score !== null && (
                  <span className="ml-2 text-yellow-400">
                    {'★'.repeat(Math.round(selectedClient.score))}
                    {'☆'.repeat(5 - Math.round(selectedClient.score))}
                  </span>
                )}
                {selectedClient.bcraRiskLevel && (
                  <Badge className={`ml-2 text-xs ${getBcraColor(selectedClient.bcraRiskLevel)}`}>
                    BCRA: {selectedClient.bcraRiskLevel}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Agregar Productos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="productSearch">Buscar producto</Label>
                <Input
                  id="productSearch"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Nombre del producto o SKU..."
                />
              </div>
              {/* Demo shortcut */}
              <div className="border rounded-md p-4 space-y-3">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                  Development shortcut — add product by ID
                </p>
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    const fd = new FormData(e.currentTarget)
                    const id = fd.get('productId') as string
                    const name = fd.get('productName') as string
                    const sku = fd.get('productSku') as string
                    if (id) handleAddProduct({ id, name: name || 'Producto', sku: sku || id.slice(0, 8) })
                  }}
                  className="flex gap-2 flex-wrap"
                >
                  <Input name="productId" placeholder="UUID del producto" className="font-mono text-xs flex-1" />
                  <Input name="productName" placeholder="nombre" className="flex-1" />
                  <Input name="productSku" placeholder="SKU" className="flex-1 max-w-[120px]" />
                  <Button type="submit" disabled={isPending}>Agregar</Button>
                </form>
              </div>
            </CardContent>
          </Card>

          {/* Quote table */}
          {lineItems.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Líneas del Presupuesto</CardTitle>
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full min-w-[600px] text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="px-4 py-3">Producto</th>
                      <th className="px-4 py-3 w-24">Cant.</th>
                      <th className="px-4 py-3 w-32">Precio unit.</th>
                      <th className="px-4 py-3 w-24">Margen %</th>
                      <th className="px-4 py-3 w-32 text-right">Subtotal</th>
                      <th className="px-4 py-3 w-16" />
                    </tr>
                  </thead>
                  <tbody>
                    {lineItems.map((item) => (
                      <tr key={item.id} className="border-b last:border-0">
                        <td className="px-4 py-3">
                          <div className="font-medium">{item.productName}</div>
                          <div className="text-xs text-muted-foreground font-mono">{item.productSku}</div>
                        </td>
                        <td className="px-4 py-3">
                          <Input
                            type="number"
                            min={1}
                            value={item.quantity}
                            onChange={(e) => handleUpdateItem(item.id, 'quantity', Number(e.target.value))}
                            className="w-20"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <Input
                            type="number"
                            min={0}
                            step={0.01}
                            value={item.unitPrice}
                            onChange={(e) => handleUpdateItem(item.id, 'unitPrice', Number(e.target.value))}
                            className="w-28"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <Input
                            type="number"
                            min={0}
                            step={0.1}
                            value={item.marginPercent}
                            onChange={(e) => handleUpdateItem(item.id, 'marginPercent', Number(e.target.value))}
                            className="w-20"
                          />
                        </td>
                        <td className="px-4 py-3 text-right font-mono">
                          ${item.subtotal.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRemoveItem(item.id)}
                            disabled={isPending}
                          >
                            ✕
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={4} className="px-4 py-3 text-right font-semibold">
                        Total
                      </td>
                      <td className="px-4 py-3 text-right font-bold font-mono">
                        ${total.toFixed(2)}
                      </td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </CardContent>
            </Card>
          )}

          {/* AI Suggestions */}
          {quoteId && lineItems.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Sugerencias IA</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLoadSuggestions}
                    disabled={suggestionsLoading}
                  >
                    {suggestionsLoading ? 'Cargando...' : 'Ver sugerencias'}
                  </Button>
                </div>
              </CardHeader>
              {suggestions.length > 0 && (
                <CardContent className="space-y-3">
                  {suggestions.map((s) => (
                    <div
                      key={s.id}
                      className="flex items-start justify-between gap-4 p-3 rounded-md border bg-muted/30"
                    >
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium">{s.name}</p>
                        <p className="text-xs text-muted-foreground font-mono">{s.sku}</p>
                        <p className="text-xs text-muted-foreground italic">{s.reason}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAddProduct({ id: s.id, name: s.name, sku: s.sku })}
                        disabled={isPending}
                      >
                        Agregar
                      </Button>
                    </div>
                  ))}
                </CardContent>
              )}
              {!suggestionsLoading && suggestions.length === 0 && (
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    Hacé clic en "Ver sugerencias" para obtener recomendaciones de venta cruzada con IA.
                  </p>
                </CardContent>
              )}
            </Card>
          )}

          <div className="flex justify-end">
            <Button onClick={() => setStep(3)} disabled={lineItems.length === 0 || isPending}>
              Continuar a Notas →
            </Button>
          </div>
        </>
      )}

      {/* Step 3: Notes */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Notas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <textarea
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[120px]"
              placeholder="Agregá notas para este presupuesto (opcional)..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
            <div className="flex items-center justify-between">
              <Button variant="outline" onClick={() => setStep(2)}>
                ← Volver a Productos
              </Button>
              <Button onClick={handleSubmit} disabled={isPending}>
                {isPending ? 'Enviando...' : 'Enviar a aprobación'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
