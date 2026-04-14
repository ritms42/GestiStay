import { createClient } from "@/lib/supabase/server"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { MapPin } from "lucide-react"

export const metadata = { title: "Annonces - Admin" }

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  draft: { label: "Brouillon", variant: "secondary" },
  published: { label: "Publié", variant: "default" },
  paused: { label: "En pause", variant: "outline" },
  archived: { label: "Archivé", variant: "destructive" },
}

export default async function AdminListingsPage() {
  const supabase = await createClient()

  const { data: properties } = await supabase
    .from("properties")
    .select("*, host:profiles!properties_host_id_fkey(full_name, email)")
    .order("created_at", { ascending: false })
    .limit(100)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Annonces</h1>
        <p className="text-muted-foreground">
          Modération des annonces de la plateforme
        </p>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bien</TableHead>
                <TableHead>Propriétaire</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Créé le</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {properties?.map((property) => {
                const host = property.host as Record<string, unknown>
                const status = statusLabels[property.status] || statusLabels.draft
                return (
                  <TableRow key={property.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{property.title}</p>
                        {property.city && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {property.city}, {property.country}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{host?.full_name as string}</p>
                        <p className="text-xs text-muted-foreground">
                          {host?.email as string}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(property.created_at).toLocaleDateString("fr-FR")}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
