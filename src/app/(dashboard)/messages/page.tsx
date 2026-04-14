"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Send,
  MessageSquare,
  Paperclip,
  Image as ImageIcon,
  FileText,
  Search,
  X,
  Download,
  CheckCheck,
  Check,
  ArrowLeft,
  Globe,
  Zap,
  Plus,
  Trash2,
} from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Attachment {
  name: string
  url: string
  type: string // mime
  size: number
}

interface ConversationItem {
  id: string
  property: { title: string }
  last_message?: { content: string; created_at: string; sender_id: string }
  other_user?: { id: string; full_name: string; avatar_url: string }
  unread_count: number
}

interface MessageItem {
  id: string
  content: string
  sender_id: string
  created_at: string
  message_type: "text" | "image" | "file" | "system"
  attachments: Attachment[]
  read_at: string | null
  sender?: { full_name: string; avatar_url: string }
}

interface TemplateItem {
  id: string
  name: string
  content: string
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
}

function isImageMime(mime: string): boolean {
  return mime.startsWith("image/")
}

function getInitials(name?: string): string {
  if (!name) return "?"
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function OnlineDot({ isOnline }: { isOnline: boolean }) {
  if (!isOnline) return null
  return (
    <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full border-2 border-white bg-green-500" />
  )
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-3 py-2 text-xs text-muted-foreground">
      <span className="flex gap-0.5">
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:0ms]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:150ms]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:300ms]" />
      </span>
      <span className="ml-1">est en train d&apos;ecrire...</span>
    </div>
  )
}

function ReadReceipt({
  isOwn,
  readAt,
}: {
  isOwn: boolean
  readAt: string | null
}) {
  if (!isOwn) return null
  return readAt ? (
    <CheckCheck className="inline-block h-3.5 w-3.5 text-blue-400" />
  ) : (
    <Check className="inline-block h-3.5 w-3.5 opacity-60" />
  )
}

function AttachmentPreview({ attachment }: { attachment: Attachment }) {
  if (isImageMime(attachment.type)) {
    return (
      <a
        href={attachment.url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-1 block"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={attachment.url}
          alt={attachment.name}
          className="max-h-48 max-w-full rounded-md object-cover"
        />
      </a>
    )
  }

  return (
    <a
      href={attachment.url}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-1 flex items-center gap-2 rounded-md border bg-background/60 p-2 text-xs hover:bg-accent transition-colors"
    >
      <FileText className="h-4 w-4 shrink-0" />
      <span className="truncate flex-1">{attachment.name}</span>
      <span className="shrink-0 text-muted-foreground">
        {formatFileSize(attachment.size)}
      </span>
      <Download className="h-3.5 w-3.5 shrink-0" />
    </a>
  )
}

function SystemMessage({ content }: { content: string }) {
  return (
    <div className="flex justify-center py-2">
      <span className="rounded-full bg-muted px-4 py-1 text-xs text-muted-foreground">
        {content}
      </span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function MessagesPage() {
  const supabase = createClient()

  // Auth
  const [userId, setUserId] = useState<string>("")

  // Conversations
  const [conversations, setConversations] = useState<ConversationItem[]>([])
  const [activeConv, setActiveConv] = useState<string | null>(null)

  // Messages
  const [messages, setMessages] = useState<MessageItem[]>([])
  const [newMessage, setNewMessage] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Search within conversation
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  // File upload
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  // Templates
  const [templates, setTemplates] = useState<TemplateItem[]>([])
  const [newTemplateName, setNewTemplateName] = useState("")
  const [newTemplateContent, setNewTemplateContent] = useState("")
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false)

  // Presence
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set())
  const [othersTyping, setOthersTyping] = useState(false)

  // Mobile
  const [mobileShowChat, setMobileShowChat] = useState(false)

  // Typing debounce
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const presenceChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(
    null
  )

  // --------------------------------------------------
  // Fetch conversations
  // --------------------------------------------------
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

      // Count unread messages
      const { count } = await supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .eq("conversation_id", conv.id)
        .neq("sender_id", user.id)
        .is("read_at", null)

      enriched.push({
        id: conv.id,
        property: conv.property as unknown as { title: string },
        last_message: lastMsg || undefined,
        other_user: otherUser || undefined,
        unread_count: count ?? 0,
      })
    }

    setConversations(enriched)
  }, [supabase])

  useEffect(() => {
    fetchConversations()
  }, [fetchConversations])

  // --------------------------------------------------
  // Fetch templates
  // --------------------------------------------------
  const fetchTemplates = useCallback(async () => {
    if (!userId) return
    const { data } = await supabase
      .from("message_templates")
      .select("id, name, content")
      .eq("user_id", userId)
      .order("created_at", { ascending: true })
    setTemplates(data || [])
  }, [supabase, userId])

  useEffect(() => {
    fetchTemplates()
  }, [fetchTemplates])

  // --------------------------------------------------
  // Fetch messages for active conversation
  // --------------------------------------------------
  const fetchMessages = useCallback(
    async (convId: string) => {
      const { data } = await supabase
        .from("messages")
        .select(
          "*, sender:profiles!messages_sender_id_fkey(full_name, avatar_url)"
        )
        .eq("conversation_id", convId)
        .order("created_at", { ascending: true })

      setMessages((data as MessageItem[]) || [])
      setTimeout(
        () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }),
        100
      )
    },
    [supabase]
  )

  // --------------------------------------------------
  // Mark messages as read
  // --------------------------------------------------
  const markAsRead = useCallback(
    async (convId: string) => {
      if (!userId) return
      await supabase
        .from("messages")
        .update({ read_at: new Date().toISOString() })
        .eq("conversation_id", convId)
        .neq("sender_id", userId)
        .is("read_at", null)

      // Update local unread counts
      setConversations((prev) =>
        prev.map((c) => (c.id === convId ? { ...c, unread_count: 0 } : c))
      )
    },
    [supabase, userId]
  )

  // --------------------------------------------------
  // Realtime subscription for messages + presence
  // --------------------------------------------------
  useEffect(() => {
    if (!activeConv || !userId) return

    fetchMessages(activeConv)
    markAsRead(activeConv)

    // Messages channel
    const msgChannel = supabase
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

          const newMsg = { ...payload.new, sender } as MessageItem
          setMessages((prev) => [...prev, newMsg])
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })

          // If message is from someone else, mark as read
          if (payload.new.sender_id !== userId) {
            await supabase
              .from("messages")
              .update({ read_at: new Date().toISOString() })
              .eq("id", payload.new.id)
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${activeConv}`,
        },
        (payload) => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === payload.new.id
                ? { ...m, read_at: payload.new.read_at }
                : m
            )
          )
        }
      )
      .subscribe()

    // Presence channel for online status + typing
    const presenceChannel = supabase.channel(`presence:${activeConv}`, {
      config: { presence: { key: userId } },
    })

    presenceChannel
      .on("presence", { event: "sync" }, () => {
        const state = presenceChannel.presenceState()
        const ids = new Set<string>()
        let typing = false
        for (const key of Object.keys(state)) {
          ids.add(key)
          const presences = state[key] as Array<{
            is_typing?: boolean
            user_id?: string
          }>
          for (const p of presences) {
            if (p.is_typing && p.user_id !== userId) {
              typing = true
            }
          }
        }
        setOnlineUsers(ids)
        setOthersTyping(typing)
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await presenceChannel.track({
            user_id: userId,
            is_typing: false,
            online_at: new Date().toISOString(),
          })
        }
      })

    presenceChannelRef.current = presenceChannel

    return () => {
      supabase.removeChannel(msgChannel)
      supabase.removeChannel(presenceChannel)
      presenceChannelRef.current = null
    }
  }, [activeConv, supabase, userId, fetchMessages, markAsRead])

  // --------------------------------------------------
  // Typing indicator broadcast
  // --------------------------------------------------
  function broadcastTyping(isTyping: boolean) {
    if (!presenceChannelRef.current) return
    presenceChannelRef.current.track({
      user_id: userId,
      is_typing: isTyping,
      online_at: new Date().toISOString(),
    })
  }

  function handleInputChange(value: string) {
    setNewMessage(value)
    broadcastTyping(true)
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = setTimeout(() => broadcastTyping(false), 2000)
  }

  // --------------------------------------------------
  // Send message
  // --------------------------------------------------
  async function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!newMessage.trim() || !activeConv) return

    broadcastTyping(false)

    await supabase.from("messages").insert({
      conversation_id: activeConv,
      sender_id: userId,
      content: newMessage.trim(),
      message_type: "text",
      attachments: [],
    })

    setNewMessage("")
  }

  // --------------------------------------------------
  // File upload
  // --------------------------------------------------
  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files || files.length === 0 || !activeConv) return

    setUploading(true)

    try {
      const attachments: Attachment[] = []

      for (const file of Array.from(files)) {
        const ext = file.name.split(".").pop()
        const filePath = `${userId}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`

        const { error } = await supabase.storage
          .from("message-attachments")
          .upload(filePath, file)

        if (error) {
          console.error("Upload error:", error)
          continue
        }

        const {
          data: { publicUrl },
        } = supabase.storage
          .from("message-attachments")
          .getPublicUrl(filePath)

        attachments.push({
          name: file.name,
          url: publicUrl,
          type: file.type,
          size: file.size,
        })
      }

      if (attachments.length === 0) return

      const isAllImages = attachments.every((a) => isImageMime(a.type))
      const messageType = isAllImages ? "image" : "file"

      await supabase.from("messages").insert({
        conversation_id: activeConv,
        sender_id: userId,
        content: isAllImages
          ? `${attachments.length} image${attachments.length > 1 ? "s" : ""}`
          : attachments.map((a) => a.name).join(", "),
        message_type: messageType,
        attachments,
      })
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  // --------------------------------------------------
  // Templates CRUD
  // --------------------------------------------------
  async function createTemplate() {
    if (!newTemplateName.trim() || !newTemplateContent.trim()) return
    await supabase.from("message_templates").insert({
      user_id: userId,
      name: newTemplateName.trim(),
      content: newTemplateContent.trim(),
    })
    setNewTemplateName("")
    setNewTemplateContent("")
    setTemplateDialogOpen(false)
    fetchTemplates()
  }

  async function deleteTemplate(id: string) {
    await supabase.from("message_templates").delete().eq("id", id)
    fetchTemplates()
  }

  function applyTemplate(content: string) {
    setNewMessage(content)
  }

  // --------------------------------------------------
  // Search filter
  // --------------------------------------------------
  const filteredMessages = useMemo(() => {
    if (!searchQuery.trim()) return messages
    const q = searchQuery.toLowerCase()
    return messages.filter((m) => m.content.toLowerCase().includes(q))
  }, [messages, searchQuery])

  // --------------------------------------------------
  // Active conversation metadata
  // --------------------------------------------------
  const activeConversation = conversations.find((c) => c.id === activeConv)
  const otherUserId = activeConversation?.other_user?.id
  const isOtherOnline = otherUserId ? onlineUsers.has(otherUserId) : false

  // --------------------------------------------------
  // Select conversation (with mobile support)
  // --------------------------------------------------
  function selectConversation(convId: string) {
    setActiveConv(convId)
    setMobileShowChat(true)
    setSearchOpen(false)
    setSearchQuery("")
  }

  // --------------------------------------------------
  // Render
  // --------------------------------------------------
  return (
    <div className="h-[calc(100vh-8rem)]">
      <h1 className="text-3xl font-bold mb-4 md:block hidden">Messages</h1>

      <div className="flex h-[calc(100%-3rem)] md:h-[calc(100%-3rem)] border rounded-lg overflow-hidden">
        {/* ========== Conversations sidebar ========== */}
        <div
          className={`w-full md:w-80 border-r bg-muted/30 shrink-0 ${
            mobileShowChat ? "hidden md:block" : "block"
          }`}
        >
          <div className="p-3 border-b md:hidden">
            <h1 className="text-xl font-bold">Messages</h1>
          </div>
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
                  onClick={() => selectConversation(conv.id)}
                  className={`w-full p-4 text-left border-b hover:bg-muted/50 transition-colors ${
                    activeConv === conv.id ? "bg-muted" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative shrink-0">
                      <Avatar className="h-10 w-10">
                        <AvatarImage
                          src={conv.other_user?.avatar_url || undefined}
                        />
                        <AvatarFallback>
                          {getInitials(conv.other_user?.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <OnlineDot
                        isOnline={
                          conv.other_user
                            ? onlineUsers.has(conv.other_user.id)
                            : false
                        }
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-sm truncate">
                          {conv.other_user?.full_name || "Utilisateur"}
                        </p>
                        {conv.unread_count > 0 && (
                          <Badge
                            variant="default"
                            className="ml-1 h-5 min-w-5 rounded-full px-1.5 text-[10px]"
                          >
                            {conv.unread_count}
                          </Badge>
                        )}
                      </div>
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

        {/* ========== Messages area ========== */}
        <div
          className={`flex-1 flex flex-col ${
            !mobileShowChat ? "hidden md:flex" : "flex"
          }`}
        >
          {activeConv && activeConversation ? (
            <>
              {/* ---- Chat header ---- */}
              <div className="flex items-center gap-3 border-b px-4 py-3">
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden shrink-0"
                  onClick={() => setMobileShowChat(false)}
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>

                <div className="relative shrink-0">
                  <Avatar className="h-9 w-9">
                    <AvatarImage
                      src={
                        activeConversation.other_user?.avatar_url || undefined
                      }
                    />
                    <AvatarFallback>
                      {getInitials(activeConversation.other_user?.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <OnlineDot isOnline={isOtherOnline} />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">
                    {activeConversation.other_user?.full_name || "Utilisateur"}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {isOtherOnline ? "En ligne" : "Hors ligne"} &middot;{" "}
                    {activeConversation.property?.title}
                  </p>
                </div>

                {/* Search toggle */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setSearchOpen(!searchOpen)
                    setSearchQuery("")
                  }}
                >
                  {searchOpen ? (
                    <X className="h-4 w-4" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {/* ---- Search bar ---- */}
              {searchOpen && (
                <div className="border-b px-4 py-2">
                  <Input
                    placeholder="Rechercher dans la conversation..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    autoFocus
                    className="h-8 text-sm"
                  />
                  {searchQuery && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {filteredMessages.length} resultat
                      {filteredMessages.length !== 1 ? "s" : ""}
                    </p>
                  )}
                </div>
              )}

              {/* ---- Messages list ---- */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-3">
                  {filteredMessages.map((msg) => {
                    const isOwn = msg.sender_id === userId

                    // System messages
                    if (msg.message_type === "system") {
                      return <SystemMessage key={msg.id} content={msg.content} />
                    }

                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[75%] sm:max-w-[70%] rounded-lg p-3 ${
                            isOwn
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          }`}
                        >
                          {!isOwn && msg.sender?.full_name && (
                            <p className="text-xs font-medium mb-1">
                              {msg.sender.full_name}
                            </p>
                          )}

                          {/* Text content */}
                          {msg.message_type === "text" && (
                            <p className="text-sm whitespace-pre-wrap break-words">
                              {msg.content}
                            </p>
                          )}

                          {/* Image/file content label */}
                          {(msg.message_type === "image" ||
                            msg.message_type === "file") && (
                              <p className="text-xs mb-1 opacity-80 flex items-center gap-1">
                                {msg.message_type === "image" ? (
                                  <ImageIcon className="h-3 w-3" />
                                ) : (
                                  <FileText className="h-3 w-3" />
                                )}
                                {msg.content}
                              </p>
                            )}

                          {/* Attachments */}
                          {msg.attachments &&
                            msg.attachments.length > 0 &&
                            msg.attachments.map((att, idx) => (
                              <AttachmentPreview
                                key={idx}
                                attachment={att}
                              />
                            ))}

                          {/* Footer: time + read receipt + translate button */}
                          <div
                            className={`flex items-center gap-1.5 mt-1 ${
                              isOwn
                                ? "text-primary-foreground/70 justify-end"
                                : "text-muted-foreground"
                            }`}
                          >
                            {/* Translate placeholder */}
                            {!isOwn && msg.message_type === "text" && (
                              <button
                                type="button"
                                onClick={() => {
                                  // Placeholder for Google Translate API integration
                                  alert(
                                    "Traduction automatique bientot disponible."
                                  )
                                }}
                                className="text-[10px] flex items-center gap-0.5 hover:underline"
                                title="Traduire ce message"
                              >
                                <Globe className="h-3 w-3" />
                                Traduire
                              </button>
                            )}
                            <span className="text-xs">
                              {format(new Date(msg.created_at), "HH:mm", {
                                locale: fr,
                              })}
                            </span>
                            <ReadReceipt isOwn={isOwn} readAt={msg.read_at} />
                          </div>
                        </div>
                      </div>
                    )
                  })}

                  {/* Typing indicator */}
                  {othersTyping && <TypingIndicator />}

                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* ---- Message input ---- */}
              <form
                onSubmit={sendMessage}
                className="p-3 border-t flex items-end gap-2"
              >
                {/* File upload (hidden input) */}
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleFileUpload}
                  accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip,.csv"
                />

                {/* Attachment button */}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="shrink-0"
                  disabled={uploading}
                  onClick={() => fileInputRef.current?.click()}
                  title="Joindre un fichier"
                >
                  <Paperclip className="h-4 w-4" />
                </Button>

                {/* Quick templates dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="shrink-0"
                      title="Reponses rapides"
                    >
                      <Zap className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent side="top" align="start" className="w-64">
                    <DropdownMenuLabel>Reponses rapides</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {templates.length === 0 ? (
                      <div className="px-2 py-3 text-xs text-center text-muted-foreground">
                        Aucun modele. Cliquez + pour en creer.
                      </div>
                    ) : (
                      templates.map((t) => (
                        <DropdownMenuItem
                          key={t.id}
                          onClick={() => applyTemplate(t.content)}
                        >
                          <div className="flex items-center gap-2 w-full">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-xs">{t.name}</p>
                              <p className="text-xs text-muted-foreground truncate">
                                {t.content}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                deleteTemplate(t.id)
                              }}
                              className="shrink-0 opacity-50 hover:opacity-100"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </DropdownMenuItem>
                      ))
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => setTemplateDialogOpen(true)}
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" />
                      Nouveau modele
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Text input */}
                <Input
                  value={newMessage}
                  onChange={(e) => handleInputChange(e.target.value)}
                  placeholder={
                    uploading
                      ? "Envoi en cours..."
                      : "Ecrivez votre message..."
                  }
                  disabled={uploading}
                  className="flex-1"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault()
                      sendMessage(e)
                    }
                  }}
                />

                {/* Send button */}
                <Button
                  type="submit"
                  size="icon"
                  disabled={!newMessage.trim() || uploading}
                  className="shrink-0"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Selectionnez une conversation</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ========== Create template dialog ========== */}
      <Dialog
        open={templateDialogOpen}
        onOpenChange={setTemplateDialogOpen}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nouveau modele de reponse</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Input
              placeholder="Nom du modele (ex: Bienvenue)"
              value={newTemplateName}
              onChange={(e) => setNewTemplateName(e.target.value)}
            />
            <Input
              placeholder="Contenu du message"
              value={newTemplateContent}
              onChange={(e) => setNewTemplateContent(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button
              onClick={createTemplate}
              disabled={!newTemplateName.trim() || !newTemplateContent.trim()}
            >
              Creer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
