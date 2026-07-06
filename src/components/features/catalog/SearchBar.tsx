'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'

interface SearchBarProps {
  placeholder?: string
}

export function SearchBar({ placeholder = 'Buscar productos…' }: SearchBarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [value, setValue] = useState(searchParams.get('q') ?? '')
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    clearTimeout(timer.current)

    const delay = value.length === 0 ? 0 : value.length >= 3 ? 500 : 2000

    timer.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString())
      if (value.trim()) {
        params.set('q', value.trim())
      } else {
        params.delete('q')
      }
      params.delete('page')
      router.push(`${pathname}?${params.toString()}`)
    }, delay)

    return () => clearTimeout(timer.current)
  }, [value])

  return (
    <div className="relative flex-1 max-w-xl">
      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="pl-8"
      />
    </div>
  )
}
