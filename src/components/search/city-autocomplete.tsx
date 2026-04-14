"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { MapPin } from "lucide-react"
import { cn } from "@/lib/utils"

interface CityResult {
  city: string
  country: string
}

interface CityAutocompleteProps {
  name?: string
  defaultValue?: string
  placeholder?: string
  className?: string
  onSelect?: (city: string) => void
}

export function CityAutocomplete({
  name = "city",
  defaultValue = "",
  placeholder = "Où allez-vous ?",
  className,
  onSelect,
}: CityAutocompleteProps) {
  const [query, setQuery] = useState(defaultValue)
  const [results, setResults] = useState<CityResult[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [isLoading, setIsLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchCities = useCallback(async (search: string) => {
    if (search.trim().length < 1) {
      setResults([])
      setIsOpen(false)
      return
    }

    setIsLoading(true)
    const supabase = createClient()

    const { data } = await supabase
      .from("properties")
      .select("city, country")
      .eq("status", "published")
      .ilike("city", `%${search}%`)
      .not("city", "is", null)
      .limit(50)

    if (data) {
      // Deduplicate by city+country
      const unique = new Map<string, CityResult>()
      for (const row of data) {
        if (row.city) {
          const key = `${row.city}|${row.country || ""}`
          if (!unique.has(key)) {
            unique.set(key, { city: row.city, country: row.country || "" })
          }
        }
      }
      const sorted = Array.from(unique.values()).sort((a, b) =>
        a.city.localeCompare(b.city)
      )
      setResults(sorted)
      setIsOpen(sorted.length > 0)
    } else {
      setResults([])
      setIsOpen(false)
    }
    setIsLoading(false)
  }, [])

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      fetchCities(query)
    }, 300)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query, fetchCities])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  function selectCity(city: CityResult) {
    setQuery(city.city)
    setIsOpen(false)
    setActiveIndex(-1)
    onSelect?.(city.city)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!isOpen) return

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault()
        setActiveIndex((prev) =>
          prev < results.length - 1 ? prev + 1 : 0
        )
        break
      case "ArrowUp":
        e.preventDefault()
        setActiveIndex((prev) =>
          prev > 0 ? prev - 1 : results.length - 1
        )
        break
      case "Enter":
        e.preventDefault()
        if (activeIndex >= 0 && activeIndex < results.length) {
          selectCity(results[activeIndex])
        }
        break
      case "Escape":
        setIsOpen(false)
        setActiveIndex(-1)
        break
    }
  }

  // Scroll active item into view
  useEffect(() => {
    if (activeIndex >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll("[data-city-item]")
      items[activeIndex]?.scrollIntoView({ block: "nearest" })
    }
  }, [activeIndex])

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <input type="hidden" name={name} value={query} />
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setActiveIndex(-1)
          }}
          onFocus={() => {
            if (results.length > 0) setIsOpen(true)
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoComplete="off"
          className={cn(
            "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 pl-10 text-base shadow-xs transition-[color,box-shadow] outline-none",
            "file:border-0 file:bg-transparent file:text-sm file:font-medium",
            "placeholder:text-muted-foreground",
            "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "md:text-sm"
          )}
          role="combobox"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-autocomplete="list"
          aria-activedescendant={
            activeIndex >= 0 ? `city-option-${activeIndex}` : undefined
          }
        />
      </div>

      {isOpen && (
        <ul
          ref={listRef}
          role="listbox"
          className="absolute z-50 mt-1 w-full max-h-60 overflow-auto rounded-md border bg-popover p-1 shadow-md animate-in fade-in-0 zoom-in-95"
        >
          {isLoading ? (
            <li className="px-3 py-2 text-sm text-muted-foreground">
              Recherche...
            </li>
          ) : (
            results.map((city, index) => (
              <li
                key={`${city.city}-${city.country}`}
                id={`city-option-${index}`}
                data-city-item
                role="option"
                aria-selected={index === activeIndex}
                className={cn(
                  "flex items-center gap-2 rounded-sm px-3 py-2 text-sm cursor-pointer transition-colors",
                  index === activeIndex
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-accent/50"
                )}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => selectCity(city)}
              >
                <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="font-medium">{city.city}</span>
                {city.country && (
                  <span className="text-muted-foreground text-xs">
                    {city.country}
                  </span>
                )}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  )
}
