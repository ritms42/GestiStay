"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { ReviewCard } from "./review-card"
import { StarRating } from "./star-rating"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { MessageSquare } from "lucide-react"
import type { Review } from "@/types"

interface ReviewListProps {
  propertyId: string
  showSummary?: boolean
}

export function ReviewList({ propertyId, showSummary = true }: ReviewListProps) {
  const supabase = createClient()
  const [reviews, setReviews] = useState<Review[]>([])
  const [stats, setStats] = useState<{
    avg_rating: number
    review_count: number
    avg_cleanliness: number
    avg_communication: number
    avg_location: number
    avg_value: number
  } | null>(null)

  useEffect(() => {
    async function fetchReviews() {
      const { data } = await supabase
        .from("reviews")
        .select("*, guest:profiles!reviews_guest_id_fkey(full_name, avatar_url)")
        .eq("property_id", propertyId)
        .order("created_at", { ascending: false })

      setReviews((data as unknown as Review[]) || [])

      const { data: ratingData } = await supabase
        .from("property_ratings")
        .select("*")
        .eq("property_id", propertyId)
        .single()

      if (ratingData) setStats(ratingData as typeof stats)
    }
    fetchReviews()
  }, [propertyId, supabase])

  if (reviews.length === 0) {
    return (
      <div className="text-center py-10 text-muted-foreground">
        <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>Aucun avis pour le moment</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      {showSummary && stats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <StarRating
                rating={stats.avg_rating}
                showValue
                reviewCount={stats.review_count}
              />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Propreté", value: stats.avg_cleanliness },
                { label: "Communication", value: stats.avg_communication },
                { label: "Emplacement", value: stats.avg_location },
                { label: "Rapport qualité/prix", value: stats.avg_value },
              ].map((item) => (
                <div key={item.label} className="space-y-1">
                  <p className="text-sm text-muted-foreground">{item.label}</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-yellow-400 rounded-full"
                        style={{ width: `${((item.value || 0) / 5) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium w-8">
                      {item.value?.toFixed(1) || "-"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Separator />

      {/* Reviews list */}
      <div className="space-y-4">
        {reviews.map((review) => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </div>
    </div>
  )
}
