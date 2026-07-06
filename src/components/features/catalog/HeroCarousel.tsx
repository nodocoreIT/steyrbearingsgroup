'use client'

import Image from 'next/image'
import { useState, useEffect, useCallback } from 'react'

const slides = [
  { src: '/slides/1.png', alt: 'Slide 1' },
  { src: '/slides/2.png', alt: 'Slide 2' },
]

export function HeroCarousel() {
  const [current, setCurrent] = useState(0)

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % slides.length)
  }, [])

useEffect(() => {
    const timer = setInterval(next, 5000)
    return () => clearInterval(timer)
  }, [next])

  return (
    <div className="relative w-full overflow-hidden rounded-2xl bg-muted">
      {/* Spacer invisible: mantiene la altura del contenedor según la imagen activa */}
      <Image
        src={slides[current].src}
        alt=""
        width={1600}
        height={600}
        sizes="100vw"
        className="w-full h-auto opacity-0 pointer-events-none select-none"
        aria-hidden
        priority
      />

      {slides.map((slide, i) => (
        <div
          key={slide.src}
          className="absolute inset-0 transition-opacity duration-700"
          style={{ opacity: i === current ? 1 : 0 }}
        >
          <Image
            src={slide.src}
            alt={slide.alt}
            fill
            sizes="100vw"
            className="object-contain"
            priority={i === 0}
          />
        </div>
      ))}

      {/* Dots */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            aria-label={`Ir al slide ${i + 1}`}
            className="h-2 rounded-full transition-all duration-300 cursor-pointer"
            style={{
              width: i === current ? '24px' : '8px',
              backgroundColor: i === current ? 'white' : 'rgba(255,255,255,0.5)',
            }}
          />
        ))}
      </div>
    </div>
  )
}
