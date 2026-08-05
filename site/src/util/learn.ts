import type { Course, LearnEvent } from '../content.config'

/**
 * Pure selection/format helpers for the /learn/ page. All date logic treats
 * dates as UTC calendar dates (YAML dates parse as UTC midnight) and runs at
 * build time — "today" is always passed in explicitly so behavior is testable.
 */

const MS_PER_DAY = 24 * 60 * 60 * 1000

function startOfUtcDay(date: Date): number {
  return Math.floor(date.getTime() / MS_PER_DAY) * MS_PER_DAY
}

/** Events not yet over (end date — or start date — is today or later), soonest first. */
export function upcomingEvents(events: LearnEvent[], today: Date): LearnEvent[] {
  const cutoff = startOfUtcDay(today)
  return events
    .filter((e) => startOfUtcDay(e.endDate ?? e.startDate) >= cutoff)
    .sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
}

/** Headliner for the events poster: soonest featured upcoming event, else soonest upcoming. */
export function posterEvent(events: LearnEvent[], today: Date): LearnEvent | undefined {
  const upcoming = upcomingEvents(events, today)
  return upcoming.find((e) => e.featured) ?? upcoming[0]
}

/** The hero ticker shows the next few events. */
export function tickerEvents(events: LearnEvent[], today: Date, limit = 3): LearnEvent[] {
  return upcomingEvents(events, today).slice(0, limit)
}

/** Sort courses by their catalog number ascending. */
export function sortCourses(courses: Course[]): Course[] {
  return [...courses].sort((a, b) => a.number - b.number)
}

/** The course spotlighted at the top of the Courses section. */
export function featuredCourse(courses: Course[]): Course | undefined {
  return sortCourses(courses).find((c) => c.status === 'available')
}

/** Courses shown as shelf slots below the featured course — everything except the featured course itself. */
export function shelfCourses(courses: Course[], featured: Course | undefined): Course[] {
  return sortCourses(courses).filter((c) => c !== featured)
}

/** Format a Date as an ISO-8601 date string (YYYY-MM-DD, UTC). */
export function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

const MONTH = new Intl.DateTimeFormat('en-US', { month: 'short', timeZone: 'UTC' })

/** "Jan 20", "Dec 1–5" (same month), or "Nov 30 – Dec 2" (cross-month). */
export function formatEventDate(event: LearnEvent): string {
  const start = `${MONTH.format(event.startDate)} ${event.startDate.getUTCDate()}`
  if (!event.endDate || toIsoDate(event.endDate) === toIsoDate(event.startDate)) {
    return start
  }
  const sameMonth =
    event.startDate.getUTCMonth() === event.endDate.getUTCMonth() &&
    event.startDate.getUTCFullYear() === event.endDate.getUTCFullYear()
  return sameMonth
    ? `${start}–${event.endDate.getUTCDate()}`
    : `${start} – ${MONTH.format(event.endDate)} ${event.endDate.getUTCDate()}`
}
