'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

interface SearchInputProps {
  param?: string
  defaultValue?: string
  placeholder?: string
  className?: string
}

export function SearchInput({
  param = 'search',
  defaultValue = '',
  placeholder = 'Buscar…',
  className = '',
}: SearchInputProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [value, setValue] = useState(defaultValue)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    clearTimeout(timer.current)

    // Empty → clear immediately
    // 3+ chars → 500ms debounce
    // 1-2 chars → 2000ms debounce
    const delay = value.length === 0 ? 0 : value.length >= 3 ? 500 : 2000

    timer.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) {
        params.set(param, value)
      } else {
        params.delete(param)
      }
      params.delete('page')
      router.push(`?${params.toString()}`)
    }, delay)

    return () => clearTimeout(timer.current)
  }, [value])

  return (
    <input
      type="search"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      placeholder={placeholder}
      className={[
        'h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm outline-none',
        'focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30',
        'placeholder:text-muted-foreground',
        className,
      ].join(' ')}
    />
  )
}
