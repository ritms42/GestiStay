import type { MetadataRoute } from "next"
import { createAdminClient } from "@/lib/supabase/admin"

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://gestistay.com"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${BASE_URL}/login`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/register`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/search`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
  ]

  // Dynamic listing pages from published properties
  let listingPages: MetadataRoute.Sitemap = []

  try {
    const supabase = createAdminClient()
    const { data: properties } = await supabase
      .from("properties")
      .select("id, updated_at")
      .eq("status", "published")

    if (properties) {
      listingPages = properties.map((property) => ({
        url: `${BASE_URL}/listing/${property.id}`,
        lastModified: new Date(property.updated_at),
        changeFrequency: "weekly" as const,
        priority: 0.8,
      }))
    }
  } catch (error) {
    console.error("Error fetching properties for sitemap:", error)
  }

  return [...staticPages, ...listingPages]
}
