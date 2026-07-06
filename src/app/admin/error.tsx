'use client'

import { useEffect } from 'react'
import Link from 'next/link'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function AdminError({ error, reset }: ErrorProps) {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.error('[AdminError]', error)
    }
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center px-4">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Algo salió mal</h2>
        <p className="text-muted-foreground text-sm max-w-md">
          Ocurrió un error inesperado. Por favor intentá de nuevo o volvé al inicio.
        </p>
        {process.env.NODE_ENV === 'development' && (
          <p className="text-xs text-red-500 font-mono mt-2">{error.message}</p>
        )}
      </div>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Intentar de nuevo
        </button>
        <Link
          href="/admin/dashboard"
          className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  )
}
