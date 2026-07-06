'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'

interface Props {
  clientId: string
}

export function ConsultationSummary({ clientId }: Props) {
  const [summary, setSummary] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSummarize() {
    startTransition(async () => {
      try {
        const res = await fetch('/api/ai/summarize-consultations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ clientId }),
        })
        if (res.ok) {
          const data = await res.json()
          setSummary(data.summary ?? 'No se pudo generar el resumen.')
        } else {
          setSummary('Error al generar el resumen.')
        }
      } catch {
        setSummary('Error de red al generar el resumen.')
      }
    })
  }

  return (
    <div className="space-y-3">
      <Button
        variant="outline"
        size="sm"
        onClick={handleSummarize}
        disabled={isPending}
      >
        {isPending ? 'Resumiendo...' : 'Resumir con IA'}
      </Button>

      {summary && (
        <div className="p-4 rounded-lg border-l-4 border-blue-400 bg-blue-50">
          <p className="text-sm font-medium text-blue-800 mb-1">Resumen IA</p>
          <p className="text-sm text-blue-700">{summary}</p>
        </div>
      )}
    </div>
  )
}
