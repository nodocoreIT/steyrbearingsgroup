'use client'

import { useEffect } from 'react'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function GlobalError({ error, reset }: ErrorProps) {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.error('[GlobalError]', error)
    }
  }, [error])

  return (
    <html lang="es">
      <body>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            gap: '1.5rem',
            textAlign: 'center',
            padding: '1rem',
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>
            Error crítico
          </h2>
          <p style={{ color: '#666', maxWidth: '24rem' }}>
            La aplicación encontró un error crítico. Por favor recargá la página.
          </p>
          {process.env.NODE_ENV === 'development' && (
            <pre
              style={{
                fontSize: '0.75rem',
                color: '#dc2626',
                background: '#fee2e2',
                padding: '0.75rem',
                borderRadius: '0.375rem',
                maxWidth: '32rem',
                overflowX: 'auto',
              }}
            >
              {error.message}
            </pre>
          )}
          <button
            onClick={reset}
            style={{
              background: '#2563eb',
              color: '#fff',
              border: 'none',
              borderRadius: '0.375rem',
              padding: '0.5rem 1rem',
              fontSize: '0.875rem',
              cursor: 'pointer',
            }}
          >
            Recargar
          </button>
        </div>
      </body>
    </html>
  )
}
