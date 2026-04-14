"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, ChevronLeft, ChevronRight, Loader2 } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  addMonths,
  subMonths,
  getDay,
  isSameMonth,
  isToday,
  isBefore,
  startOfDay,
} from "date-fns"
import { fr } from "date-fns/locale"

type DayStatus = "available" | "blocked" | "booked"

export default function CalendarPage() {
  const { id } = useParams<{ id: string }>()
  const supabase = createClient()
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [availability, setAvailability] = useState<
    Record<string, { status: DayStatus; booking_id?: string }>
  >({})
  const [selectedDates, setSelectedDates] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const fetchAvailability = useCallback(async () => {
    const start = format(startOfMonth(currentMonth), "yyyy-MM-dd")
    const end = format(endOfMonth(addMonths(currentMonth, 1)), "yyyy-MM-dd")

    const { data } = await supabase
      .from("availability")
      .select("*")
      .eq("property_id", id)
      .gte("date", start)
      .lte("date", end)

    const map: Record<string, { status: DayStatus; booking_id?: string }> = {}
    data?.forEach((d) => {
      map[d.date] = { status: d.status, booking_id: d.booking_id }
    })
    setAvailability(map)
  }, [id, currentMonth, supabase])

  useEffect(() => {
    fetchAvailability()
  }, [fetchAvailability])

  function toggleDate(dateStr: string) {
    if (availability[dateStr]?.status === "booked") return
    setSelectedDates((prev) =>
      prev.includes(dateStr)
        ? prev.filter((d) => d !== dateStr)
        : [...prev, dateStr]
    )
  }

  async function blockDates() {
    if (selectedDates.length === 0) return
    setLoading(true)
    try {
      const rows = selectedDates.map((date) => ({
        property_id: id,
        date,
        status: "blocked" as const,
      }))

      await supabase.from("availability").upsert(rows, {
        onConflict: "property_id,date",
      })

      toast.success(`${selectedDates.length} date(s) bloquée(s)`)
      setSelectedDates([])
      fetchAvailability()
    } catch {
      toast.error("Erreur")
    } finally {
      setLoading(false)
    }
  }

  async function unblockDates() {
    if (selectedDates.length === 0) return
    setLoading(true)
    try {
      for (const date of selectedDates) {
        await supabase
          .from("availability")
          .delete()
          .eq("property_id", id)
          .eq("date", date)
          .eq("status", "blocked")
      }
      toast.success(`${selectedDates.length} date(s) débloquée(s)`)
      setSelectedDates([])
      fetchAvailability()
    } catch {
      toast.error("Erreur")
    } finally {
      setLoading(false)
    }
  }

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  })

  const startDayOfWeek = (getDay(startOfMonth(currentMonth)) + 6) % 7 // Monday = 0

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/properties/${id}`}>
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Calendrier</h1>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <CardTitle className="capitalize">
            {format(currentMonth, "MMMM yyyy", { locale: fr })}
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </CardHeader>
        <CardContent>
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((d) => (
              <div
                key={d}
                className="text-center text-xs font-medium text-muted-foreground py-2"
              >
                {d}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Empty cells for offset */}
            {Array.from({ length: startDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}

            {days.map((day) => {
              const dateStr = format(day, "yyyy-MM-dd")
              const dayAvail = availability[dateStr]
              const isSelected = selectedDates.includes(dateStr)
              const isPast = isBefore(day, startOfDay(new Date()))
              const isBooked = dayAvail?.status === "booked"
              const isBlocked = dayAvail?.status === "blocked"

              return (
                <button
                  key={dateStr}
                  type="button"
                  disabled={isPast || isBooked}
                  onClick={() => toggleDate(dateStr)}
                  className={`
                    aspect-square flex items-center justify-center rounded-lg text-sm font-medium transition-colors
                    ${isPast ? "text-muted-foreground/30 cursor-not-allowed" : ""}
                    ${isBooked ? "bg-blue-100 text-blue-800 cursor-not-allowed" : ""}
                    ${isBlocked && !isSelected ? "bg-red-100 text-red-800" : ""}
                    ${isSelected ? "bg-primary text-primary-foreground" : ""}
                    ${!isPast && !isBooked && !isBlocked && !isSelected ? "hover:bg-muted cursor-pointer" : ""}
                    ${isToday(day) && !isSelected ? "ring-2 ring-primary" : ""}
                  `}
                >
                  {format(day, "d")}
                </button>
              )
            })}
          </div>

          {/* Legend */}
          <div className="flex gap-4 mt-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-blue-100" /> Réservé
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-red-100" /> Bloqué
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-primary" /> Sélectionné
            </span>
          </div>
        </CardContent>
      </Card>

      {selectedDates.length > 0 && (
        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={() => setSelectedDates([])}>
            Annuler la sélection ({selectedDates.length})
          </Button>
          <Button variant="destructive" onClick={blockDates} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Bloquer
          </Button>
          <Button variant="outline" onClick={unblockDates} disabled={loading}>
            Débloquer
          </Button>
        </div>
      )}
    </div>
  )
}
