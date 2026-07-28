import { describe, it, expect } from 'vitest'
import {
  upcomingEvents,
  posterEvent,
  tickerEvents,
  sortCourses,
  featuredCourse,
  shelfCourses,
  formatEventDate,
} from '../src/util/learn'
import type { Course, LearnEvent } from '../src/content.config'

const TODAY = new Date('2026-07-21T00:00:00Z')

function makeEvent(overrides: Partial<LearnEvent>): LearnEvent {
  return {
    title: 'Event',
    startDate: new Date('2026-12-01T00:00:00Z'),
    location: 'Somewhere',
    featured: false,
    ...overrides,
  }
}

function makeCourse(overrides: Partial<Course>): Course {
  return {
    title: 'Course',
    number: 1,
    status: 'available',
    description: 'A course',
    href: '/community/learning/',
    ...overrides,
  }
}

describe('upcomingEvents', () => {
  it('excludes past events and sorts ascending by start date', () => {
    const past = makeEvent({ title: 'Past', startDate: new Date('2026-01-10T00:00:00Z') })
    const near = makeEvent({ title: 'Near', startDate: new Date('2026-08-01T00:00:00Z') })
    const far = makeEvent({ title: 'Far', startDate: new Date('2026-12-01T00:00:00Z') })
    expect(upcomingEvents([far, past, near], TODAY).map((e) => e.title)).toEqual(['Near', 'Far'])
  })

  it('includes an event happening today', () => {
    const today = makeEvent({ title: 'Today', startDate: new Date('2026-07-21T00:00:00Z') })
    expect(upcomingEvents([today], TODAY)).toHaveLength(1)
  })

  it('includes a multi-day event still in progress', () => {
    const inProgress = makeEvent({
      title: 'InProgress',
      startDate: new Date('2026-07-19T00:00:00Z'),
      endDate: new Date('2026-07-23T00:00:00Z'),
    })
    expect(upcomingEvents([inProgress], TODAY)).toHaveLength(1)
  })

  it('returns empty array for no events', () => {
    expect(upcomingEvents([], TODAY)).toEqual([])
  })
})

describe('posterEvent', () => {
  it('prefers the soonest featured upcoming event', () => {
    const soon = makeEvent({ title: 'Soon', startDate: new Date('2026-08-01T00:00:00Z') })
    const featured = makeEvent({
      title: 'Featured',
      startDate: new Date('2026-12-01T00:00:00Z'),
      featured: true,
    })
    expect(posterEvent([soon, featured], TODAY)?.title).toBe('Featured')
  })

  it('falls back to the soonest upcoming event when none are featured', () => {
    const soon = makeEvent({ title: 'Soon', startDate: new Date('2026-08-01T00:00:00Z') })
    const later = makeEvent({ title: 'Later', startDate: new Date('2026-09-01T00:00:00Z') })
    expect(posterEvent([later, soon], TODAY)?.title).toBe('Soon')
  })

  it('ignores featured events that already ended', () => {
    const pastFeatured = makeEvent({
      title: 'PastFeatured',
      startDate: new Date('2026-01-10T00:00:00Z'),
      featured: true,
    })
    const soon = makeEvent({ title: 'Soon', startDate: new Date('2026-08-01T00:00:00Z') })
    expect(posterEvent([pastFeatured, soon], TODAY)?.title).toBe('Soon')
  })

  it('returns undefined when nothing is upcoming', () => {
    expect(posterEvent([], TODAY)).toBeUndefined()
  })
})

describe('tickerEvents', () => {
  it('caps at 3 by default', () => {
    const events = [8, 9, 10, 11].map((m) =>
      makeEvent({ title: `E${m}`, startDate: new Date(`2026-${String(m).padStart(2, '0')}-01T00:00:00Z`) })
    )
    expect(tickerEvents(events, TODAY).map((e) => e.title)).toEqual(['E8', 'E9', 'E10'])
  })
})

describe('course selection', () => {
  it('sortCourses orders by number', () => {
    const c2 = makeCourse({ title: 'Two', number: 2 })
    const c1 = makeCourse({ title: 'One', number: 1 })
    expect(sortCourses([c2, c1]).map((c) => c.title)).toEqual(['One', 'Two'])
  })

  it('featuredCourse picks the lowest-numbered available course', () => {
    const dev = makeCourse({ title: 'Dev', number: 1, status: 'in-development' })
    const avail = makeCourse({ title: 'Avail', number: 2, status: 'available' })
    expect(featuredCourse([dev, avail])?.title).toBe('Avail')
  })

  it('featuredCourse returns undefined with no available courses', () => {
    const dev = makeCourse({ status: 'in-development' })
    expect(featuredCourse([dev])).toBeUndefined()
  })

  it('shelfCourses returns non-available courses in order', () => {
    const avail = makeCourse({ title: 'Avail', number: 1, status: 'available' })
    const proposed = makeCourse({ title: 'Proposed', number: 3, status: 'proposed' })
    const dev = makeCourse({ title: 'Dev', number: 2, status: 'in-development' })
    expect(shelfCourses([avail, proposed, dev]).map((c) => c.title)).toEqual(['Dev', 'Proposed'])
  })
})

describe('formatEventDate', () => {
  it('formats a single-day event', () => {
    expect(formatEventDate(makeEvent({ startDate: new Date('2027-01-20T00:00:00Z') }))).toBe('Jan 20')
  })

  it('formats a same-month range with an en dash', () => {
    const e = makeEvent({
      startDate: new Date('2026-12-01T00:00:00Z'),
      endDate: new Date('2026-12-05T00:00:00Z'),
    })
    expect(formatEventDate(e)).toBe('Dec 1–5')
  })

  it('formats a cross-month range with both months', () => {
    const e = makeEvent({
      startDate: new Date('2026-11-30T00:00:00Z'),
      endDate: new Date('2026-12-02T00:00:00Z'),
    })
    expect(formatEventDate(e)).toBe('Nov 30 – Dec 2')
  })
})
