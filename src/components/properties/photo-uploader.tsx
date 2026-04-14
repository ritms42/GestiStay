"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import Image from "next/image"
import { Upload, X, GripVertical, ImageIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface ExistingPhoto {
  id: string
  url: string
  position: number
  is_cover: boolean
}

interface PhotoUploaderProps {
  propertyId?: string
  existingPhotos?: ExistingPhoto[]
  onPhotosChange?: (
    photos: File[],
    existingPhotos: Array<{ id: string; url: string; position: number }>
  ) => void
}

interface PhotoItem {
  type: "existing" | "new"
  id: string
  url: string
  file?: File
  progress: number
}

const MAX_PHOTOS = 20
const MAX_WIDTH = 1200
const JPEG_QUALITY = 0.8
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"]

async function compressImage(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new window.Image()
    img.onload = () => {
      let { width, height } = img
      if (width > MAX_WIDTH) {
        height = Math.round((height * MAX_WIDTH) / width)
        width = MAX_WIDTH
      }

      const canvas = document.createElement("canvas")
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext("2d")
      if (!ctx) {
        resolve(file)
        return
      }
      ctx.drawImage(img, 0, 0, width, height)

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file)
            return
          }
          const compressed = new File(
            [blob],
            file.name.replace(/\.[^.]+$/, ".jpg"),
            { type: "image/jpeg" }
          )
          resolve(compressed)
        },
        "image/jpeg",
        JPEG_QUALITY
      )
    }
    img.onerror = () => reject(new Error("Impossible de charger l'image"))
    img.src = URL.createObjectURL(file)
  })
}

export function PhotoUploader({
  existingPhotos = [],
  onPhotosChange,
}: PhotoUploaderProps) {
  const [items, setItems] = useState<PhotoItem[]>(() =>
    existingPhotos
      .sort((a, b) => a.position - b.position)
      .map((p) => ({
        type: "existing" as const,
        id: p.id,
        url: p.url,
        progress: 100,
      }))
  )
  const [isDragOver, setIsDragOver] = useState(false)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const notifyChange = useCallback(
    (updatedItems: PhotoItem[]) => {
      if (!onPhotosChange) return
      const newFiles = updatedItems
        .filter((item) => item.type === "new" && item.file)
        .map((item) => item.file!)
      const existing = updatedItems
        .filter((item) => item.type === "existing")
        .map((item, idx) => ({
          id: item.id,
          url: item.url,
          position: idx,
        }))
      onPhotosChange(newFiles, existing)
    },
    [onPhotosChange]
  )

  useEffect(() => {
    notifyChange(items)
  }, [items, notifyChange])

  const processFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files).filter((f) =>
        ACCEPTED_TYPES.includes(f.type)
      )
      const slotsLeft = MAX_PHOTOS - items.length
      if (slotsLeft <= 0) return
      const toProcess = fileArray.slice(0, slotsLeft)

      const newItems: PhotoItem[] = toProcess.map((file) => ({
        type: "new" as const,
        id: `new-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        url: URL.createObjectURL(file),
        file,
        progress: 0,
      }))

      setItems((prev) => [...prev, ...newItems])

      for (const item of newItems) {
        try {
          setItems((prev) =>
            prev.map((p) => (p.id === item.id ? { ...p, progress: 30 } : p))
          )
          const compressed = await compressImage(item.file!)
          const compressedUrl = URL.createObjectURL(compressed)

          setItems((prev) =>
            prev.map((p) =>
              p.id === item.id
                ? { ...p, file: compressed, url: compressedUrl, progress: 100 }
                : p
            )
          )
        } catch {
          setItems((prev) => prev.filter((p) => p.id !== item.id))
        }
      }
    },
    [items.length]
  )

  // Drop zone handlers
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.currentTarget === e.target) {
      setIsDragOver(false)
    }
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragOver(false)
      if (e.dataTransfer.files?.length) {
        processFiles(e.dataTransfer.files)
      }
    },
    [processFiles]
  )

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files?.length) {
        processFiles(e.target.files)
        e.target.value = ""
      }
    },
    [processFiles]
  )

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((p) => p.id !== id))
  }, [])

  // Reorder drag handlers
  const handleItemDragStart = useCallback(
    (e: React.DragEvent, index: number) => {
      setDragIndex(index)
      e.dataTransfer.effectAllowed = "move"
      e.dataTransfer.setData("text/plain", String(index))
    },
    []
  )

  const handleItemDragOver = useCallback(
    (e: React.DragEvent, index: number) => {
      e.preventDefault()
      e.dataTransfer.dropEffect = "move"
      setDragOverIndex(index)
    },
    []
  )

  const handleItemDrop = useCallback(
    (e: React.DragEvent, targetIndex: number) => {
      e.preventDefault()
      e.stopPropagation()
      if (dragIndex === null || dragIndex === targetIndex) {
        setDragIndex(null)
        setDragOverIndex(null)
        return
      }
      setItems((prev) => {
        const updated = [...prev]
        const [moved] = updated.splice(dragIndex, 1)
        updated.splice(targetIndex, 0, moved)
        return updated
      })
      setDragIndex(null)
      setDragOverIndex(null)
    },
    [dragIndex]
  )

  const handleItemDragEnd = useCallback(() => {
    setDragIndex(null)
    setDragOverIndex(null)
  }, [])

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          "flex flex-col items-center justify-center gap-3 p-8 rounded-lg border-2 border-dashed cursor-pointer transition-colors",
          isDragOver
            ? "border-primary bg-primary/5 text-primary"
            : "border-muted-foreground/25 hover:border-primary/50 text-muted-foreground"
        )}
      >
        <Upload
          className={cn("h-10 w-10", isDragOver && "text-primary")}
        />
        <div className="text-center">
          <p className="font-medium">
            {isDragOver
              ? "Relâchez pour ajouter les photos"
              : "Glissez-déposez vos photos ici"}
          </p>
          <p className="text-sm mt-1">
            ou cliquez pour parcourir vos fichiers
          </p>
        </div>
        <p className="text-xs">
          JPEG, PNG, WebP — max {MAX_PHOTOS} photos — {items.length}/
          {MAX_PHOTOS}
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_TYPES.join(",")}
          multiple
          className="hidden"
          onChange={handleFileInput}
        />
      </div>

      {/* Photo grid */}
      {items.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {items.map((item, index) => (
            <div
              key={item.id}
              draggable
              onDragStart={(e) => handleItemDragStart(e, index)}
              onDragOver={(e) => handleItemDragOver(e, index)}
              onDrop={(e) => handleItemDrop(e, index)}
              onDragEnd={handleItemDragEnd}
              className={cn(
                "group relative aspect-[4/3] rounded-lg overflow-hidden border bg-muted transition-all",
                dragIndex === index && "opacity-50 scale-95",
                dragOverIndex === index &&
                  dragIndex !== index &&
                  "ring-2 ring-primary ring-offset-2"
              )}
            >
              {item.progress < 100 ? (
                <div className="flex flex-col items-center justify-center h-full gap-2">
                  <ImageIcon className="h-8 w-8 text-muted-foreground animate-pulse" />
                  <div className="w-3/4 h-1.5 bg-muted-foreground/20 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-300"
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">
                    Compression...
                  </span>
                </div>
              ) : (
                <Image
                  src={item.url}
                  alt={`Photo ${index + 1}`}
                  fill
                  className="object-cover"
                  unoptimized
                />
              )}

              {/* Cover badge */}
              {index === 0 && item.progress === 100 && (
                <span className="absolute top-2 left-2 text-xs bg-primary text-primary-foreground px-2 py-1 rounded font-medium shadow-sm">
                  Couverture
                </span>
              )}

              {/* Drag handle */}
              <div className="absolute top-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="bg-background/80 backdrop-blur-sm rounded p-0.5 shadow-sm">
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>

              {/* Delete button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  removeItem(item.id)
                }}
                className="absolute top-2 right-2 p-1 bg-background/80 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive hover:text-destructive-foreground shadow-sm"
              >
                <X className="h-4 w-4" />
              </button>

              {/* Position number */}
              <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-xs bg-background/80 backdrop-blur-sm rounded px-1.5 py-0.5 font-medium shadow-sm">
                  {index + 1}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {items.length > 1 && (
        <p className="text-xs text-muted-foreground text-center">
          Glissez les photos pour les réorganiser. La première photo sera la
          photo de couverture.
        </p>
      )}
    </div>
  )
}
