"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
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
  Home,
  Menu,
  X,
  User,
  LogOut,
  LayoutDashboard,
  Plane,
  MessageSquare,
} from "lucide-react"
import type { Profile } from "@/types"

export function Header() {
  const router = useRouter()
  const supabase = createClient()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    async function getProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single()
        setProfile(data)
      }
    }
    getProfile()
  }, [supabase])

  async function handleSignOut() {
    await supabase.auth.signOut()
    setProfile(null)
    router.push("/")
    router.refresh()
  }

  const initials = profile?.full_name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase() || "?"

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <Home className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold">GestiStay</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Link
            href="/search"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Explorer
          </Link>
          {profile ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-9 w-9 rounded-full"
                >
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
                    <p className="text-xs text-muted-foreground">
                      {profile.email}
                    </p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                {(profile.role === "host" || profile.role === "admin") && (
                  <DropdownMenuItem onClick={() => router.push("/dashboard")}>
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    Dashboard
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => router.push("/trips")}>
                  <Plane className="mr-2 h-4 w-4" />
                  Mes voyages
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/messages")}>
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Messages
                </DropdownMenuItem>
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
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" asChild>
                <Link href="/login">Connexion</Link>
              </Button>
              <Button asChild>
                <Link href="/register">Inscription</Link>
              </Button>
            </div>
          )}
        </nav>

        {/* Mobile menu button */}
        <button
          className="md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t bg-background p-4 space-y-3">
          <Link
            href="/search"
            className="block text-sm font-medium py-2"
            onClick={() => setMobileMenuOpen(false)}
          >
            Explorer
          </Link>
          {profile ? (
            <>
              {(profile.role === "host" || profile.role === "admin") && (
                <Link
                  href="/dashboard"
                  className="block text-sm font-medium py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
              )}
              <Link
                href="/trips"
                className="block text-sm font-medium py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Mes voyages
              </Link>
              <Link
                href="/messages"
                className="block text-sm font-medium py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Messages
              </Link>
              <button
                className="block text-sm font-medium py-2 text-destructive"
                onClick={() => {
                  handleSignOut()
                  setMobileMenuOpen(false)
                }}
              >
                Déconnexion
              </button>
            </>
          ) : (
            <div className="flex gap-2">
              <Button variant="ghost" asChild className="flex-1">
                <Link href="/login">Connexion</Link>
              </Button>
              <Button asChild className="flex-1">
                <Link href="/register">Inscription</Link>
              </Button>
            </div>
          )}
        </div>
      )}
    </header>
  )
}
