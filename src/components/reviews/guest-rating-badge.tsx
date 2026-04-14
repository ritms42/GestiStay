"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Star } from "lucide-react"
import { cn } from "@/lib/utils"

interface GuestRatingBadgeProps {
  guestId: string
  className?: string
}

export function GuestRatingBadge({ guestId, className }: GuestRatingBadgeProps) {
  const supabase = createClient()
  const [rating, setRating] = useState<{
    avg_rating: number
    review_count: number
  } | null>(null)

  useEffect(() => {
    async function fetchRating() {
      const { data } = await supabase
        .from("guest_ratings")
        .select("avg_rating, review_count")
        .eq("guest_id", guestId)
        .single()

      if (data) {
        setRating(data as { avg_rating: number; review_count: number })
      }
    }
    fetchRating()
  }, [guestId, supabase])

  if (!rating || rating.review_count === 0) return null

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-yellow-50 px-2 py-0.5 text-xs font-medium text-yellow-800 border border-yellow-200",
        className
      )}
    >
      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
      {rating.avg_rating.toFixed(1)}
      <span className="text-yellow-600">({rating.review_count})</span>
    </span>
  )
}
