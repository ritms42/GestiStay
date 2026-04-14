"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  propertySchema,
  type PropertyInput,
  AMENITIES,
} from "@/lib/validations/property"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Loader2, ArrowLeft, ArrowRight } from "lucide-react"
import { toast } from "sonner"
import { PhotoUploader } from "@/components/properties/photo-uploader"

const STEPS = [
  { id: "basics", title: "Informations de base" },
  { id: "location", title: "Localisation" },
  { id: "details", title: "Capacité & équipements" },
  { id: "photos", title: "Photos" },
  { id: "rules", title: "Règles & horaires" },
]

const PROPERTY_TYPES = [
  { value: "apartment", label: "Appartement" },
  { value: "house", label: "Maison" },
  { value: "villa", label: "Villa" },
  { value: "studio", label: "Studio" },
  { value: "room", label: "Chambre" },
  { value: "other", label: "Autre" },
]

export default function NewPropertyPage() {
  const router = useRouter()
  const supabase = createClient()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [photos, setPhotos] = useState<File[]>([])
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([])

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PropertyInput>({
    resolver: zodResolver(propertySchema) as never,
    defaultValues: {
      property_type: "apartment",
      max_guests: 2,
      bedrooms: 1,
      beds: 1,
      bathrooms: 1,
      amenities: [],
      check_in_time: "15:00",
      check_out_time: "11:00",
      cancellation_policy: "moderate",
      instant_book: false,
      min_nights: 1,
      max_nights: 365,
      preparation_days: 0,
    },
  })

  function toggleAmenity(id: string) {
    setSelectedAmenities((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    )
  }

  async function onSubmit(data: PropertyInput) {
    setLoading(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Non connecté")

      // Create property
      const { data: property, error: propError } = await supabase
        .from("properties")
        .insert({
          host_id: user.id,
          ...data,
          amenities: selectedAmenities,
          status: "draft",
        })
        .select()
        .single()

      if (propError) throw propError

      // Upload photos
      for (let i = 0; i < photos.length; i++) {
        const file = photos[i]
        const ext = file.name.split(".").pop()
        const path = `${user.id}/${property.id}/${Date.now()}-${i}.${ext}`

        const { error: uploadError } = await supabase.storage
          .from("property-images")
          .upload(path, file)

        if (uploadError) {
          console.error("Upload error:", uploadError)
          continue
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from("property-images").getPublicUrl(path)

        await supabase.from("property_images").insert({
          property_id: property.id,
          url: publicUrl,
          position: i,
          is_cover: i === 0,
        })
      }

      // Create default pricing
      await supabase.from("pricing").insert({
        property_id: property.id,
        base_price: 50,
        cleaning_fee: 0,
        currency: "EUR",
      })

      toast.success("Bien créé avec succès !")
      router.push(`/properties/${property.id}`)
    } catch (error) {
      toast.error("Erreur lors de la création du bien")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Ajouter un bien</h1>
        <p className="text-muted-foreground">
          Créez votre annonce en quelques étapes
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setStep(i)}
              className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors ${
                i === step
                  ? "bg-primary text-primary-foreground"
                  : i < step
                    ? "bg-primary/20 text-primary"
                    : "bg-muted text-muted-foreground"
              }`}
            >
              {i + 1}
            </button>
            {i < STEPS.length - 1 && (
              <div
                className={`hidden sm:block w-12 h-0.5 ${
                  i < step ? "bg-primary" : "bg-muted"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Step 1: Basics */}
        {step === 0 && (
          <Card>
            <CardHeader>
              <CardTitle>{STEPS[0].title}</CardTitle>
              <CardDescription>
                Décrivez votre bien en quelques mots
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Titre de l&apos;annonce *</Label>
                <Input
                  id="title"
                  placeholder="Bel appartement au centre-ville"
                  {...register("title")}
                />
                {errors.title && (
                  <p className="text-sm text-destructive">
                    {errors.title.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="property_type">Type de bien *</Label>
                <Select
                  defaultValue="apartment"
                  onValueChange={(v) =>
                    setValue("property_type", v as PropertyInput["property_type"])
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PROPERTY_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Décrivez votre bien, son emplacement, ses particularités..."
                  rows={6}
                  {...register("description")}
                />
                {errors.description && (
                  <p className="text-sm text-destructive">
                    {errors.description.message}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Location */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>{STEPS[1].title}</CardTitle>
              <CardDescription>
                Où se situe votre bien ?
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="address">Adresse *</Label>
                <Input
                  id="address"
                  placeholder="123 rue de la Paix"
                  {...register("address")}
                />
                {errors.address && (
                  <p className="text-sm text-destructive">
                    {errors.address.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">Ville *</Label>
                  <Input
                    id="city"
                    placeholder="Paris"
                    {...register("city")}
                  />
                  {errors.city && (
                    <p className="text-sm text-destructive">
                      {errors.city.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="postal_code">Code postal</Label>
                  <Input
                    id="postal_code"
                    placeholder="75001"
                    {...register("postal_code")}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">Pays *</Label>
                <Input
                  id="country"
                  placeholder="France"
                  {...register("country")}
                />
                {errors.country && (
                  <p className="text-sm text-destructive">
                    {errors.country.message}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Details */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>{STEPS[2].title}</CardTitle>
              <CardDescription>
                Capacité et équipements disponibles
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="max_guests">Voyageurs max *</Label>
                  <Input
                    id="max_guests"
                    type="number"
                    min={1}
                    {...register("max_guests", { valueAsNumber: true })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bedrooms">Chambres</Label>
                  <Input
                    id="bedrooms"
                    type="number"
                    min={0}
                    {...register("bedrooms", { valueAsNumber: true })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="beds">Lits *</Label>
                  <Input
                    id="beds"
                    type="number"
                    min={1}
                    {...register("beds", { valueAsNumber: true })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bathrooms">Salle de bain</Label>
                  <Input
                    id="bathrooms"
                    type="number"
                    min={0}
                    {...register("bathrooms", { valueAsNumber: true })}
                  />
                </div>
              </div>

              <div>
                <Label className="mb-3 block">Équipements</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {AMENITIES.map((amenity) => (
                    <button
                      key={amenity.id}
                      type="button"
                      onClick={() => toggleAmenity(amenity.id)}
                      className={`flex items-center gap-2 p-3 rounded-lg border text-sm transition-colors ${
                        selectedAmenities.includes(amenity.id)
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <span>{amenity.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Photos */}
        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>{STEPS[3].title}</CardTitle>
              <CardDescription>
                Ajoutez des photos de votre bien (la première sera la photo
                de couverture)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PhotoUploader
                onPhotosChange={(newPhotos) => {
                  setPhotos(newPhotos)
                }}
              />
            </CardContent>
          </Card>
        )}

        {/* Step 5: Rules */}
        {step === 4 && (
          <Card>
            <CardHeader>
              <CardTitle>{STEPS[4].title}</CardTitle>
              <CardDescription>
                Définissez les règles de votre logement
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="check_in_time">Heure d&apos;arrivée</Label>
                  <Input
                    id="check_in_time"
                    type="time"
                    {...register("check_in_time")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="check_out_time">Heure de départ</Label>
                  <Input
                    id="check_out_time"
                    type="time"
                    {...register("check_out_time")}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="house_rules">Règles du logement</Label>
                <Textarea
                  id="house_rules"
                  placeholder="Pas de fête, pas de tabac dans le logement, animaux non acceptés..."
                  rows={6}
                  {...register("house_rules")}
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="cancellation_policy">
                  Politique d&apos;annulation
                </Label>
                <Select
                  defaultValue="moderate"
                  onValueChange={(v) =>
                    setValue(
                      "cancellation_policy",
                      v as "flexible" | "moderate" | "strict"
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="flexible">
                      Flexible - Remboursement intégral 24h avant
                    </SelectItem>
                    <SelectItem value="moderate">
                      Modérée - Remboursement intégral 5 jours avant
                    </SelectItem>
                    <SelectItem value="strict">
                      Stricte - 50% remboursé 7 jours avant
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label htmlFor="instant_book">
                    Réservation instantanée
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Les voyageurs peuvent réserver sans approbation
                  </p>
                </div>
                <Switch
                  id="instant_book"
                  checked={watch("instant_book") || false}
                  onCheckedChange={(checked) =>
                    setValue("instant_book", checked)
                  }
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="min_nights">Nuits minimum</Label>
                  <Input
                    id="min_nights"
                    type="number"
                    min={1}
                    max={365}
                    {...register("min_nights", { valueAsNumber: true })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max_nights">Nuits maximum</Label>
                  <Input
                    id="max_nights"
                    type="number"
                    min={1}
                    max={365}
                    {...register("max_nights", { valueAsNumber: true })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="preparation_days">
                    Jours de préparation
                  </Label>
                  <Input
                    id="preparation_days"
                    type="number"
                    min={0}
                    max={30}
                    {...register("preparation_days", {
                      valueAsNumber: true,
                    })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Temps entre deux réservations
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation buttons */}
        <div className="flex justify-between mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => setStep(Math.max(0, step - 1))}
            disabled={step === 0}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Précédent
          </Button>

          {step < STEPS.length - 1 ? (
            <Button
              type="button"
              onClick={() => setStep(Math.min(STEPS.length - 1, step + 1))}
            >
              Suivant
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Créer le bien
            </Button>
          )}
        </div>
      </form>
    </div>
  )
}
