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

export const metadata = { title: "Abonnements - Admin" }

export default async function AdminSubscriptionsPage() {
  const supabase = await createClient()

  const { data: subscribers } = await supabase
    .from("profiles")
    .select("*")
    .neq("subscription_status", "none")
    .order("updated_at", { ascending: false })
    .limit(100)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Abonnements</h1>
        <p className="text-muted-foreground">
          Suivi des abonnements de la plateforme
        </p>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Utilisateur</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Depuis</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subscribers && subscribers.length > 0 ? (
                subscribers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{user.full_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="capitalize">
                      {user.subscription_plan || "-"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          user.subscription_status === "active"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {user.subscription_status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(user.updated_at).toLocaleDateString("fr-FR")}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-10 text-muted-foreground">
                    Aucun abonnement
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
