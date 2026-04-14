"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Share2,
  Copy,
  Check,
  MessageCircle,
  ExternalLink,
  Share,
} from "lucide-react"

interface ShareButtonProps {
  title: string
  className?: string
}

export function ShareButton({ title, className }: ShareButtonProps) {
  const [copied, setCopied] = useState(false)

  function getUrl() {
    return typeof window !== "undefined" ? window.location.href : ""
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(getUrl())
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback
      const textarea = document.createElement("textarea")
      textarea.value = getUrl()
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand("copy")
      document.body.removeChild(textarea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  function shareWhatsApp() {
    const url = `https://wa.me/?text=${encodeURIComponent(`${title} - ${getUrl()}`)}`
    window.open(url, "_blank", "noopener,noreferrer")
  }

  function shareFacebook() {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(getUrl())}`
    window.open(url, "_blank", "noopener,noreferrer,width=600,height=400")
  }

  function shareTwitter() {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(getUrl())}`
    window.open(url, "_blank", "noopener,noreferrer,width=600,height=400")
  }

  async function nativeShare() {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          url: getUrl(),
        })
      } catch {
        // User cancelled or error
      }
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className={className}>
          <Share2 className="h-4 w-4 mr-2" />
          Partager
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem onClick={copyLink}>
          {copied ? (
            <Check className="mr-2 h-4 w-4 text-green-600" />
          ) : (
            <Copy className="mr-2 h-4 w-4" />
          )}
          {copied ? "Lien copié !" : "Copier le lien"}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={shareWhatsApp}>
          <MessageCircle className="mr-2 h-4 w-4" />
          WhatsApp
        </DropdownMenuItem>
        <DropdownMenuItem onClick={shareFacebook}>
          <ExternalLink className="mr-2 h-4 w-4" />
          Facebook
        </DropdownMenuItem>
        <DropdownMenuItem onClick={shareTwitter}>
          <ExternalLink className="mr-2 h-4 w-4" />
          Twitter / X
        </DropdownMenuItem>
        {typeof navigator !== "undefined" && "share" in navigator && (
          <DropdownMenuItem onClick={nativeShare}>
            <Share className="mr-2 h-4 w-4" />
            Plus d&apos;options...
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
