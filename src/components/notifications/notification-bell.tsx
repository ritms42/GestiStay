"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Bell, Check, ExternalLink } from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { useRouter } from "next/navigation"
import type { Notification } from "@/types"

export function NotificationBell() {
  const supabase = createClient()
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  const fetchNotifications = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20)

    setNotifications((data as Notification[]) || [])
    setUnreadCount(data?.filter((n) => !n.read).length || 0)
  }, [supabase])

  useEffect(() => {
    fetchNotifications()

    // Subscribe to realtime notifications
    const channel = supabase
      .channel("notifications")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications" },
        () => fetchNotifications()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, fetchNotifications])

  async function markAsRead(notifId: string) {
    await supabase
      .from("notifications")
      .update({ read: true })
      .eq("id", notifId)

    setNotifications((prev) =>
      prev.map((n) => (n.id === notifId ? { ...n, read: true } : n))
    )
    setUnreadCount((prev) => Math.max(0, prev - 1))
  }

  async function markAllAsRead() {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", user.id)
      .eq("read", false)

    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    setUnreadCount(0)
  }

  function handleClick(notif: Notification) {
    markAsRead(notif.id)
    if (notif.link) router.push(notif.link)
  }

  const iconMap: Record<string, string> = {
    booking_new: "📅",
    booking_confirmed: "✅",
    booking_canceled: "❌",
    review_new: "⭐",
    review_reply: "💬",
    message_new: "✉️",
    payment_received: "💰",
    promotion_expiring: "🏷️",
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between p-3 border-b">
          <h3 className="font-semibold text-sm">Notifications</h3>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              <Check className="h-3 w-3" />
              Tout marquer lu
            </button>
          )}
        </div>
        <ScrollArea className="max-h-80">
          {notifications.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground text-sm">
              Aucune notification
            </div>
          ) : (
            notifications.map((notif) => (
              <button
                key={notif.id}
                onClick={() => handleClick(notif)}
                className={`w-full text-left p-3 border-b last:border-0 hover:bg-muted/50 transition-colors ${
                  !notif.read ? "bg-primary/5" : ""
                }`}
              >
                <div className="flex gap-3">
                  <span className="text-lg shrink-0">
                    {iconMap[notif.type] || "🔔"}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${!notif.read ? "font-semibold" : ""}`}>
                      {notif.title}
                    </p>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {notif.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(notif.created_at), "d MMM à HH:mm", {
                        locale: fr,
                      })}
                    </p>
                  </div>
                  {notif.link && (
                    <ExternalLink className="h-3 w-3 text-muted-foreground shrink-0 mt-1" />
                  )}
                </div>
              </button>
            ))
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
