"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Home,
  Building2,
  CalendarDays,
  MessageSquare,
  BotMessageSquare,
  BarChart3,
  CreditCard,
  Settings,
  ChevronLeft,
  ChevronRight,
  Tag,
  ClipboardCheck,
  Receipt,
  Key,
  Wallet,
  HelpCircle,
  Star,
} from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"

const navItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Mes biens",
    href: "/properties",
    icon: Building2,
  },
  {
    title: "Réservations",
    href: "/reservations",
    icon: CalendarDays,
  },
  {
    title: "Messages",
    href: "/messages",
    icon: MessageSquare,
  },
  {
    title: "Messages auto",
    href: "/auto-messages",
    icon: BotMessageSquare,
  },
  {
    title: "Check-ins",
    href: "/checkins",
    icon: ClipboardCheck,
  },
  {
    title: "Promotions",
    href: "/promotions",
    icon: Tag,
  },
  {
    title: "Avis",
    href: "/reviews",
    icon: Star,
  },
  {
    title: "Revenus",
    href: "/revenue",
    icon: BarChart3,
  },
  {
    title: "Paiements",
    href: "/payouts",
    icon: Wallet,
  },
  {
    title: "Comptabilité",
    href: "/accounting",
    icon: Receipt,
  },
  {
    title: "Abonnement",
    href: "/subscription",
    icon: CreditCard,
  },
  {
    title: "API",
    href: "/api-keys",
    icon: Key,
  },
  {
    title: "Support",
    href: "/support",
    icon: HelpCircle,
  },
  {
    title: "Paramètres",
    href: "/settings",
    icon: Settings,
  },
]

export function DashboardSidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside
      className={cn(
        "hidden lg:flex flex-col border-r bg-muted/30 transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b">
        <Link href="/" className="flex items-center gap-2">
          <Home className="h-6 w-6 text-primary shrink-0" />
          {!collapsed && <span className="text-xl font-bold">GestiStay</span>}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/")
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
              <item.icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{item.title}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Collapse toggle */}
      <div className="p-3 border-t">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-center"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>
    </aside>
  )
}
