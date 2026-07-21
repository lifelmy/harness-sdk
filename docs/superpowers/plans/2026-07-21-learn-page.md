# Learn Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A top-level `/learn/` editorial landing page on the Strands docs site featuring courses, deep dives, events, and blog picks, per the approved spec at `docs/superpowers/specs/2026-07-21-learn-page-design.md` and visual mockup at `.superpowers/brainstorm/22280-1784580415/content/learn-hub-v3.html`.

**Architecture:** New Astro page `site/src/pages/learn.astro` on the existing `LandingLayout` (Starlight header, no sidebar). Data comes from two new content collections (`courses`, `events` — YAML entries, zod-validated), a deep-dives config array in `src/config/learn.ts`, and live blog posts via `getPublishedPosts()`. Pure-logic selection helpers live in `src/util/learn.ts` (unit-testable without Astro). Section components under `src/components/learn/` receive data as typed props from the page.

**Tech Stack:** Astro 7 + Starlight, TypeScript, zod (via `astro/zod`), vitest, YAML content entries. All art is CSS/SVG — no raster assets.

## Global Constraints

- All work happens under `site/` in the monorepo; run npm commands from `site/`.
- Prettier style: no semicolons, single quotes, 120-char lines, 2-space indent, ES5 trailing commas.
- Comments explain WHAT/WHY, never how code changed ("evergreen comments" rule from AGENTS.md).
- The page must respect `prefers-reduced-motion: reduce` for all animation.
- Placeholder content policy (from spec): no invented event dates or fake course names ship. Initial data entries use real content where known (the 14 lesson titles from the deployed course) and omit anything unknown (no per-lesson durations, no fabricated future courses).
- Lesson URLs point at `/community/learning/lesson{N}-{slug}/` (the deployed course's URL scheme). These pages don't exist in this repo yet; this branch merges after/alongside the lessons PR.
- The site builds with `npm run build`; quality gate is `npm test`, `npm run typecheck`, `npm run format:check`.
- Commit style: conventional commits.
- Note: `npm test` requires a populated `.astro/data-store.json`; the vitest global-setup boots `astro dev` once automatically if missing (takes ~60s the first time).

## File Structure

```
site/src/
├── content.config.ts                    # MODIFY: add courses + events collections
├── content/
│   ├── courses/agent-fundamentals.yaml  # CREATE: flagship course entry
│   └── events/.gitkeep                  # CREATE: empty events dir (entries added when real events known)
├── config/
│   ├── learn.ts                         # CREATE: deep dives array + pinned blog slugs
│   └── navigation.yml                   # MODIFY: add Learn navbar item
├── util/
│   └── learn.ts                         # CREATE: pure selection/sorting helpers
├── pages/
│   └── learn.astro                      # CREATE: the page (loads collections, composes sections)
└── components/learn/
    ├── LearnHero.astro                  # CREATE: masthead + strand curves + anchor links
    ├── EventsTicker.astro               # CREATE: slim upcoming-events strip
    ├── CoursesSection.astro             # CREATE: featured course + cover art + syllabus + shelf
    ├── DeepDivesSection.astro           # CREATE: numbered editorial list w/ SVG thumbs
    ├── EventsPoster.astro               # CREATE: green sticky poster
    ├── BlogSection.astro                # CREATE: 3-col editorial blog row
    └── KeepGoingStrip.astro             # CREATE: footer links strip
site/test/
└── learn.test.ts                        # CREATE: unit tests for util/learn.ts
```

---

### Task 1: Content collections for courses and events

**Files:**
- Modify: `site/src/content.config.ts`
- Create: `site/src/content/courses/agent-fundamentals.yaml`
- Create: `site/src/content/events/.gitkeep`
- Test: `site/test/content-collection.test.ts` is the existing pattern but collection loading is exercised via `astro build`/dev sync; schema validation is checked in this task by building.

**Interfaces:**
- Produces: `courses` collection — entries with `data: { title: string, number: number, status: 'available'|'in-development'|'proposed', description: string, href: string, syllabusHref?: string, duration?: string, languages?: string[], lessons?: Array<{ number: number, title: string, href: string, duration?: string }> }`
- Produces: `events` collection — entries with `data: { title: string, startDate: Date, endDate?: Date, location: string, format: 'in-person'|'virtual', href?: string, description?: string, featured: boolean }`
- Produces: exported zod schemas `courseSchema`, `eventSchema` and types `Course`, `LearnEvent` from `content.config.ts`

- [ ] **Step 1: Add schemas and collections to `content.config.ts`**

In `site/src/content.config.ts`, after the `blogSchema` definition (before `export const collections`), add:

```typescript
export const courseSchema = z.object({
  title: z.string(),
  // Position in the course catalog; drives ordering and the "Course № N" kicker
  number: z.number().int().positive(),
  status: z.enum(['available', 'in-development', 'proposed']),
  description: z.string(),
  // Entry URL for the course (first lesson or course index)
  href: z.string(),
  syllabusHref: z.string().optional(),
  // Human-readable total, e.g. "~6 hours"
  duration: z.string().optional(),
  languages: z.array(z.string()).optional(),
  lessons: z
    .array(
      z.object({
        number: z.number().int().positive(),
        title: z.string(),
        href: z.string(),
        duration: z.string().optional(),
      })
    )
    .optional(),
})
export type Course = z.infer<typeof courseSchema>

export const eventSchema = z.object({
  title: z.string(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional(),
  location: z.string(),
  format: z.enum(['in-person', 'virtual']),
  href: z.string().optional(),
  description: z.string().optional(),
  // The events poster headlines the soonest featured upcoming event
  featured: z.boolean().default(false),
})
export type LearnEvent = z.infer<typeof eventSchema>
```

Then add two entries to the `collections` object (after `testimonials`):

```typescript
  courses: defineCollection({
    loader: glob({
      base: 'src/content/courses',
      pattern: '**/*.{yml,yaml}',
    }),
    schema: courseSchema,
  }),
  events: defineCollection({
    loader: glob({
      base: 'src/content/events',
      pattern: '**/*.{yml,yaml}',
    }),
    schema: eventSchema,
  }),
```

- [ ] **Step 2: Create the flagship course entry**

Create `site/src/content/courses/agent-fundamentals.yaml`:

```yaml
title: Agent Fundamentals with Strands
number: 1
status: available
description: >-
  Fourteen lessons, one production agent. Build up from the agent loop through
  tools, hooks, steering, memory, and multi-agent patterns — then deploy and
  evaluate it.
href: /community/learning/lesson1-how-agents-really-work/
duration: ~6 hours
languages:
  - Python
  - TypeScript
lessons:
  - number: 1
    title: How agents really work
    href: /community/learning/lesson1-how-agents-really-work/
  - number: 2
    title: Switching model providers
    href: /community/learning/lesson2-switching-model-providers/
  - number: 3
    title: Give your agent tools using MCP
    href: /community/learning/lesson3-give-your-agent-tools-using-mcp/
  - number: 4
    title: Adding callbacks & response streaming
    href: /community/learning/lesson4-adding-callbacks-and-response-streaming/
  - number: 5
    title: Control your agent with hooks
    href: /community/learning/lesson5-control-your-agent-with-hooks/
  - number: 6
    title: Agent plugins & skills
    href: /community/learning/lesson6-agent-plugins-and-skills/
  - number: 7
    title: Improve agent reliability with Strands steering
    href: /community/learning/lesson7-improve-agent-reliability-with-strands-steering/
  - number: 8
    title: Context engineering & conversation management
    href: /community/learning/lesson8-context-engineering-and-conversation-management/
  - number: 9
    title: Persistent memory with session managers
    href: /community/learning/lesson9-persistent-memory-with-session-managers/
  - number: 10
    title: 'Multi-agent patterns: agents as tools'
    href: /community/learning/lesson10-multi-agent-patterns-agents-as-tools/
  - number: 11
    title: 'Multi-agent patterns: graph workflows'
    href: /community/learning/lesson11-multi-agent-patterns-graph-workflows/
  - number: 12
    title: 'Multi-agent patterns: agent swarms'
    href: /community/learning/lesson12-multi-agent-patterns-agent-swarms/
  - number: 13
    title: Evaluating agents
    href: /community/learning/lesson13-evaluating-agents/
  - number: 14
    title: Deploying agents to the cloud
    href: /community/learning/lesson14-deploying-agents-to-the-cloud/
```

Create empty `site/src/content/events/.gitkeep` (empty file — real events get added by the team as YAML entries; the page must degrade gracefully with zero events, which Task 2's helpers and Task 5's components handle).

- [ ] **Step 3: Verify the collections load**

Run from `site/`:

```bash
rm -rf .astro && npx astro sync
```

Expected: exits 0, no zod errors. Then verify the course entry parsed by checking the data store:

```bash
grep -o 'agent-fundamentals' .astro/data-store.json | head -1
```

Expected output: `agent-fundamentals`

- [ ] **Step 4: Commit**

```bash
git add site/src/content.config.ts site/src/content/courses/agent-fundamentals.yaml site/src/content/events/.gitkeep
git commit -m "feat(site): add courses and events content collections"
```

---

### Task 2: Learn data helpers (`util/learn.ts`) — TDD

**Files:**
- Create: `site/src/util/learn.ts`
- Test: `site/test/learn.test.ts`

**Interfaces:**
- Consumes: `Course`, `LearnEvent` types from `../src/content.config` (Task 1).
- Produces (all pure functions, no Astro imports — testable directly):
  - `upcomingEvents(events: LearnEvent[], today: Date): LearnEvent[]` — events whose `endDate ?? startDate` is >= start-of-day `today`, sorted by `startDate` ascending.
  - `posterEvent(events: LearnEvent[], today: Date): LearnEvent | undefined` — first `featured` upcoming event, else soonest upcoming, else `undefined`.
  - `tickerEvents(events: LearnEvent[], today: Date, limit?: number): LearnEvent[]` — first `limit` (default 3) upcoming events.
  - `sortCourses(courses: Course[]): Course[]` — by `number` ascending.
  - `featuredCourse(courses: Course[]): Course | undefined` — lowest-numbered course with `status === 'available'`.
  - `shelfCourses(courses: Course[]): Course[]` — non-available courses, by `number` ascending.
  - `formatEventDate(event: LearnEvent): string` — "Dec 1–5" for multi-day (same month), "Dec 1 – Jan 3" cross-month, "Jan 20" single day. Uses `en-US` month abbreviations, UTC.

**Note on date semantics:** all comparisons treat dates as UTC calendar dates (YAML dates parse as UTC midnight). "Upcoming" includes events happening today and multi-day events still in progress.

- [ ] **Step 1: Write the failing tests**

Create `site/test/learn.test.ts`:

```typescript
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
    format: 'in-person',
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
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run test/learn.test.ts
```

Expected: FAIL — `Cannot find module '../src/util/learn'` (or equivalent resolve error).

- [ ] **Step 3: Implement `site/src/util/learn.ts`**

```typescript
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

export function sortCourses(courses: Course[]): Course[] {
  return [...courses].sort((a, b) => a.number - b.number)
}

/** The course spotlighted at the top of the Courses section. */
export function featuredCourse(courses: Course[]): Course | undefined {
  return sortCourses(courses).find((c) => c.status === 'available')
}

/** Future courses shown as shelf slots below the featured course. */
export function shelfCourses(courses: Course[]): Course[] {
  return sortCourses(courses).filter((c) => c.status !== 'available')
}

const MONTH = new Intl.DateTimeFormat('en-US', { month: 'short', timeZone: 'UTC' })

/** "Jan 20", "Dec 1–5" (same month), or "Nov 30 – Dec 2" (cross-month). */
export function formatEventDate(event: LearnEvent): string {
  const start = `${MONTH.format(event.startDate)} ${event.startDate.getUTCDate()}`
  if (!event.endDate || event.endDate.getTime() === event.startDate.getTime()) {
    return start
  }
  const sameMonth =
    event.startDate.getUTCMonth() === event.endDate.getUTCMonth() &&
    event.startDate.getUTCFullYear() === event.endDate.getUTCFullYear()
  return sameMonth
    ? `${start}–${event.endDate.getUTCDate()}`
    : `${start} – ${MONTH.format(event.endDate)} ${event.endDate.getUTCDate()}`
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run test/learn.test.ts
```

Expected: PASS (all tests).

- [ ] **Step 5: Commit**

```bash
git add site/src/util/learn.ts site/test/learn.test.ts
git commit -m "feat(site): add learn page data helpers"
```

---

### Task 3: Deep dives config (`config/learn.ts`)

**Files:**
- Create: `site/src/config/learn.ts`

**Interfaces:**
- Produces: `deepDives: DeepDive[]` where `DeepDive = { title: string, tag: string, description: string, href: string, thumbnail: 'loop' | 'target' | 'question' }`. The `thumbnail` id selects one of the inline SVG motifs in `DeepDivesSection.astro` (Task 5).
- Produces: `suggestTopicHref: string` — Discord link used by the "suggest the next one" slot.

- [ ] **Step 1: Create `site/src/config/learn.ts`**

```typescript
/**
 * Editorial configuration for the /learn/ page.
 *
 * Deep dives are hand-curated picks — few enough that a config array beats a
 * content collection. Promote to a collection if this list grows past ~6.
 */

export interface DeepDive {
  title: string
  // Kicker line above the headline, e.g. "Advanced · 25 min read"
  tag: string
  description: string
  href: string
  // Selects an SVG art motif rendered by DeepDivesSection
  thumbnail: 'loop' | 'target' | 'question'
}

export const deepDives: DeepDive[] = [
  {
    title: 'Building self-improving agents',
    tag: 'Advanced',
    description:
      'Agents that write their own tools at runtime, rewrite their own prompts, and orchestrate sub-agents.',
    href: '/community/learning/deep-dive-building-self-improving-agents/',
    thumbnail: 'loop',
  },
  {
    title: 'How steering hooks hit 100% agent accuracy',
    tag: 'Case study',
    description: 'A production case study in constraining agent behavior — and the numbers behind the headline.',
    href: '/community/learning/strands-steering-hooks/',
    thumbnail: 'target',
  },
]

export const suggestTopicHref = 'https://discord.gg/strands'
```

- [ ] **Step 2: Typecheck**

```bash
npm run typecheck
```

Expected: exits 0.

- [ ] **Step 3: Commit**

```bash
git add site/src/config/learn.ts
git commit -m "feat(site): add deep dives config for learn page"
```

---

### Task 4: Hero, ticker, and keep-going components

**Files:**
- Create: `site/src/components/learn/LearnHero.astro`
- Create: `site/src/components/learn/EventsTicker.astro`
- Create: `site/src/components/learn/KeepGoingStrip.astro`

**Interfaces:**
- `LearnHero` — no props; renders masthead, mission line, anchor links to `#courses`, `#deep-dives`, `#events`, `#blog`, and the animated strand SVG. Slot named `ticker` renders below the hero content inside the gradient.
- `EventsTicker` — props `{ events: LearnEvent[] }` (already filtered/limited by the page). Renders nothing when `events` is empty. Uses `formatEventDate` from `../../util/learn`.
- `KeepGoingStrip` — no props; static links via `pathWithBase`.

Visual reference for all markup/styles: `.superpowers/brainstorm/22280-1784580415/content/learn-hub-v3.html`. Components use scoped Astro `<style>` blocks. Design tokens: green `#00cc5f`, bright green `#00ff77`, rules `#262626`, muted text `#8f8f8f`, serif display font `Georgia, 'Times New Roman', serif` for headlines, system sans for UI text.

- [ ] **Step 1: Create `LearnHero.astro`**

```astro
---
/**
 * Hero for the /learn/ hub. The masthead belongs to the page, not to any
 * course — courses are one section among several. Animated strand curves
 * echo the homepage motif and pause under prefers-reduced-motion.
 */
---

<header class="learn-hero">
  <svg class="strands" viewBox="0 0 1200 420" preserveAspectRatio="none" aria-hidden="true">
    <path class="s1" d="M-50,320 C200,280 350,120 600,150 S1000,320 1250,220"></path>
    <path class="s2" d="M-50,360 C250,330 400,170 650,190 S1050,340 1250,260"></path>
    <path class="s3" d="M-50,280 C180,250 340,80 620,110 S980,290 1250,180"></path>
  </svg>
  <div class="hero-inner">
    <span class="kicker">Strands Academy</span>
    <h1>Learn<span class="dot">.</span></h1>
    <p class="dek">
      Courses, deep dives, and events from the team building the SDK — everything you need to go from your first
      agent loop to production.
    </p>
    <nav class="paths" aria-label="Page sections">
      <a href="#courses">↓ Courses</a>
      <a href="#deep-dives">↓ Deep dives</a>
      <a href="#events">↓ Events</a>
      <a href="#blog">↓ From the blog</a>
    </nav>
  </div>
  <slot name="ticker" />
</header>

<style>
  .learn-hero {
    position: relative;
    overflow: hidden;
    background: radial-gradient(ellipse 90% 130% at 70% -20%, #143324 0%, #0f2015 40%, var(--sl-color-black, #0e0e0e) 75%);
  }

  .strands {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    opacity: 0.5;
  }

  .strands path {
    fill: none;
    stroke-width: 1.5;
    stroke-linecap: round;
  }

  .strands .s1 {
    stroke: #00cc5f;
    stroke-opacity: 0.55;
    stroke-dasharray: 8 14;
    animation: strand-flow 22s linear infinite;
  }

  .strands .s2 {
    stroke: #00ff77;
    stroke-opacity: 0.25;
    stroke-dasharray: 3 18;
    animation: strand-flow 30s linear infinite reverse;
  }

  .strands .s3 {
    stroke: #2a7a52;
    stroke-opacity: 0.5;
    stroke-dasharray: 14 10;
    animation: strand-flow 26s linear infinite;
  }

  @keyframes strand-flow {
    to {
      stroke-dashoffset: -600;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .strands .s1,
    .strands .s2,
    .strands .s3 {
      animation: none;
    }
  }

  .hero-inner {
    max-width: 1200px;
    margin: 0 auto;
    padding: 5.5rem 3rem 4.5rem;
    position: relative;
  }

  .kicker {
    font-family: var(--sl-font-system, system-ui), sans-serif;
    font-size: 0.75rem;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: #00cc5f;
    font-weight: 700;
  }

  h1 {
    font-family: Georgia, 'Times New Roman', serif;
    font-size: clamp(3.25rem, 8vw, 5.5rem);
    line-height: 1;
    letter-spacing: -0.03em;
    font-weight: 600;
    color: #fff;
    margin: 0;
  }

  .dot {
    color: #00cc5f;
  }

  .dek {
    font-family: Georgia, 'Times New Roman', serif;
    font-size: 1.375rem;
    color: #b9c4bd;
    max-width: 40rem;
    margin: 1.25rem 0 0;
  }

  .paths {
    display: flex;
    flex-wrap: wrap;
    gap: 1.75rem;
    margin-top: 2.25rem;
    font-family: var(--sl-font-system, system-ui), sans-serif;
    font-size: 0.875rem;
  }

  .paths a {
    color: #9db5a7;
    text-decoration: none;
    border-bottom: 1px solid #2c5940;
    padding-bottom: 3px;
  }

  .paths a:hover {
    color: #00ff77;
    border-color: #00ff77;
  }

  @media (max-width: 900px) {
    .hero-inner {
      padding: 3.5rem 1.5rem 3rem;
    }
  }
</style>
```

- [ ] **Step 2: Create `EventsTicker.astro`**

```astro
---
import type { LearnEvent } from '../../content.config'
import { formatEventDate } from '../../util/learn'
import { pathWithBase } from '../../util/links'

interface Props {
  events: LearnEvent[]
}

const { events } = Astro.props
---

{
  events.length > 0 && (
    <div class="ticker">
      <div class="inner">
        <b class="lbl">UPCOMING</b>
        {events.map((event) => {
          const label = (
            <>
              <span class="date">{formatEventDate(event)}</span> {event.title} · {event.location}
            </>
          )
          return event.href ? (
            <a href={event.href.startsWith('http') ? event.href : pathWithBase(event.href)}>{label}</a>
          ) : (
            <span>{label}</span>
          )
        })}
        <a class="all" href="#events">
          All events →
        </a>
      </div>
    </div>
  )
}

<style>
  .ticker {
    border-top: 1px solid #1d3527;
    background: #0c1a11;
    font-family: var(--sl-font-system, system-ui), sans-serif;
    font-size: 0.85rem;
    color: #a9c4b3;
    position: relative;
  }

  .inner {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0.75rem 3rem;
    display: flex;
    gap: 1.75rem;
    align-items: baseline;
    white-space: nowrap;
    overflow-x: auto;
  }

  .lbl {
    color: #00cc5f;
    letter-spacing: 0.15em;
    font-size: 0.7rem;
  }

  .date {
    color: #d8b25e;
    font-weight: 700;
  }

  a {
    color: inherit;
    text-decoration: none;
  }

  a:hover {
    color: #00ff77;
  }

  .all {
    margin-left: auto;
    color: #00cc5f;
    font-weight: 600;
  }

  @media (max-width: 900px) {
    .inner {
      padding: 0.75rem 1.5rem;
    }
  }
</style>
```

- [ ] **Step 3: Create `KeepGoingStrip.astro`**

```astro
---
import { pathWithBase } from '../../util/links'
---

<div class="keep-going">
  <span class="kicker">Keep going</span>
  <a href={pathWithBase('/docs/examples/')}>Examples gallery →</a>
  <a href={pathWithBase('/docs/labs/')}>Labs projects →</a>
  <a href={pathWithBase('/docs/api/typescript/')}>API reference →</a>
  <a href="https://discord.gg/strands">Join Discord →</a>
</div>

<style>
  .keep-going {
    border-top: 1px solid #262626;
    padding: 2.25rem 0 4.5rem;
    display: flex;
    flex-wrap: wrap;
    gap: 2.5rem;
    align-items: baseline;
    font-family: var(--sl-font-system, system-ui), sans-serif;
    font-size: 0.9375rem;
  }

  .kicker {
    font-size: 0.75rem;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: #7a7a7a;
    font-weight: 700;
  }

  a {
    color: #bbb;
    text-decoration: none;
  }

  a:hover {
    color: #00ff77;
  }
</style>
```

- [ ] **Step 4: Typecheck and commit**

```bash
npm run typecheck
git add site/src/components/learn/
git commit -m "feat(site): add learn page hero, ticker, and footer strip components"
```

---

### Task 5: Courses, deep dives, events poster, and blog section components

**Files:**
- Create: `site/src/components/learn/CoursesSection.astro`
- Create: `site/src/components/learn/DeepDivesSection.astro`
- Create: `site/src/components/learn/EventsPoster.astro`
- Create: `site/src/components/learn/BlogSection.astro`

**Interfaces:**
- `CoursesSection` — props `{ featured: Course | undefined, shelf: Course[] }`. Renders section only if `featured` exists. Cover art (terminal mock) is inline markup. Shelf renders course slots when non-empty, otherwise a single "More courses coming" slot.
- `DeepDivesSection` — props `{ dives: DeepDive[], suggestTopicHref: string }`. Renders numbered list with SVG thumbs selected by `dive.thumbnail`, plus a trailing "suggest the next one" slot. Wraps content only — the page composes it in a grid with `EventsPoster`.
- `EventsPoster` — props `{ headliner: LearnEvent | undefined, others: LearnEvent[] }`. When `headliner` is undefined renders an evergreen "Join the community" card instead.
- `BlogSection` — props `{ posts: BlogPost[] }` (`BlogPost` from `../../util/blog`). Three-column row, first column gets the green accent; covers are CSS gradients with an outlined glyph derived from the post index.

Follow the visual mockup `.superpowers/brainstorm/22280-1784580415/content/learn-hub-v3.html` for all styling. Shared design tokens as in Task 4.

- [ ] **Step 1: Create `CoursesSection.astro`**

```astro
---
import type { Course } from '../../content.config'
import { pathWithBase } from '../../util/links'

interface Props {
  featured: Course | undefined
  shelf: Course[]
}

const { featured, shelf } = Astro.props

const statusLabel: Record<Course['status'], string> = {
  available: 'Available now',
  'in-development': 'In development',
  proposed: 'Proposed',
}
---

{
  featured && (
    <section id="courses" class="courses">
      <div class="sec-head">
        <h2>Courses</h2>
        <span class="sec-dek">Structured, hands-on paths. More on the way.</span>
      </div>

      <div class="feature">
        <div class="main">
          <span class="kicker">Course № {featured.number} · {statusLabel[featured.status]}</span>
          <h3>{featured.title}</h3>
          <p class="dek">{featured.description}</p>
          <div class="ctas">
            <a class="btn" href={pathWithBase(featured.href)}>
              Start the course →
            </a>
            {featured.syllabusHref && (
              <a class="btn ghost" href={pathWithBase(featured.syllabusHref)}>
                Syllabus
              </a>
            )}
          </div>
          <div class="meta">
            {featured.duration && <span>⏱ {featured.duration}</span>}
            <span>🛠 Code-along</span>
            {featured.languages && <span>{featured.languages.join(' & ')}</span>}
            <span>Free</span>
          </div>
        </div>

        <div class="cover" aria-hidden="true">
          <svg class="mini-strands" viewBox="0 0 400 260" preserveAspectRatio="none">
            <path d="M-10,60 C80,30 180,110 410,50" stroke="#2a7a52" stroke-opacity="0.6" fill="none" stroke-width="1.2"></path>
            <path d="M-10,40 C100,10 220,90 410,30" stroke="#00cc5f" stroke-opacity="0.35" fill="none" stroke-width="1.2"></path>
          </svg>
          <span class="lesson-chip">LESSON 01</span>
          <div class="term">
            <div class="bar">
              <i></i>
              <i></i>
              <i></i>
            </div>
            <pre><span class="c"># your first agent — lesson 1</span>
<span class="k">from</span> strands <span class="k">import</span> Agent

agent = Agent()
agent(<span class="s">"What can you do?"</span>)
<span class="c">▸ running the agent loop…</span>
<span class="c">▸ model → tools → response</span>
<span class="cursor"></span></pre>
          </div>
        </div>
      </div>

      {featured.lessons && featured.lessons.length > 0 && (
        <div class="syllabus">
          <span class="kicker dim">In this course</span>
          <div class="rows">
            {featured.lessons.map((lesson) => (
              <a class="row" href={pathWithBase(lesson.href)}>
                <span class="n">{String(lesson.number).padStart(2, '0')}</span>
                {lesson.title}
                {lesson.duration && <span class="len">{lesson.duration}</span>}
              </a>
            ))}
          </div>
        </div>
      )}

      <div class="shelf">
        {shelf.length > 0 ? (
          shelf.map((course) => (
            <div class="slot">
              <div class="idx">{course.number}</div>
              <span class="tag">{statusLabel[course.status]}</span>
              <h4>{course.title}</h4>
              <p>{course.description}</p>
            </div>
          ))
        ) : (
          <div class="slot">
            <div class="idx">{featured.number + 1}</div>
            <span class="tag">Coming soon</span>
            <h4>More courses on the way</h4>
            <p>Tell us what you want to learn next on Discord.</p>
          </div>
        )}
      </div>
    </section>
  )
}

<style>
  .courses {
    padding: 4.25rem 0;
  }

  .sec-head {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .sec-head h2 {
    font-family: Georgia, 'Times New Roman', serif;
    font-size: 2.625rem;
    letter-spacing: -0.02em;
    font-weight: 600;
    color: #fff;
    margin: 0;
  }

  .sec-dek {
    font-family: var(--sl-font-system, system-ui), sans-serif;
    color: #8f8f8f;
    font-size: 0.9375rem;
  }

  .kicker {
    font-family: var(--sl-font-system, system-ui), sans-serif;
    font-size: 0.75rem;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: #00cc5f;
    font-weight: 700;
  }

  .kicker.dim {
    color: #7a7a7a;
  }

  .feature {
    display: grid;
    grid-template-columns: 1fr 1.05fr;
    gap: 3.5rem;
    align-items: center;
    margin-top: 2.25rem;
  }

  .main h3 {
    font-family: Georgia, 'Times New Roman', serif;
    font-size: 2.625rem;
    letter-spacing: -0.02em;
    line-height: 1.08;
    font-weight: 600;
    color: #fff;
    margin: 0.875rem 0 0.75rem;
  }

  .main .dek {
    font-family: Georgia, 'Times New Roman', serif;
    color: #b0b0b0;
    font-size: 1.0625rem;
    max-width: 30rem;
    margin: 0 0 1.625rem;
  }

  .ctas {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  .btn {
    display: inline-block;
    font-family: var(--sl-font-system, system-ui), sans-serif;
    background: #00cc5f;
    color: #0a1f14;
    font-weight: 700;
    border-radius: 999px;
    padding: 0.75rem 1.75rem;
    font-size: 0.9375rem;
    text-decoration: none;
    transition: transform 0.15s ease;
  }

  .btn:hover {
    transform: translateY(-1px);
    background: #00ff77;
  }

  .btn.ghost {
    background: transparent;
    color: #ececec;
    border: 1px solid #3a3a3a;
  }

  .meta {
    font-family: var(--sl-font-system, system-ui), sans-serif;
    font-size: 0.8125rem;
    color: #7fa891;
    margin-top: 1.25rem;
    display: flex;
    gap: 1.375rem;
    flex-wrap: wrap;
  }

  /* Cover art: mock terminal over gradient mesh */
  .cover {
    position: relative;
    border-radius: 20px;
    overflow: hidden;
    aspect-ratio: 16 / 10.5;
    background:
      radial-gradient(ellipse 60% 50% at 20% 15%, #1d5c39cc 0%, transparent 60%),
      radial-gradient(ellipse 50% 60% at 85% 80%, #0b3d2455 0%, transparent 65%),
      linear-gradient(160deg, #12281b 0%, #0d1810 100%);
    border: 1px solid #234534;
    box-shadow: 0 30px 80px -20px #00cc5f22;
  }

  .mini-strands {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    opacity: 0.6;
  }

  .lesson-chip {
    position: absolute;
    top: 7%;
    right: 6%;
    font-family: var(--sl-font-system, system-ui), sans-serif;
    background: #00cc5f;
    color: #0a1f14;
    font-weight: 800;
    font-size: 0.75rem;
    border-radius: 999px;
    padding: 6px 14px;
    letter-spacing: 0.06em;
    box-shadow: 0 8px 24px #00cc5f44;
  }

  .term {
    position: absolute;
    left: 7%;
    right: 7%;
    top: 12%;
    bottom: -6%;
    background: #0b0f0cee;
    border: 1px solid #2a4a37;
    border-radius: 12px 12px 0 0;
    backdrop-filter: blur(4px);
    font-family: var(--sl-font-mono, 'SF Mono', Menlo, Consolas, monospace);
    font-size: 0.78rem;
    line-height: 1.75;
    overflow: hidden;
  }

  .term .bar {
    display: flex;
    gap: 6px;
    padding: 10px 14px;
    border-bottom: 1px solid #1e3527;
  }

  .term .bar i {
    width: 10px;
    height: 10px;
    border-radius: 999px;
    background: #28422f;
  }

  .term .bar i:first-child {
    background: #00cc5f;
  }

  .term pre {
    padding: 14px 18px;
    color: #9fd8b4;
    margin: 0;
    background: transparent;
  }

  .term .c {
    color: #587a63;
  }

  .term .k {
    color: #00ff77;
  }

  .term .s {
    color: #d8b25e;
  }

  .term .cursor {
    display: inline-block;
    width: 7px;
    height: 14px;
    background: #00ff77;
    vertical-align: -2px;
    animation: cursor-blink 1.1s steps(1) infinite;
  }

  @keyframes cursor-blink {
    50% {
      opacity: 0;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .term .cursor {
      animation: none;
    }
  }

  /* Syllabus strip */
  .syllabus {
    margin-top: 3rem;
    font-family: var(--sl-font-system, system-ui), sans-serif;
  }

  .syllabus .rows {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    column-gap: 4rem;
    margin-top: 0.875rem;
  }

  .syllabus .row {
    display: flex;
    gap: 0.875rem;
    padding: 9px 0;
    border-bottom: 1px solid #1d1d1d;
    color: #cfcfcf;
    font-size: 0.90625rem;
    align-items: baseline;
    text-decoration: none;
  }

  .syllabus .row:hover {
    color: #00ff77;
  }

  .syllabus .n {
    color: #00cc5f;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    min-width: 24px;
  }

  .syllabus .len {
    margin-left: auto;
    color: #5a5a5a;
    font-size: 0.75rem;
  }

  /* Future-course shelf */
  .shelf {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 2rem;
    margin-top: 3.25rem;
  }

  .slot {
    position: relative;
    border-radius: 16px;
    padding: 1.625rem 1.75rem;
    min-height: 150px;
    overflow: hidden;
    border: 1px dashed #2e2e2e;
    background: radial-gradient(ellipse 70% 90% at 90% 10%, #14301f 0%, transparent 60%);
  }

  .slot .idx {
    position: absolute;
    right: 18px;
    bottom: -14px;
    font-size: 6rem;
    font-style: italic;
    color: transparent;
    -webkit-text-stroke: 1.2px #234534;
    font-family: Georgia, serif;
    line-height: 1;
  }

  .slot .tag {
    font-family: var(--sl-font-system, system-ui), sans-serif;
    font-size: 0.65625rem;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: #5c7a68;
  }

  .slot h4 {
    font-family: Georgia, 'Times New Roman', serif;
    font-size: 1.4375rem;
    font-weight: 600;
    color: #a8a8a8;
    letter-spacing: -0.01em;
    margin: 0.5rem 0 0.375rem;
    position: relative;
  }

  .slot p {
    color: #6f6f6f;
    font-size: 0.875rem;
    font-family: var(--sl-font-system, system-ui), sans-serif;
    position: relative;
    max-width: 75%;
    margin: 0;
  }

  @media (max-width: 900px) {
    .feature,
    .shelf {
      grid-template-columns: 1fr;
      gap: 2.25rem;
    }

    .syllabus .rows {
      grid-template-columns: 1fr;
    }

    .sec-head h2,
    .main h3 {
      font-size: 2rem;
    }
  }
</style>
```

- [ ] **Step 2: Create `DeepDivesSection.astro`**

```astro
---
import type { DeepDive } from '../../config/learn'
import { pathWithBase } from '../../util/links'

interface Props {
  dives: DeepDive[]
  suggestTopicHref: string
}

const { dives, suggestTopicHref } = Astro.props
---

<div class="deep-dives">
  <h2>Deep dives</h2>
  <p class="sec-dek">Long-form explorations beyond the courses.</p>

  {
    dives.map((dive, i) => (
      <a class="dive" href={pathWithBase(dive.href)}>
        <div class="thumb" aria-hidden="true">
          {dive.thumbnail === 'loop' && (
            <svg viewBox="0 0 150 112">
              <circle cx="75" cy="56" r="30" fill="none" stroke="#00cc5f" stroke-width="1.5" stroke-dasharray="140 60" opacity="0.8" />
              <circle cx="75" cy="56" r="42" fill="none" stroke="#2a7a52" stroke-width="1.2" stroke-dasharray="180 90" opacity="0.6" />
              <path d="M105 50 l6 8 l-10 2 z" fill="#00ff77" />
              <circle cx="75" cy="56" r="8" fill="#00cc5f" />
            </svg>
          )}
          {dive.thumbnail === 'target' && (
            <svg viewBox="0 0 150 112">
              <path d="M15 90 C50 85, 60 40, 95 35" fill="none" stroke="#5a5a3a" stroke-width="1.5" stroke-dasharray="4 5" />
              <path d="M15 90 C55 80, 80 60, 118 30" fill="none" stroke="#00cc5f" stroke-width="2" />
              <circle cx="118" cy="30" r="9" fill="none" stroke="#00ff77" stroke-width="1.5" />
              <circle cx="118" cy="30" r="3.5" fill="#00ff77" />
            </svg>
          )}
          {dive.thumbnail === 'question' && (
            <svg viewBox="0 0 150 112">
              <text x="75" y="72" text-anchor="middle" font-family="Georgia" font-style="italic" font-size="52" fill="none" stroke="#2f6b48" stroke-width="1.2">
                ?
              </text>
            </svg>
          )}
        </div>
        <div>
          <span class="tag">{dive.tag}</span>
          <h3>{dive.title}</h3>
          <p>{dive.description}</p>
        </div>
      </a>
    ))
  }

  <a class="dive suggest" href={suggestTopicHref}>
    <div class="thumb" aria-hidden="true">
      <svg viewBox="0 0 150 112">
        <text x="75" y="72" text-anchor="middle" font-family="Georgia" font-style="italic" font-size="52" fill="none" stroke="#2f6b48" stroke-width="1.2">?</text>
      </svg>
    </div>
    <div>
      <span class="tag">Suggest the next one</span>
      <h3>What should we cover next?</h3>
      <p>Tell us on Discord or open a discussion on GitHub.</p>
    </div>
  </a>
</div>

<style>
  h2 {
    font-family: Georgia, 'Times New Roman', serif;
    font-size: 2.625rem;
    letter-spacing: -0.02em;
    font-weight: 600;
    color: #fff;
    margin: 0;
  }

  .sec-dek {
    font-family: var(--sl-font-system, system-ui), sans-serif;
    color: #8f8f8f;
    font-size: 0.9375rem;
    margin: 0.375rem 0 0;
  }

  .dive {
    display: grid;
    grid-template-columns: 150px 1fr;
    gap: 1.625rem;
    align-items: center;
    padding: 1.5rem 0;
    border-bottom: 1px solid #262626;
    text-decoration: none;
  }

  .dive:last-child {
    border-bottom: none;
  }

  .thumb {
    aspect-ratio: 4 / 3;
    border-radius: 12px;
    position: relative;
    overflow: hidden;
    border: 1px solid #223328;
    background: linear-gradient(145deg, #0f2b1c, #0b1210);
  }

  .thumb svg {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
  }

  .tag {
    font-family: var(--sl-font-system, system-ui), sans-serif;
    font-size: 0.6875rem;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: #6a6a6a;
  }

  h3 {
    font-family: Georgia, 'Times New Roman', serif;
    font-size: 1.5rem;
    letter-spacing: -0.01em;
    font-weight: 600;
    color: #fff;
    margin: 0.3125rem 0;
  }

  .dive:hover h3 {
    color: #00ff77;
  }

  .suggest h3 {
    color: #777;
  }

  .dive p {
    color: #8f8f8f;
    font-size: 0.90625rem;
    font-family: Georgia, 'Times New Roman', serif;
    margin: 0;
  }

  @media (max-width: 900px) {
    .dive {
      grid-template-columns: 110px 1fr;
    }

    h2 {
      font-size: 2rem;
    }
  }
</style>
```

- [ ] **Step 3: Create `EventsPoster.astro`**

```astro
---
import type { LearnEvent } from '../../content.config'
import { formatEventDate } from '../../util/learn'

interface Props {
  headliner: LearnEvent | undefined
  others: LearnEvent[]
}

const { headliner, others } = Astro.props
---

<aside id="events" class="poster-wrap">
  <div class="poster">
    <svg class="topo" viewBox="0 0 300 380" preserveAspectRatio="none" aria-hidden="true">
      <path d="M-10,40 C60,20 140,60 310,30"></path>
      <path d="M-10,80 C70,55 150,100 310,70"></path>
      <path d="M-10,120 C80,90 160,140 310,110"></path>
      <path d="M-10,160 C90,125 170,180 310,150"></path>
      <path d="M-10,200 C100,160 180,220 310,190"></path>
      <path d="M-10,240 C110,195 190,260 310,230"></path>
      <path d="M-10,280 C120,230 200,300 310,270"></path>
      <path d="M-10,320 C130,265 210,340 310,310"></path>
    </svg>
    {
      headliner ? (
        <>
          <span class="kicker">Meet us in person</span>
          <h3>{headliner.title}</h3>
          <p class="sub">
            {headliner.description ? `${headliner.description} · ` : ''}
            {formatEventDate(headliner)} · {headliner.location}
          </p>
          {others.length > 0 && (
            <div class="list">
              {others.map((event) => (
                <div class="row">
                  <b>{formatEventDate(event)}</b>
                  <span>
                    {event.title} · {event.location}
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          <span class="kicker">Join the community</span>
          <h3>Community calls &amp; events</h3>
          <p class="sub">Event announcements land on Discord first — talks, workshops, and community calls.</p>
        </>
      )
    }
    <a class="cal" href="https://discord.gg/strands">
      {headliner ? 'Event updates on Discord →' : 'Join the Discord →'}
    </a>
  </div>
</aside>

<style>
  .poster {
    background: #00cc5f;
    color: #0a1f14;
    border-radius: 18px;
    padding: 2.125rem 2.125rem 1.625rem;
    position: sticky;
    top: calc(var(--sl-nav-height, 4rem) + 2rem);
    overflow: hidden;
  }

  .topo {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    opacity: 0.18;
  }

  .topo path {
    fill: none;
    stroke: #053018;
    stroke-width: 1.4;
  }

  .poster > :not(.topo) {
    position: relative;
  }

  .kicker {
    font-family: var(--sl-font-system, system-ui), sans-serif;
    font-size: 0.75rem;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    font-weight: 700;
  }

  h3 {
    font-family: Georgia, 'Times New Roman', serif;
    font-size: 1.875rem;
    letter-spacing: -0.02em;
    margin: 0.75rem 0 0.25rem;
    font-weight: 600;
  }

  .sub {
    font-family: Georgia, 'Times New Roman', serif;
    font-size: 0.9375rem;
    color: #10432a;
    margin: 0;
  }

  .list {
    font-family: var(--sl-font-system, system-ui), sans-serif;
    margin-top: 1.5rem;
    border-top: 1px solid #0f3322;
    font-size: 0.875rem;
  }

  .row {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    padding: 11px 0;
    border-bottom: 1px solid #0f33224d;
  }

  .row b {
    min-width: 60px;
  }

  .cal {
    display: inline-block;
    margin-top: 1rem;
    font-family: var(--sl-font-system, system-ui), sans-serif;
    font-weight: 700;
    font-size: 0.875rem;
    color: #0a1f14;
    text-decoration: none;
    border-bottom: 2px solid #0a1f14;
  }

  @media (max-width: 900px) {
    .poster {
      position: static;
    }
  }
</style>
```

- [ ] **Step 4: Create `BlogSection.astro`**

```astro
---
import type { BlogPost } from '../../util/blog'
import { pathWithBase } from '../../util/links'

interface Props {
  posts: BlogPost[]
}

const { posts } = Astro.props

// Oversized outlined glyphs give each gradient cover a distinct identity
const glyphs = ['№1', '∞', '§']
const coverClasses = ['b1', 'b2', 'b3']
---

{
  posts.length > 0 && (
    <section id="blog" class="blog-section">
      <div class="sec-head">
        <h2>From the blog</h2>
        <a class="more" href={pathWithBase('/blog/')}>
          All posts →
        </a>
      </div>
      <div class="row">
        {posts.map((post, i) => (
          <article>
            <a href={pathWithBase(`/blog/${post.id}/`)}>
              <div class={`bcover ${coverClasses[i % coverClasses.length]}`} aria-hidden="true">
                <span class="glyph">{glyphs[i % glyphs.length]}</span>
              </div>
              <span class="kicker">{post.data.tags[0] ?? 'Blog'}</span>
              <h3>{post.data.title}</h3>
              <p>{post.data.description}</p>
            </a>
          </article>
        ))}
      </div>
    </section>
  )
}

<style>
  .blog-section {
    padding: 4.25rem 0;
    border-top: 1px solid #262626;
  }

  .sec-head {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
  }

  h2 {
    font-family: Georgia, 'Times New Roman', serif;
    font-size: 2.625rem;
    letter-spacing: -0.02em;
    font-weight: 600;
    color: #fff;
    margin: 0;
  }

  .more {
    font-family: var(--sl-font-system, system-ui), sans-serif;
    font-size: 0.875rem;
    color: #00cc5f;
    font-weight: 600;
    text-decoration: none;
  }

  .row {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 2.25rem;
    margin-top: 2.5rem;
  }

  article a {
    text-decoration: none;
    display: block;
  }

  .bcover {
    aspect-ratio: 16 / 9;
    border-radius: 12px;
    margin-bottom: 1rem;
    position: relative;
    overflow: hidden;
    border: 1px solid #232323;
  }

  .bcover.b1 {
    background: radial-gradient(ellipse 80% 100% at 30% 0%, #1d5c39 0%, #0d1810 70%);
  }

  .bcover.b2 {
    background: conic-gradient(from 220deg at 70% 30%, #0d1810, #16402b, #0d1810);
  }

  .bcover.b3 {
    background: linear-gradient(200deg, #142d1e 0%, #101010 80%);
  }

  .glyph {
    position: absolute;
    right: 14px;
    bottom: 6px;
    font-family: Georgia, serif;
    font-style: italic;
    font-size: 4rem;
    color: transparent;
    -webkit-text-stroke: 1.2px #2f6b48;
    line-height: 1;
  }

  .kicker {
    font-family: var(--sl-font-system, system-ui), sans-serif;
    font-size: 0.75rem;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: #7a7a7a;
    font-weight: 700;
  }

  h3 {
    font-family: Georgia, 'Times New Roman', serif;
    font-size: 1.25rem;
    letter-spacing: -0.01em;
    margin: 0.5rem 0 0.375rem;
    font-weight: 600;
    color: #fff;
  }

  article a:hover h3 {
    color: #00ff77;
  }

  article p {
    color: #8f8f8f;
    font-size: 0.875rem;
    font-family: Georgia, 'Times New Roman', serif;
    margin: 0;
  }

  @media (max-width: 900px) {
    .row {
      grid-template-columns: 1fr;
      gap: 1.5rem;
    }

    h2 {
      font-size: 2rem;
    }
  }
</style>
```

- [ ] **Step 5: Typecheck and commit**

```bash
npm run typecheck
git add site/src/components/learn/
git commit -m "feat(site): add learn page courses, deep dives, events, and blog components"
```

---

### Task 6: The `/learn/` page and navbar entry

**Files:**
- Create: `site/src/pages/learn.astro`
- Modify: `site/src/config/navigation.yml` (navbar section, between Community and API Reference)

**Interfaces:**
- Consumes: all Task 4/5 components; `upcomingEvents`, `posterEvent`, `tickerEvents`, `featuredCourse`, `shelfCourses` from `../util/learn`; `deepDives`, `suggestTopicHref` from `../config/learn`; `getPublishedPosts` from `../util/blog`; `LandingLayout`.
- Produces: the `/learn/` route.

- [ ] **Step 1: Create `site/src/pages/learn.astro`**

```astro
---
/**
 * /learn/ — editorial hub for learning content: courses, deep dives,
 * events, and featured blog posts.
 *
 * Sections: Hero (+ events ticker) → Courses → Deep dives + Events poster →
 *           From the blog → Keep going → Footer
 *
 * Data flows top-down: this page loads collections and passes plain props;
 * section components never query collections themselves.
 */
import { getCollection } from 'astro:content'
import LandingLayout from '../layouts/LandingLayout.astro'
import Copyright from '../components/Copyright.astro'
import LearnHero from '../components/learn/LearnHero.astro'
import EventsTicker from '../components/learn/EventsTicker.astro'
import CoursesSection from '../components/learn/CoursesSection.astro'
import DeepDivesSection from '../components/learn/DeepDivesSection.astro'
import EventsPoster from '../components/learn/EventsPoster.astro'
import BlogSection from '../components/learn/BlogSection.astro'
import KeepGoingStrip from '../components/learn/KeepGoingStrip.astro'
import { deepDives, suggestTopicHref } from '../config/learn'
import { getPublishedPosts } from '../util/blog'
import { featuredCourse, shelfCourses, posterEvent, tickerEvents, upcomingEvents } from '../util/learn'

const courses = (await getCollection('courses')).map((entry) => entry.data)
const events = (await getCollection('events')).map((entry) => entry.data)
const posts = (await getPublishedPosts()).slice(0, 3)

const today = new Date()
const featured = featuredCourse(courses)
const shelf = shelfCourses(courses)
const ticker = tickerEvents(events, today)
const headliner = posterEvent(events, today)
const otherEvents = upcomingEvents(events, today).filter((e) => e !== headliner)
---

<LandingLayout
  title="Learn — Strands Agents"
  description="Courses, deep dives, and events from the team building the Strands Agents SDK."
>
  <div class="learn-page">
    <LearnHero>
      <EventsTicker slot="ticker" events={ticker} />
    </LearnHero>

    <div class="wrap">
      <CoursesSection featured={featured} shelf={shelf} />

      <section id="deep-dives" class="spread">
        <DeepDivesSection dives={deepDives} suggestTopicHref={suggestTopicHref} />
        <EventsPoster headliner={headliner} others={otherEvents.slice(0, 3)} />
      </section>

      <BlogSection posts={posts} />

      <KeepGoingStrip />
    </div>
  </div>

  <footer class="learn-footer">
    <div class="learn-footer-inner">
      <Copyright />
    </div>
  </footer>
</LandingLayout>

<style>
  .learn-page {
    width: 100%;
    background: var(--sl-color-black, #0e0e0e);
  }

  .wrap {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 3rem;
  }

  .spread {
    display: grid;
    grid-template-columns: 1.3fr 1fr;
    gap: 4rem;
    align-items: start;
    padding: 4.25rem 0;
    border-top: 1px solid #262626;
  }

  .learn-footer {
    padding: 1.5rem 2rem;
    border-top: 1px solid rgba(255, 255, 255, 0.06);
    background-color: var(--sl-color-bg-nav);
  }

  .learn-footer-inner {
    max-width: 1200px;
    text-align: left;
    margin: 0 auto;
  }

  @media (max-width: 900px) {
    .wrap {
      padding: 0 1.5rem;
    }

    .spread {
      grid-template-columns: 1fr;
      gap: 2.5rem;
    }
  }
</style>
```

- [ ] **Step 2: Add the navbar entry**

In `site/src/config/navigation.yml`, in the `navbar:` list, after the `Community` item (`basePath` list ends with `- /docs/contribute/`) and before `API Reference`, insert:

```yaml
  - label: Learn
    href: /learn/
    basePath: /learn/
```

- [ ] **Step 3: Build and verify the route renders**

```bash
npm run build 2>&1 | tail -5
test -f dist/learn/index.html && echo ROUTE_OK
grep -c 'Strands Academy' dist/learn/index.html
```

Expected: build succeeds, `ROUTE_OK`, grep count >= 1.

Note: if `npm run build` fails on unrelated generated API docs (missing `_generated` symlinks), use `npm run dev` instead and fetch `http://localhost:4321/learn/` with curl to verify: `curl -s http://localhost:4321/learn/ | grep -c 'Strands Academy'`.

- [ ] **Step 4: Run the full quality gate**

```bash
npm test && npm run typecheck && npm run format:check
```

Expected: all pass. (`format:check` only covers `docs` and content-docs TS files, so new components aren't in scope for it, but run it to be sure nothing regressed.)

- [ ] **Step 5: Commit**

```bash
git add site/src/pages/learn.astro site/src/config/navigation.yml
git commit -m "feat(site): add /learn/ editorial landing page and navbar entry"
```

---

### Task 7: Visual verification pass

**Files:** none created — this is a browser QA task using the `dev-browser` CLI (per user CLAUDE.md, do not use Chrome DevTools MCP).

- [ ] **Step 1: Start the dev server**

```bash
npm run dev
```

(Background it; wait for "Synced content".)

- [ ] **Step 2: Screenshot desktop, mobile, and light theme**

```bash
dev-browser <<'EOF'
const page = await browser.getPage("main");
await page.setViewportSize({ width: 1440, height: 2400 });
await page.goto("http://localhost:4321/learn/");
console.log(await saveScreenshot(await page.screenshot({ fullPage: true }), "learn-desktop.png"));
await page.setViewportSize({ width: 390, height: 844 });
console.log(await saveScreenshot(await page.screenshot({ fullPage: true }), "learn-mobile.png"));
await page.setViewportSize({ width: 1440, height: 2400 });
await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'light'));
console.log(await saveScreenshot(await page.screenshot({ fullPage: true }), "learn-light.png"));
EOF
```

- [ ] **Step 3: Review screenshots against the mockup**

Read the three screenshots and compare against `.superpowers/brainstorm/22280-1784580415/content/learn-hub-v3.html`. Checklist:
- Hero masthead, strand curves, anchor links render; ticker hidden (no events yet)
- Courses section: cover art terminal, 14-lesson syllabus in 2 columns, "More courses on the way" shelf slot
- Deep dives list with SVG thumbnails; events poster shows the evergreen Discord fallback
- Blog row shows 3 real posts with gradient covers
- Mobile: single column, no horizontal overflow
- Light theme: page must remain legible (the page is intentionally dark-styled; verify the header/nav doesn't clash)

- [ ] **Step 4: Verify navbar active state and anchors**

```bash
dev-browser <<'EOF'
const page = await browser.getPage("main");
await page.goto("http://localhost:4321/learn/");
const learnLink = await page.locator('nav a', { hasText: 'Learn' }).first();
console.log('aria-current:', await learnLink.getAttribute('aria-current'));
await page.click('a[href="#courses"]');
console.log('scrolled to courses:', await page.evaluate(() => window.scrollY > 100));
EOF
```

Expected: the Learn navbar item is marked active (exact attribute depends on the Header override — verify visually in the screenshot if `aria-current` is null), anchor scrolls.

- [ ] **Step 5: Fix anything broken, re-screenshot, commit fixes**

```bash
git add -A site/src
git commit -m "fix(site): learn page visual polish from QA pass"
```

(Skip the commit if nothing changed.)

---

## Verification

Final gate before handing back to the user:

```bash
cd site
npm test && npm run typecheck && npm run build
```

All pass, plus the Task 7 screenshots look right in dark/light/mobile. The user then reviews the page in their own browser (`npm run dev` → http://localhost:4321/learn/) and we iterate on the "small things" they flagged during design.
