"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, MessageSquare } from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

interface ConversationItem {
  id: string
  property: { title: string }
  last_message?: { content: string; created_at: string; sender_id: string }
  other_user?: { id: string; full_name: string; avatar_url: string }
}

interface MessageItem {
  id: string
  content: string
  sender_id: string
  created_at: string
  sender?: { full_name: string; avatar_url: string }
}

export default function MessagesPage() {
  const supabase = createClient()
  const [userId, setUserId] = useState<string>("")
  const [conversations, setConversations] = useState<ConversationItem[]>([])
  const [activeConv, setActiveConv] = useState<string | null>(null)
  const [messages, setMessages] = useState<MessageItem[]>([])
  const [newMessage, setNewMessage] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const fetchConversations = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return
    setUserId(user.id)

    const { data: participations } = await supabase
      .from("conversation_participants")
      .select("conversation_id")
      .eq("user_id", user.id)

    if (!participations?.length) return

    const convIds = participations.map((p) => p.conversation_id)

    const { data: convs } = await supabase
      .from("conversations")
      .select(
        "id, property:properties(title), booking:bookings(check_in, check_out)"
      )
      .in("id", convIds)
      .order("created_at", { ascending: false })

    if (!convs) return

    // Fetch last message and other participant for each conversation
    const enriched: ConversationItem[] = []
    for (const conv of convs) {
      const { data: lastMsg } = await supabase
        .from("messages")
        .select("content, created_at, sender_id")
        .eq("conversation_id", conv.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single()

      const { data: participants } = await supabase
        .from("conversation_participants")
        .select("user_id")
        .eq("conversation_id", conv.id)
        .neq("user_id", user.id)

      let otherUser = null
      if (participants?.[0]) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("id, full_name, avatar_url")
          .eq("id", participants[0].user_id)
          .single()
        otherUser = profile
      }

      enriched.push({
        id: conv.id,
        property: conv.property as unknown as { title: string },
        last_message: lastMsg || undefined,
        other_user: otherUser || undefined,
      })
    }

    setConversations(enriched)
  }, [supabase])

  useEffect(() => {
    fetchConversations()
  }, [fetchConversations])

  const fetchMessages = useCallback(async (convId: string) => {
    const { data } = await supabase
      .from("messages")
      .select("*, sender:profiles!messages_sender_id_fkey(full_name, avatar_url)")
      .eq("conversation_id", convId)
      .order("created_at", { ascending: true })

    setMessages(data || [])
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100)
  }, [supabase])

  useEffect(() => {
    if (!activeConv) return

    fetchMessages(activeConv)

    // Subscribe to realtime
    const channel = supabase
      .channel(`messages:${activeConv}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${activeConv}`,
        },
        async (payload) => {
          const { data: sender } = await supabase
            .from("profiles")
            .select("full_name, avatar_url")
            .eq("id", payload.new.sender_id)
            .single()

          setMessages((prev) => [
            ...prev,
            { ...payload.new, sender } as MessageItem,
          ])
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [activeConv, supabase, fetchMessages])

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!newMessage.trim() || !activeConv) return

    await supabase.from("messages").insert({
      conversation_id: activeConv,
      sender_id: userId,
      content: newMessage.trim(),
    })

    setNewMessage("")
  }

  return (
    <div className="h-[calc(100vh-8rem)]">
      <h1 className="text-3xl font-bold mb-4">Messages</h1>

      <div className="flex h-[calc(100%-3rem)] border rounded-lg overflow-hidden">
        {/* Conversations list */}
        <div className="w-80 border-r bg-muted/30 shrink-0">
          <ScrollArea className="h-full">
            {conversations.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground">
                <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Aucune conversation</p>
              </div>
            ) : (
              conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => setActiveConv(conv.id)}
                  className={`w-full p-4 text-left border-b hover:bg-muted/50 transition-colors ${
                    activeConv === conv.id ? "bg-muted" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarImage
                        src={conv.other_user?.avatar_url || undefined}
                      />
                      <AvatarFallback>
                        {conv.other_user?.full_name
                          ?.split(" ")
                          .map((n) => n[0])
                          .join("") || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {conv.other_user?.full_name || "Utilisateur"}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {conv.property?.title}
                      </p>
                      {conv.last_message && (
                        <p className="text-xs text-muted-foreground truncate mt-1">
                          {conv.last_message.content}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              ))
            )}
          </ScrollArea>
        </div>

        {/* Messages area */}
        <div className="flex-1 flex flex-col">
          {activeConv ? (
            <>
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.map((msg) => {
                    const isOwn = msg.sender_id === userId
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-lg p-3 ${
                            isOwn
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          }`}
                        >
                          {!isOwn && (
                            <p className="text-xs font-medium mb-1">
                              {msg.sender?.full_name}
                            </p>
                          )}
                          <p className="text-sm whitespace-pre-wrap">
                            {msg.content}
                          </p>
                          <p
                            className={`text-xs mt-1 ${
                              isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
                            }`}
                          >
                            {format(new Date(msg.created_at), "HH:mm", {
                              locale: fr,
                            })}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Message input */}
              <form
                onSubmit={sendMessage}
                className="p-4 border-t flex gap-2"
              >
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Écrivez votre message..."
                  className="flex-1"
                />
                <Button type="submit" size="icon" disabled={!newMessage.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Sélectionnez une conversation</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
