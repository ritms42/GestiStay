"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Search, Heart, Plane, MessageSquare, User } from "lucide-react"
import { cn } from "@/lib/utils"

const tabs = [
  { label: "Explorer", href: "/search", icon: Search },
  { label: "Favoris", href: "/favorites", icon: Heart },
  { label: "Voyages", href: "/trips", icon: Plane },
  { label: "Messages", href: "/messages", icon: MessageSquare },
  { label: "Profil", href: "/settings", icon: User },
]

export function MobileBottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around h-14">
        {tabs.map((tab) => {
          const isActive =
            pathname === tab.href || pathname.startsWith(tab.href + "/")
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 flex-1 h-full text-[10px] font-medium transition-colors",
                isActive
                  ? "text-green-600"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <tab.icon
                className={cn(
                  "h-5 w-5",
                  isActive && "text-green-600"
                )}
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span>{tab.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
