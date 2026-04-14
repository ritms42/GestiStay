import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  Shield,
  Star,
  Clock,
  MessageSquare,
  Home,
  Globe,
  CalendarDays,
} from "lucide-react"
import Link from "next/link"
import type { Metadata } from "next"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", id)
    .single()

  return {
    title: data?.full_name || "Profil utilisateur",
    description: data?.full_name
      ? `Profil de ${data.full_name} sur GestiStay`
      : "Profil utilisateur GestiStay",
  }
}

function getInitials(name: string | null): string {
  if (!name) return "?"
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  })
}

function formatResponseTime(time: string | null): string {
  if (!time) return "Non disponible"
  const minutes = parseInt(time, 10)
  if (isNaN(minutes)) return time
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h`
  return `${Math.floor(hours / 24)}j`
}

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  // Fetch the profile (public data only)
  const { data: profile, error } = await supabase
    .from("profiles")
    .select(
      "id, full_name, avatar_url, role, kyc_status, bio, languages, response_rate, response_time, created_at"
    )
    .eq("id", id)
    .single()

  if (error || !profile) {
    notFound()
  }

  // Fetch published properties if host
  const isHost = profile.role === "host" || profile.role === "admin"

  const { data: properties } = isHost
    ? await supabase
        .from("properties")
        .select("id, title, city, country, property_type, images:property_images(url, is_cover)")
        .eq("host_id", id)
        .eq("status", "published")
        .order("created_at", { ascending: false })
    : { data: null }

  // Fetch reviews received (as host)
  const { data: reviews } = await supabase
    .from("reviews")
    .select(
      "id, rating, comment, created_at, guest:profiles!reviews_guest_id_fkey(full_name, avatar_url)"
    )
    .eq("host_id", id)
    .eq("reviewer_type", "guest")
    .order("created_at", { ascending: false })
    .limit(10)

  // Average rating
  const avgRating =
    reviews && reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : null

  return (
    <div className="container mx-auto max-w-5xl px-4 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile sidebar */}
        <div className="space-y-6">
          <Card>
            <CardContent className="pt-6 flex flex-col items-center text-center">
              <Avatar className="h-24 w-24 mb-4" size="lg">
                {profile.avatar_url && (
                  <AvatarImage
                    src={profile.avatar_url}
                    alt={profile.full_name || "Avatar"}
                  />
                )}
                <AvatarFallback className="text-2xl">
                  {getInitials(profile.full_name)}
                </AvatarFallback>
              </Avatar>

              <h1 className="text-xl font-bold">
                {profile.full_name || "Utilisateur"}
              </h1>

              {profile.kyc_status === "verified" && (
                <Badge variant="secondary" className="mt-2 gap-1">
                  <Shield className="h-3 w-3" />
                  Identit&eacute; v&eacute;rifi&eacute;e
                </Badge>
              )}

              <div className="flex items-center gap-1 mt-3 text-sm text-muted-foreground">
                <CalendarDays className="h-4 w-4" />
                Membre depuis {formatDate(profile.created_at)}
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          <Card>
            <CardContent className="pt-4 space-y-4">
              {avgRating !== null && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <Star className="h-4 w-4 text-yellow-500" />
                    Note moyenne
                  </div>
                  <span className="font-semibold">
                    {avgRating.toFixed(1)} / 5
                  </span>
                </div>
              )}

              {reviews && reviews.length > 0 && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    Avis re&ccedil;us
                  </div>
                  <span className="font-semibold">{reviews.length}</span>
                </div>
              )}

              {isHost && properties && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <Home className="h-4 w-4 text-muted-foreground" />
                    Logements
                  </div>
                  <span className="font-semibold">{properties.length}</span>
                </div>
              )}

              {profile.response_rate !== null && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    Taux de r&eacute;ponse
                  </div>
                  <span className="font-semibold">
                    {profile.response_rate}%
                  </span>
                </div>
              )}

              {profile.response_time && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    Temps de r&eacute;ponse
                  </div>
                  <span className="font-semibold">
                    {formatResponseTime(profile.response_time)}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Main content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Bio */}
          {profile.bio && (
            <section>
              <h2 className="text-lg font-semibold mb-3">&Agrave; propos</h2>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                {profile.bio}
              </p>
            </section>
          )}

          {/* Languages */}
          {profile.languages && profile.languages.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Langues parl&eacute;es
              </h2>
              <div className="flex flex-wrap gap-2">
                {profile.languages.map((lang: string) => (
                  <Badge key={lang} variant="outline">
                    {lang}
                  </Badge>
                ))}
              </div>
            </section>
          )}

          <Separator />

          {/* Properties */}
          {isHost && properties && properties.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold mb-4">
                Logements de {profile.full_name || "cet h&ocirc;te"}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {properties.map((property) => {
                  const coverImage = property.images?.find(
                    (img: { url: string; is_cover: boolean }) => img.is_cover
                  )
                  return (
                    <Link
                      key={property.id}
                      href={`/listing/${property.id}`}
                      className="group"
                    >
                      <Card className="overflow-hidden transition-shadow hover:shadow-md">
                        {coverImage && (
                          <div className="aspect-video overflow-hidden">
                            <img
                              src={coverImage.url}
                              alt={property.title}
                              className="h-full w-full object-cover transition-transform group-hover:scale-105"
                            />
                          </div>
                        )}
                        <CardContent className="pt-3">
                          <h3 className="font-medium truncate">
                            {property.title}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {[property.city, property.country]
                              .filter(Boolean)
                              .join(", ")}
                          </p>
                        </CardContent>
                      </Card>
                    </Link>
                  )
                })}
              </div>
            </section>
          )}

          {/* Reviews */}
          {reviews && reviews.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold mb-4">
                Avis des voyageurs
              </h2>
              <div className="space-y-4">
                {reviews.map((review) => {
                  const guest = review.guest as unknown as {
                    full_name: string | null
                    avatar_url: string | null
                  } | null
                  return (
                    <Card key={review.id}>
                      <CardContent className="pt-4">
                        <div className="flex items-start gap-3">
                          <Avatar size="sm">
                            {guest?.avatar_url && (
                              <AvatarImage
                                src={guest.avatar_url}
                                alt={guest.full_name || ""}
                              />
                            )}
                            <AvatarFallback>
                              {getInitials(guest?.full_name ?? null)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium">
                                {guest?.full_name || "Voyageur"}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {formatDate(review.created_at)}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 mb-2">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-3.5 w-3.5 ${
                                    i < review.rating
                                      ? "fill-yellow-500 text-yellow-500"
                                      : "text-muted-foreground/30"
                                  }`}
                                />
                              ))}
                            </div>
                            {review.comment && (
                              <p className="text-sm text-muted-foreground">
                                {review.comment}
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </section>
          )}

          {/* Empty state when no reviews and no properties */}
          {(!reviews || reviews.length === 0) &&
            (!properties || properties.length === 0) &&
            !profile.bio && (
              <div className="text-center py-12 text-muted-foreground">
                <p>Ce profil n&apos;a pas encore de contenu &agrave; afficher.</p>
              </div>
            )}
        </div>
      </div>
    </div>
  )
}
