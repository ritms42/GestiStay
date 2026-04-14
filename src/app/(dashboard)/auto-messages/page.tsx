import { AutoMessages } from "@/components/messaging/auto-messages"
import { BotMessageSquare } from "lucide-react"

export const metadata = { title: "Messages automatiques" }

export default function AutoMessagesPage() {
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3">
          <BotMessageSquare className="h-7 w-7 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Messages automatiques</h1>
            <p className="text-muted-foreground text-sm">
              Configurez des messages envoyés automatiquement à vos voyageurs
              avant, pendant et après leur séjour.
            </p>
          </div>
        </div>
      </div>

      <AutoMessages />
    </div>
  )
}
