"use client"

import { Star } from "lucide-react"
import { cn } from "@/lib/utils"

interface StarRatingProps {
  rating: number
  maxRating?: number
  size?: "sm" | "md" | "lg"
  interactive?: boolean
  onRate?: (rating: number) => void
  showValue?: boolean
  reviewCount?: number
}

const sizes = {
  sm: "h-3.5 w-3.5",
  md: "h-5 w-5",
  lg: "h-6 w-6",
}

export function StarRating({
  rating,
  maxRating = 5,
  size = "md",
  interactive = false,
  onRate,
  showValue = false,
  reviewCount,
}: StarRatingProps) {
  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center">
        {Array.from({ length: maxRating }, (_, i) => {
          const filled = i < Math.floor(rating)
          const halfFilled = i === Math.floor(rating) && rating % 1 >= 0.5

          return (
            <button
              key={i}
              type="button"
              disabled={!interactive}
              onClick={() => onRate?.(i + 1)}
              className={cn(
                "transition-colors",
                interactive && "cursor-pointer hover:scale-110"
              )}
            >
              <Star
                className={cn(
                  sizes[size],
                  filled || halfFilled
                    ? "fill-yellow-400 text-yellow-400"
                    : "fill-none text-muted-foreground/30"
                )}
              />
            </button>
          )
        })}
      </div>
      {showValue && (
        <span className="text-sm font-medium ml-1">
          {rating.toFixed(1)}
        </span>
      )}
      {reviewCount !== undefined && (
        <span className="text-sm text-muted-foreground ml-1">
          ({reviewCount} avis)
        </span>
      )}
    </div>
  )
}
