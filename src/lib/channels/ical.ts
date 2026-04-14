export interface IcalEvent {
  uid: string
  summary: string
  start: Date
  end: Date
}

// Unfold lines per RFC 5545: lines beginning with a space or tab continue the previous line
function unfoldLines(text: string): string[] {
  const rawLines = text.replace(/\r\n/g, "\n").split("\n")
  const lines: string[] = []
  for (const line of rawLines) {
    if ((line.startsWith(" ") || line.startsWith("\t")) && lines.length > 0) {
      lines[lines.length - 1] += line.slice(1)
    } else {
      lines.push(line)
    }
  }
  return lines
}

// Parse a DATE or DATE-TIME value into a Date.
// Supports: 20260315, 20260315T120000, 20260315T120000Z
function parseIcalDate(value: string): Date | null {
  const v = value.trim()
  // DATE (YYYYMMDD)
  const dateMatch = v.match(/^(\d{4})(\d{2})(\d{2})$/)
  if (dateMatch) {
    const [, y, m, d] = dateMatch
    return new Date(Date.UTC(Number(y), Number(m) - 1, Number(d)))
  }
  // DATE-TIME (YYYYMMDDTHHMMSS with optional Z)
  const dtMatch = v.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z?)$/)
  if (dtMatch) {
    const [, y, mo, d, h, mi, s, z] = dtMatch
    if (z === "Z") {
      return new Date(
        Date.UTC(
          Number(y),
          Number(mo) - 1,
          Number(d),
          Number(h),
          Number(mi),
          Number(s)
        )
      )
    }
    return new Date(
      Number(y),
      Number(mo) - 1,
      Number(d),
      Number(h),
      Number(mi),
      Number(s)
    )
  }
  return null
}

function unescapeText(value: string): string {
  return value
    .replace(/\\n/gi, "\n")
    .replace(/\\,/g, ",")
    .replace(/\\;/g, ";")
    .replace(/\\\\/g, "\\")
}

// Parse an ICS text into events.
export function parseIcal(icsText: string): IcalEvent[] {
  const lines = unfoldLines(icsText)
  const events: IcalEvent[] = []
  let inEvent = false
  let cur: Partial<IcalEvent> = {}

  for (const line of lines) {
    if (line === "BEGIN:VEVENT") {
      inEvent = true
      cur = {}
      continue
    }
    if (line === "END:VEVENT") {
      if (
        inEvent &&
        cur.uid &&
        cur.start instanceof Date &&
        cur.end instanceof Date
      ) {
        events.push({
          uid: cur.uid,
          summary: cur.summary ?? "",
          start: cur.start,
          end: cur.end,
        })
      }
      inEvent = false
      cur = {}
      continue
    }
    if (!inEvent) continue

    // Split property name (with params) from value
    const colonIdx = line.indexOf(":")
    if (colonIdx === -1) continue
    const rawName = line.slice(0, colonIdx)
    const value = line.slice(colonIdx + 1)
    // Property name is before any ';'
    const semiIdx = rawName.indexOf(";")
    const propName = (semiIdx === -1 ? rawName : rawName.slice(0, semiIdx))
      .toUpperCase()
      .trim()

    if (propName === "UID") {
      cur.uid = value.trim()
    } else if (propName === "SUMMARY") {
      cur.summary = unescapeText(value)
    } else if (propName === "DTSTART") {
      const d = parseIcalDate(value)
      if (d) cur.start = d
    } else if (propName === "DTEND") {
      const d = parseIcalDate(value)
      if (d) cur.end = d
    }
  }

  return events
}

function pad2(n: number): string {
  return n < 10 ? "0" + n : "" + n
}

function formatDateOnly(d: Date): string {
  return (
    d.getUTCFullYear().toString() +
    pad2(d.getUTCMonth() + 1) +
    pad2(d.getUTCDate())
  )
}

function formatDateTimeUTC(d: Date): string {
  return (
    d.getUTCFullYear().toString() +
    pad2(d.getUTCMonth() + 1) +
    pad2(d.getUTCDate()) +
    "T" +
    pad2(d.getUTCHours()) +
    pad2(d.getUTCMinutes()) +
    pad2(d.getUTCSeconds()) +
    "Z"
  )
}

function escapeText(s: string): string {
  return s
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;")
}

// Fold long lines to 75 octets (approximation using chars)
function foldLine(line: string): string {
  if (line.length <= 75) return line
  const parts: string[] = []
  let remaining = line
  parts.push(remaining.slice(0, 75))
  remaining = remaining.slice(75)
  while (remaining.length > 0) {
    parts.push(" " + remaining.slice(0, 74))
    remaining = remaining.slice(74)
  }
  return parts.join("\r\n")
}

// Generate an ICS file for a property's blocked/booked dates.
export function generateIcal(
  events: Array<{
    uid: string
    summary: string
    start: Date
    end: Date
  }>,
  calendarName: string
): string {
  const now = formatDateTimeUTC(new Date())
  const lines: string[] = []
  lines.push("BEGIN:VCALENDAR")
  lines.push("VERSION:2.0")
  lines.push("PRODID:-//GestiStay//Channel Manager//EN")
  lines.push("CALSCALE:GREGORIAN")
  lines.push("METHOD:PUBLISH")
  lines.push(foldLine("X-WR-CALNAME:" + escapeText(calendarName)))

  for (const e of events) {
    lines.push("BEGIN:VEVENT")
    lines.push(foldLine("UID:" + e.uid))
    lines.push("DTSTAMP:" + now)
    lines.push("DTSTART;VALUE=DATE:" + formatDateOnly(e.start))
    lines.push("DTEND;VALUE=DATE:" + formatDateOnly(e.end))
    lines.push(foldLine("SUMMARY:" + escapeText(e.summary)))
    lines.push("TRANSP:OPAQUE")
    lines.push("END:VEVENT")
  }

  lines.push("END:VCALENDAR")
  return lines.join("\r\n") + "\r\n"
}
