'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { addToInterestList } from '@/lib/interest-lists/actions'

interface AddToListButtonProps {
  productId: string
  isAuthenticated?: boolean
  /** Current pathname — used as returnUrl when unauthenticated */
  returnUrl?: string
}

export function AddToListButton({
  productId,
  isAuthenticated = false,
  returnUrl = '/catalogo',
}: AddToListButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [added, setAdded] = useState(false)

  async function handleClick() {
    if (!isAuthenticated) {
      router.push(`/login?returnUrl=${encodeURIComponent(returnUrl)}`)
      return
    }

    setLoading(true)
    try {
      const result = await addToInterestList(productId)
      if (result.success) {
        setAdded(true)
        toast.success('Agregado a tu lista', {
          description: 'Andá a Mi Lista para solicitar un presupuesto.',
          action: { label: 'Ver lista', onClick: () => router.push('/mi-lista') },
        })
      } else {
        if (result.code === 'UNAUTHENTICATED') {
          router.push(`/login?returnUrl=${encodeURIComponent(returnUrl)}`)
        } else {
          toast.error(result.error)
        }
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant={added ? 'secondary' : 'default'}
      size="sm"
      onClick={handleClick}
      disabled={loading}
    >
      {loading ? 'Agregando…' : added ? 'Agregado a la lista' : 'Agregar a mi lista'}
    </Button>
  )
}
