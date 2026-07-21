# Learn Page — Design

**Date:** 2026-07-21
**Status:** Approved direction (visual v3), pending spec review
**Visual reference:** `.superpowers/brainstorm/22280-1784580415/content/learn-hub-v3.html`

## Problem

The Strands docs site has course-style learning content (a 14-lesson course plus deep-dive
articles, currently deployed under `/community/learning/` on a preview branch) but no
discovery surface for it. Customers can't find the courses, and there is nowhere to
feature conferences, events, or editorial blog picks. We want a hero/editorial landing
page that acts as the front door for all learning-related content.

## Goals

- A top-level `/learn/` page that makes course discovery easy and feels editorial —
  magazine-like typography and art direction, not a grid of uniform cards.
- Scope beyond courses: deep dives, upcoming conferences/events, and featured blog posts.
- Built to grow: the flagship course is entry № 1 in a course catalog, not the page's
  identity. New courses and events slot in as data, with no component changes.
- No stale content: blog section pulls live from the blog collection; events and courses
  are validated data entries.

## Non-goals

- The lesson content itself. The 14 lessons and deep-dive articles land separately
  (another branch/PR). This page links to their URLs.
- A full events-management system. Events are YAML entries curated by hand.
- Changes to the existing `/community/learning/` pages.

## Information architecture (visual v3, approved)

Page sections, top to bottom:

1. **Hero** — belongs to the hub, not to any course. "Learn." masthead (large serif),
   one-line mission, in-page anchor links (Courses / Deep dives / Events / Blog).
   Animated flowing strand curves in the background (brand motif from the homepage),
   disabled under `prefers-reduced-motion`.
2. **Events ticker** — slim strip under the hero: next 3 upcoming events with dates,
   link to the events section. Visible without owning the page.
3. **Courses** — section headline + "more on the way" dek.
   - **Featured course** (№ 1, Agent Fundamentals): editorial layout with kicker,
     serif headline, dek, CTA pair (Start the course / Syllabus), meta row
     (duration · code-along · Python & TS · free), and CSS/SVG **cover art** — a mock
     terminal running lesson-1 agent code with blinking cursor over a gradient mesh.
   - **Syllabus strip** — all 14 lessons in a two-column typographic list with green
     numerals and per-lesson durations (hairline rules, no boxes).
   - **Course shelf** — future courses as dashed-border slots with giant outlined
     numerals. Status tags come from data (e.g. "in development"). Ships only with
     entries the team confirms; otherwise a single honest "more courses coming" slot.
4. **Deep dives + events poster** — two-column spread.
   - Left: numbered editorial list, each dive with a small SVG art thumbnail, tag line
     (level · read time), serif headline, dek. Last slot is a "suggest the next one"
     community prompt.
   - Right: solid-green **events poster** (sticky on scroll) with topographic contour
     texture: headline event + dated list + link to full calendar.
5. **From the blog** — three editorial columns, each with a CSS-gradient cover and
   oversized outlined glyph, kicker, serif headline, dek. Populated from the newest
   published blog posts (optionally pinned via data config).
6. **Keep going** — slim footer strip linking Examples, Labs, API reference, Discord.

All art is CSS/SVG — no raster image assets required.

## Architecture

### Route and layout

- New page: `site/src/pages/learn.astro`, rendered with the existing `LandingLayout`
  (Starlight header, full-width content, no docs sidebar) — the same shell as the
  homepage.
- Section components under `site/src/components/learn/`:
  `LearnHero.astro`, `EventsTicker.astro`, `CoursesSection.astro`,
  `DeepDivesSection.astro`, `EventsPoster.astro`, `BlogSection.astro`,
  `KeepGoingStrip.astro`. Each takes typed props; no component reads collections
  directly except via the page (data flows top-down from `learn.astro`).

### Data layer

- **Content collections** (new, in `site/src/content.config.ts`):
  - `courses` — one YAML file per course under `site/src/content/courses/`.
    Schema (zod): `title`, `number` (int), `status` (`available` | `in-development` |
    `proposed`), `description`, `href` (course entry URL), `syllabusHref` (optional),
    `duration` (optional), `languages` (optional array), `lessons` (array of
    `{ number, title, href, duration? }`, optional — only `available` courses have one).
  - `events` — one YAML file per event under `site/src/content/events/`.
    Schema: `title`, `startDate` (date), `endDate` (optional), `location`,
    `format` (`in-person` | `virtual`), `href` (optional), `description` (optional),
    `featured` (boolean, default false — the poster headliner).
  - Loaded with the `file`/`glob` loaders following the existing `testimonials`
    pattern in `content.config.ts`.
- **Deep dives** — small typed array in `site/src/config/learn.ts` (title, tag, dek,
  href, thumbnail id). Only two exist; promote to a collection later if volume grows.
- **Blog section** — `getPublishedPosts()` from `site/src/util/blog`, newest 3
  (with optional pinned slugs in `learn.ts`).

### Behavior details

- **Events filtering:** the page shows only events with `startDate >= today` (build
  time), sorted ascending. Ticker takes the first 3; poster headliner is the first
  `featured` upcoming event (falling back to the soonest). If no upcoming events
  exist, the ticker and poster collapse gracefully (poster shows a "join the Discord
  community call" evergreen card; ticker hides).
- **Course shelf:** renders all non-`available` courses ordered by `number`. If none
  exist, renders a single "More courses coming" slot.
- **Navbar:** add `Learn` to `site/src/config/navigation.yml` navbar between
  Community and API Reference: `href: /learn/`, `basePath: /learn/`.
- **Responsive:** single-column stacking under 900px; poster loses stickiness;
  syllabus collapses to one column; hero type scales down.
- **Motion:** strand-curve animation and cursor blink gated behind
  `prefers-reduced-motion: reduce`.

### Content placeholders

Mocked content from the design exploration (re:Invent dates, "Advanced Multi-Agent
Systems", lesson durations) is **not** shipped as-is. Initial data entries are either
real values provided by the team or honest generic placeholders. Course lesson `href`s
point at the planned `/community/learning/lesson…` URLs. Those pages don't exist in
this repo yet, so this PR merges after (or alongside) the lessons PR; the links are
plain data entries in the course YAML and trivially updated if the final slugs differ.

## Error handling

- Zod schemas make malformed course/event entries fail the build with a clear error.
- Empty collections degrade to the graceful fallbacks above rather than broken sections.
- Dates are compared at build time (static site) — an event that passes between builds
  disappears at the next deploy, which is acceptable for this content type.

## Testing

- Unit tests (vitest, existing `site/test/` patterns) for the data helpers:
  upcoming-event filtering/sorting, featured-event selection, course ordering,
  fallback behavior for empty collections.
- `npm run build`, `npm run typecheck`, `npm run format:check`, `npm test` all pass
  (the pre-commit gate).
- Manual: visual pass in browser (light + dark theme, mobile width,
  reduced-motion), verify navbar active state on `/learn/`.

## Decisions log

- Top-level `/learn/` route (not `/community/learning/` index, not docs-shell page).
- Course catalog framing: flagship course is № 1 of a growing series.
- Expanded scope: courses + deep dives + events/conferences + blog features.
- Editorial visual language (v3): serif display type, hairline rules, outlined
  numerals, CSS/SVG art, green events poster, animated strand hero.
- Data layer: content collections for `courses` and `events`; config array for deep
  dives; live blog pulls. (Collections chosen over a plain TS data file for build-time
  validation and contributor-friendly "drop a YAML file" additions.)
