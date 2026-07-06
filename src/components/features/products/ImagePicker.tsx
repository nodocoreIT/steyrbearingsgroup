'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'

interface ImagePickerProps {
  defaultImages?: string[]
}

export function ImagePicker({ defaultImages = [] }: ImagePickerProps) {
  const [images, setImages] = useState<string[]>(defaultImages)
  const [uploading, setUploading] = useState(false)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleFiles(files: FileList) {
    setUploading(true)
    const uploaded: string[] = []

    for (const file of Array.from(files)) {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/products/images', { method: 'POST', body: fd })
      const data = await res.json()
      if (data.url) uploaded.push(data.url)
    }

    setImages((prev) => [...prev, ...uploaded])
    setUploading(false)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files)
    }
  }

  function handleRemove(index: number) {
    setImages((prev) => prev.filter((_, i) => i !== index))
  }

  // Drag-to-reorder handlers
  function onDragStart(index: number) {
    setDragIndex(index)
  }

  function onDragEnter(index: number) {
    setDragOverIndex(index)
  }

  function onDragEnd() {
    if (dragIndex !== null && dragOverIndex !== null && dragIndex !== dragOverIndex) {
      setImages((prev) => {
        const next = [...prev]
        const [moved] = next.splice(dragIndex, 1)
        next.splice(dragOverIndex, 0, moved)
        return next
      })
    }
    setDragIndex(null)
    setDragOverIndex(null)
  }

  return (
    <div className="space-y-3">
      {/* Hidden input for form submission */}
      <input type="hidden" name="images" value={images.join('\n')} />

      {/* Thumbnails */}
      {images.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {images.map((url, i) => (
            <div
              key={url}
              draggable
              onDragStart={() => onDragStart(i)}
              onDragEnter={() => onDragEnter(i)}
              onDragEnd={onDragEnd}
              onDragOver={(e) => e.preventDefault()}
              className={[
                'relative group cursor-grab active:cursor-grabbing rounded-lg overflow-hidden border-2 transition-all',
                i === 0 ? 'border-primary' : 'border-transparent hover:border-muted-foreground/30',
                dragOverIndex === i && dragIndex !== i ? 'scale-105 border-primary/50' : '',
                dragIndex === i ? 'opacity-50' : '',
              ].join(' ')}
            >
              <div className="w-24 h-24 relative bg-muted">
                <Image
                  src={url}
                  alt={`Imagen ${i + 1}`}
                  fill
                  className="object-contain p-1"
                  sizes="96px"
                />
              </div>
              {/* Cover badge */}
              {i === 0 && (
                <span className="absolute bottom-0 left-0 right-0 text-center text-[10px] bg-primary text-primary-foreground py-0.5">
                  Portada
                </span>
              )}
              {/* Remove button */}
              <button
                type="button"
                onClick={() => handleRemove(i)}
                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-input rounded-lg p-6 text-center text-sm text-muted-foreground hover:border-primary/50 hover:bg-muted/30 transition-colors cursor-pointer"
      >
        {uploading ? (
          <span>Subiendo…</span>
        ) : (
          <span>
            Arrastrá imágenes acá o{' '}
            <span className="text-primary underline">hacé click para seleccionar</span>
          </span>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        La primera imagen es la portada. Arrastrá los thumbnails para reordenar.
      </p>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => e.target.files && handleFiles(e.target.files)}
      />
    </div>
  )
}
