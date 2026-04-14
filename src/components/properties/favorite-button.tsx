"use client"

import { useState, useEffect, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface FavoriteButtonProps {
  propertyId: string
  className?: string
  size?: "sm" | "default" | "lg" | "icon"
}

export function FavoriteButton({
  propertyId,
  className,
  size = "icon",
}: FavoriteButtonProps) {
  const router = useRouter()
  const supabase = createClient()
  const [isFavorited, setIsFavorited] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    async function checkFavorite() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setIsLoading(false)
        return
      }

      const { data } = await supabase
        .from("favorites")
        .select("id")
        .eq("user_id", user.id)
        .eq("property_id", propertyId)
        .maybeSingle()

      setIsFavorited(!!data)
      setIsLoading(false)
    }

    checkFavorite()
  }, [supabase, propertyId])

  async function toggleFavorite(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.push("/login")
      return
    }

    // Optimistic update
    const previousState = isFavorited
    setIsFavorited(!isFavorited)

    startTransition(async () => {
      try {
        if (previousState) {
          const { error } = await supabase
            .from("favorites")
            .delete()
            .eq("user_id", user.id)
            .eq("property_id", propertyId)

          if (error) throw error
          toast.success("Retiré des favoris")
        } else {
          const { error } = await supabase.from("favorites").insert({
            user_id: user.id,
            property_id: propertyId,
          })

          if (error) throw error
          toast.success("Ajouté aux favoris")
        }
      } catch {
        // Revert optimistic update on error
        setIsFavorited(previousState)
        toast.error("Une erreur est survenue")
      }
    })
  }

  if (isLoading) {
    return (
      <Button
        variant="ghost"
        size={size}
        className={cn("rounded-full", className)}
        disabled
      >
        <Heart className="h-5 w-5" />
      </Button>
    )
  }

  return (
    <Button
      variant="ghost"
      size={size}
      className={cn("rounded-full", className)}
      onClick={toggleFavorite}
      disabled={isPending}
      aria-label={isFavorited ? "Retirer des favoris" : "Ajouter aux favoris"}
    >
      <Heart
        className={cn("h-5 w-5 transition-colors", {
          "fill-red-500 text-red-500": isFavorited,
          "text-muted-foreground hover:text-red-500": !isFavorited,
        })}
      />
    </Button>
  )
}
