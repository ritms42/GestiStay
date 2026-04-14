"use client"

import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Menu,
  LogOut,
  User,
  Building2,
  CalendarDays,
  MessageSquare,
  BarChart3,
  CreditCard,
  Settings,
  LayoutDashboard,
  Home,
  Tag,
  ClipboardCheck,
  Receipt,
  Key,
  Wallet,
  Sparkles,
} from "lucide-react"
import { NotificationBell } from "@/components/notifications/notification-bell"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import type { Profile } from "@/types"

const navItems = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Mes biens", href: "/properties", icon: Building2 },
  { title: "Réservations", href: "/reservations", icon: CalendarDays },
  { title: "Messages", href: "/messages", icon: MessageSquare },
  { title: "Check-ins", href: "/checkins", icon: ClipboardCheck },
  { title: "Promotions", href: "/promotions", icon: Tag },
  { title: "Smart Pricing", href: "/smart-pricing", icon: Sparkles },
  { title: "Revenus", href: "/revenue", icon: BarChart3 },
  { title: "Paiements", href: "/payouts", icon: Wallet },
  { title: "Comptabilité", href: "/accounting", icon: Receipt },
  { title: "Abonnement", href: "/subscription", icon: CreditCard },
  { title: "API", href: "/api-keys", icon: Key },
  { title: "Paramètres", href: "/settings", icon: Settings },
]

export function DashboardHeader({ profile }: { profile: Profile }) {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push("/")
    router.refresh()
  }

  const initials =
    profile.full_name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase() || "?"

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-background px-4 lg:px-6">
      {/* Mobile sidebar */}
      <Sheet>
        <SheetTrigger
          render={<Button variant="ghost" size="icon" className="lg:hidden" />}
        >
          <Menu className="h-5 w-5" />
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <div className="flex items-center h-16 px-4 border-b">
            <Link href="/" className="flex items-center gap-2">
              <Home className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">GestiStay</span>
            </Link>
          </div>
          <nav className="p-3 space-y-1">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href ||
                pathname.startsWith(item.href + "/")
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.title}</span>
                </Link>
              )
            })}
          </nav>
        </SheetContent>
      </Sheet>

      <div className="flex-1" />

      {/* Notifications */}
      <NotificationBell />

      {/* User menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-9 w-9 rounded-full">
            <Avatar className="h-9 w-9">
              <AvatarImage
                src={profile.avatar_url || undefined}
                alt={profile.full_name || ""}
              />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end">
          <div className="flex items-center justify-start gap-2 p-2">
            <div className="flex flex-col space-y-1 leading-none">
              <p className="font-medium">{profile.full_name}</p>
              <p className="text-xs text-muted-foreground">{profile.email}</p>
            </div>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => router.push("/settings")}>
            <User className="mr-2 h-4 w-4" />
            Profil
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Déconnexion
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
