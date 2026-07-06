'use client'

import { useState } from 'react'
import { normalizeClientNames } from '@/lib/clients/actions'

export function NormalizeNamesButton() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [count, setCount] = useState(0)

  async function handleClick() {
    setStatus('loading')
    const result = await normalizeClientNames()
    if (result.success) {
      setCount(result.data.updated)
      setStatus('done')
      setTimeout(() => setStatus('idle'), 3000)
    } else {
      setStatus('error')
      setTimeout(() => setStatus('idle'), 3000)
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={status === 'loading'}
      className="inline-flex items-center px-3 py-2 text-xs text-muted-foreground border rounded-md hover:bg-muted/50 transition-colors disabled:opacity-50"
    >
      {status === 'loading' && 'Normalizando…'}
      {status === 'done' && `${count} actualizados`}
      {status === 'error' && 'Error'}
      {status === 'idle' && 'Normalizar nombres'}
    </button>
  )
}
