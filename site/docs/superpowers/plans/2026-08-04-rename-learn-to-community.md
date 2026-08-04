# Rename /learn/ Hub to /community/ and Move Lessons to docs/learning/ Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rename the /learn/ editorial hub to /community/, move the 14 lesson MDX files from docs/community/learning/ to docs/learning/, and add backwards-compatible redirects so no URL goes dark.

**Architecture:** The docs content collection glob in content.config.ts must be extended to include docs/learning/**/*.mdx; the navigation.yml and dynamic-sidebar must point to the new paths; and every consumer of the old paths (agent-fundamentals.yaml, dynamic-sidebar.ts, route-middleware.ts) must be updated in one atomic commit. Backwards compat is handled through two layers: redirectFrom frontmatter in each lesson (picked up by buildStaticRedirects for crawlers) and a 'learn': 'community' entry in STATIC_SLUG_REDIRECTS for the hub URL. The COMMUNITY_PREFIX_RULE catch-all in redirect.ts converts docs/community/* → docs/integrations/* — the lesson slugs are NOT in its static list, so they would be forwarded there; the redirectFrom frontmatter stubs take precedence in buildStaticRedirects (because redirectFromEntries is merged before staticRedirects in slugMap), but the COMMUNITY_PREFIX_RULE (a regex rule) is checked BEFORE redirectFromMap in resolveRedirect's runtime 404 path — this means the 404 redirect for a lesson slug would incorrectly go to docs/integrations/learning/lesson*. To prevent this, we also add explicit STATIC_SLUG_REDIRECTS entries for all 14 lessons mapping docs/community/learning/lessonN-* → docs/learning/lessonN-*.

**Tech Stack:** Astro 5, TypeScript, MDX, Starlight, Vitest

## Global Constraints

- Working directory: /Users/fjonatse/emdash/worktrees/harness-sdk/feature/learn-page-2gs47/site
- Single atomic commit: `refactor(site): rename learn hub to community, move lessons to docs/learning`
- No functional regressions: build must exit 0, all vitest tests must pass
- redirectFrom slugs format: `docs/community/learning/lesson1-how-agents-really-work` (no leading slash, no trailing slash) — matches xai.mdx pattern
- CSS class renames: `.learn-page` → `.community-page`, `.learn-footer` → `.community-footer`, `.learn-footer-inner` → `.community-footer-inner`, `.learn-hero` → `.community-hero`; keyframes learn-scroll-primary / learn-scroll-secondary are referenced in animations; rename to community-scroll-primary / community-scroll-secondary for coherence
- Do NOT rename src/config/learn.ts, src/util/learn.ts (internal, not route-related)
- Do NOT rename keyframe in learn.astro if it would require cascading search; rename them since they're all in the same file

---

## Redirect Precedence Analysis

**Static build-time** (redirect.static.ts `buildStaticRedirects`):
- `slugMap = { ...redirectFromEntries, ...staticRedirects }` — `staticRedirects` wins over `redirectFrom` for the same source slug
- For lesson slugs: NO conflict (no lesson slug in STATIC_SLUG_REDIRECTS before this change), so `redirectFromEntries` applies → each lesson's old slug → new docs/learning/lessonN slug ✓

**Runtime 404 fallback** (redirect.ts `resolveRedirect`):
- Checks SLUG_RULES first (which includes the COMMUNITY_PREFIX_RULE catch-all `startsWith('docs/community')`)
- THEN checks redirectFromMap
- Result: For `docs/community/learning/lesson1-...`, the prefix rule matches FIRST and would produce `docs/integrations/learning/lesson1-...` (wrong!)
- **Fix**: Add explicit STATIC_SLUG_REDIRECTS entries for all 14 lessons → they appear in SLUG_RULES as `exactly(...)` entries BEFORE the catch-all prefix rule, and exact matches win because the first matching rule is returned

So we need BOTH `redirectFrom` frontmatter (for static build stubs / crawlers) AND explicit STATIC_SLUG_REDIRECTS entries (to prevent the catch-all from hijacking the 404 path).

---

## Task 1: Move lesson files and add redirectFrom frontmatter

**Files:**
- Move: `src/content/docs/community/learning/` → `src/content/docs/learning/`
- Modify: all 14 MDX files (add `redirectFrom` frontmatter)

**Interfaces:**
- Produces: `src/content/docs/learning/lesson{1-14}-*.mdx` each with `redirectFrom: ['docs/community/learning/lessonN-slug']`

- [ ] **Step 1: git mv the directory**

```bash
cd /Users/fjonatse/emdash/worktrees/harness-sdk/feature/learn-page-2gs47/site
git mv src/content/docs/community/learning src/content/docs/learning
```

Expected output: none (git mv is silent on success). The dir `src/content/docs/community/` should now be empty (or gone).

- [ ] **Step 2: Verify the move**

```bash
ls /Users/fjonatse/emdash/worktrees/harness-sdk/feature/learn-page-2gs47/site/src/content/docs/learning/
```

Expected: 14 .mdx files listed.

- [ ] **Step 3: Add redirectFrom to lesson1**

Edit `src/content/docs/learning/lesson1-how-agents-really-work.mdx` — insert after `community: true`:

```yaml
redirectFrom:
  - docs/community/learning/lesson1-how-agents-really-work
```

Full frontmatter block becomes:
```
---
title: "Lesson 1: How Agents Really Work"
description: "A ground-up look at the agent loop: how a model, a set of tools, and a running context combine to let an agent reason, act, and observe until a task is done."
community: true
redirectFrom:
  - docs/community/learning/lesson1-how-agents-really-work
---
```

- [ ] **Step 4: Add redirectFrom to lessons 2–14**

For each file, add the `redirectFrom` block. The slug matches the filename without `.mdx`:

`lesson2-switching-model-providers.mdx`:
```yaml
redirectFrom:
  - docs/community/learning/lesson2-switching-model-providers
```

`lesson3-give-your-agent-tools-using-mcp.mdx`:
```yaml
redirectFrom:
  - docs/community/learning/lesson3-give-your-agent-tools-using-mcp
```

`lesson4-adding-callbacks-and-response-streaming.mdx`:
```yaml
redirectFrom:
  - docs/community/learning/lesson4-adding-callbacks-and-response-streaming
```

`lesson5-control-your-agent-with-hooks.mdx`:
```yaml
redirectFrom:
  - docs/community/learning/lesson5-control-your-agent-with-hooks
```

`lesson6-agent-plugins-and-skills.mdx`:
```yaml
redirectFrom:
  - docs/community/learning/lesson6-agent-plugins-and-skills
```

`lesson7-improve-agent-reliability-with-strands-steering.mdx`:
```yaml
redirectFrom:
  - docs/community/learning/lesson7-improve-agent-reliability-with-strands-steering
```

`lesson8-context-engineering-and-conversation-management.mdx`:
```yaml
redirectFrom:
  - docs/community/learning/lesson8-context-engineering-and-conversation-management
```

`lesson9-persistent-memory-with-session-managers.mdx`:
```yaml
redirectFrom:
  - docs/community/learning/lesson9-persistent-memory-with-session-managers
```

`lesson10-multi-agent-patterns-agents-as-tools.mdx`:
```yaml
redirectFrom:
  - docs/community/learning/lesson10-multi-agent-patterns-agents-as-tools
```

`lesson11-multi-agent-patterns-graph-workflows.mdx`:
```yaml
redirectFrom:
  - docs/community/learning/lesson11-multi-agent-patterns-graph-workflows
```

`lesson12-multi-agent-patterns-agent-swarms.mdx`:
```yaml
redirectFrom:
  - docs/community/learning/lesson12-multi-agent-patterns-agent-swarms
```

`lesson13-evaluating-agents.mdx`:
```yaml
redirectFrom:
  - docs/community/learning/lesson13-evaluating-agents
```

`lesson14-deploying-agents-to-the-cloud.mdx`:
```yaml
redirectFrom:
  - docs/community/learning/lesson14-deploying-agents-to-the-cloud
```

---

## Task 2: Update content.config.ts glob pattern

**Files:**
- Modify: `src/content.config.ts` (line ~261 — the `pattern` array in the `docs` collection)

**Interfaces:**
- Consumes: moved lesson files at `docs/learning/**/*.mdx`
- Produces: docs collection that includes lesson slugs like `docs/learning/lesson1-how-agents-really-work`

- [ ] **Step 1: Add docs/learning to the pattern array**

In `src/content.config.ts`, find the `pattern:` array (currently 7 entries). Add `"docs/learning/**/*.mdx"` after `"docs/user-guide/**/*.mdx"`:

Before:
```typescript
      pattern: [
        "404.mdx",

        "docs/user-guide/**/*.mdx",
        "docs/integrations/**/*.mdx",
```

After:
```typescript
      pattern: [
        "404.mdx",

        "docs/user-guide/**/*.mdx",
        "docs/learning/**/*.mdx",
        "docs/integrations/**/*.mdx",
```

---

## Task 3: Update redirect.ts with explicit lesson redirect entries and learn→community vanity

**Files:**
- Modify: `src/util/redirect.ts` (STATIC_SLUG_REDIRECTS object, ~line 27)

**Interfaces:**
- Produces: STATIC_SLUG_REDIRECTS entries for all 14 lesson old→new slugs plus `'learn': 'community'`

These entries prevent the COMMUNITY_PREFIX_RULE catch-all from hijacking lesson 404-fallback redirects, and add a vanity redirect for the hub URL.

- [ ] **Step 1: Add vanity redirect and 14 lesson redirects**

In `src/util/redirect.ts`, in the `STATIC_SLUG_REDIRECTS` object, add after the `discord` vanity entry:

```typescript
  // /learn/ hub was renamed to /community/
  'learn': 'community',

  // docs/community/learning/ lessons moved to docs/learning/
  // (explicit entries prevent the COMMUNITY_PREFIX_RULE catch-all from sending
  // these to docs/integrations/learning/* via the 404 fallback)
  'docs/community/learning/lesson1-how-agents-really-work':
    'docs/learning/lesson1-how-agents-really-work',
  'docs/community/learning/lesson2-switching-model-providers':
    'docs/learning/lesson2-switching-model-providers',
  'docs/community/learning/lesson3-give-your-agent-tools-using-mcp':
    'docs/learning/lesson3-give-your-agent-tools-using-mcp',
  'docs/community/learning/lesson4-adding-callbacks-and-response-streaming':
    'docs/learning/lesson4-adding-callbacks-and-response-streaming',
  'docs/community/learning/lesson5-control-your-agent-with-hooks':
    'docs/learning/lesson5-control-your-agent-with-hooks',
  'docs/community/learning/lesson6-agent-plugins-and-skills':
    'docs/learning/lesson6-agent-plugins-and-skills',
  'docs/community/learning/lesson7-improve-agent-reliability-with-strands-steering':
    'docs/learning/lesson7-improve-agent-reliability-with-strands-steering',
  'docs/community/learning/lesson8-context-engineering-and-conversation-management':
    'docs/learning/lesson8-context-engineering-and-conversation-management',
  'docs/community/learning/lesson9-persistent-memory-with-session-managers':
    'docs/learning/lesson9-persistent-memory-with-session-managers',
  'docs/community/learning/lesson10-multi-agent-patterns-agents-as-tools':
    'docs/learning/lesson10-multi-agent-patterns-agents-as-tools',
  'docs/community/learning/lesson11-multi-agent-patterns-graph-workflows':
    'docs/learning/lesson11-multi-agent-patterns-graph-workflows',
  'docs/community/learning/lesson12-multi-agent-patterns-agent-swarms':
    'docs/learning/lesson12-multi-agent-patterns-agent-swarms',
  'docs/community/learning/lesson13-evaluating-agents':
    'docs/learning/lesson13-evaluating-agents',
  'docs/community/learning/lesson14-deploying-agents-to-the-cloud':
    'docs/learning/lesson14-deploying-agents-to-the-cloud',
```

---

## Task 4: Update navigation.yml

**Files:**
- Modify: `src/config/navigation.yml`

**Interfaces:**
- Consumes: new lesson IDs at `docs/learning/lesson*`
- Produces: navbar entry `Community` at `/community/`, sidebar Learning group pointing to `docs/learning/*`, Community basePath includes `/docs/learning/`

- [ ] **Step 1: Update navbar entry**

Find (lines 29-31):
```yaml
  - label: Learn
    href: /learn/
    basePath: /learn/
```

Replace with:
```yaml
  - label: Community
    href: /community/
    basePath:
      - /community/
      - /docs/learning/
```

- [ ] **Step 2: Update the Learning sidebar group (14 entries)**

Find the `Learning` group (lines 313-329):
```yaml
      - label: Learning
        items:
          - docs/community/learning/lesson1-how-agents-really-work
          - docs/community/learning/lesson2-switching-model-providers
          - docs/community/learning/lesson3-give-your-agent-tools-using-mcp
          - docs/community/learning/lesson4-adding-callbacks-and-response-streaming
          - docs/community/learning/lesson5-control-your-agent-with-hooks
          - docs/community/learning/lesson6-agent-plugins-and-skills
          - docs/community/learning/lesson7-improve-agent-reliability-with-strands-steering
          - docs/community/learning/lesson8-context-engineering-and-conversation-management
          - docs/community/learning/lesson9-persistent-memory-with-session-managers
          - docs/community/learning/lesson10-multi-agent-patterns-agents-as-tools
          - docs/community/learning/lesson11-multi-agent-patterns-graph-workflows
          - docs/community/learning/lesson12-multi-agent-patterns-agent-swarms
          - docs/community/learning/lesson13-evaluating-agents
          - docs/community/learning/lesson14-deploying-agents-to-the-cloud
```

Replace with:
```yaml
      - label: Learning
        items:
          - docs/learning/lesson1-how-agents-really-work
          - docs/learning/lesson2-switching-model-providers
          - docs/learning/lesson3-give-your-agent-tools-using-mcp
          - docs/learning/lesson4-adding-callbacks-and-response-streaming
          - docs/learning/lesson5-control-your-agent-with-hooks
          - docs/learning/lesson6-agent-plugins-and-skills
          - docs/learning/lesson7-improve-agent-reliability-with-strands-steering
          - docs/learning/lesson8-context-engineering-and-conversation-management
          - docs/learning/lesson9-persistent-memory-with-session-managers
          - docs/learning/lesson10-multi-agent-patterns-agents-as-tools
          - docs/learning/lesson11-multi-agent-patterns-graph-workflows
          - docs/learning/lesson12-multi-agent-patterns-agent-swarms
          - docs/learning/lesson13-evaluating-agents
          - docs/learning/lesson14-deploying-agents-to-the-cloud
```

---

## Task 5: Rename pages/learn.astro → pages/community.astro and update CSS classes

**Files:**
- Move: `src/pages/learn.astro` → `src/pages/community.astro`
- Modify: `src/pages/community.astro` (class names, title, description, keyframe names)

**Interfaces:**
- Produces: `/community/` route rendering the hub page

- [ ] **Step 1: git mv the page**

```bash
cd /Users/fjonatse/emdash/worktrees/harness-sdk/feature/learn-page-2gs47/site
git mv src/pages/learn.astro src/pages/community.astro
```

- [ ] **Step 2: Update title and description**

In `src/pages/community.astro`, change:
```
  title="Learn — Strands Agents"
  description="Courses, deep dives, and events from the team building the Strands Agents SDK."
```
to:
```
  title="Community — Strands Agents"
  description="Courses, deep dives, and events from the team building the Strands Agents SDK."
```

- [ ] **Step 3: Update class names in community.astro**

Replace all occurrences of `learn-page` → `community-page`, `learn-footer` → `community-footer`, `learn-footer-inner` → `community-footer-inner`.

Also rename keyframes: `learn-scroll-primary` → `community-scroll-primary`, `learn-scroll-secondary` → `community-scroll-secondary`.

The updated style section should have:
```css
  .community-page { ... }
  .community-page :global(:focus-visible) { ... }
  :global([data-theme='light']) .community-page :global(:focus-visible) { ... }
  @keyframes community-scroll-primary { ... }
  @keyframes community-scroll-secondary { ... }
  animation: community-scroll-secondary 90s linear infinite;
  animation: community-scroll-primary 36s linear infinite;
  .community-footer { ... }
  .community-footer-inner { ... }
```

The HTML div tags change to:
```html
  <div class="community-page">
  ...
  <footer class="community-footer">
    <div class="community-footer-inner">
```

---

## Task 6: Rename components/learn/ → components/community/ and update LearnHero → CommunityHero

**Files:**
- Move: `src/components/learn/` → `src/components/community/` (all 7 files)
- Move within: `LearnHero.astro` → `CommunityHero.astro`
- Modify: `src/pages/community.astro` (update all import paths and component name)
- Modify: `src/components/community/CommunityHero.astro` (rename class `.learn-hero` → `.community-hero`, h1 text "Learn." → "Community.", CSS class references)

**Interfaces:**
- Produces: `src/components/community/CommunityHero.astro` with class `.community-hero` and h1 "Community."

- [ ] **Step 1: git mv the components directory**

```bash
cd /Users/fjonatse/emdash/worktrees/harness-sdk/feature/learn-page-2gs47/site
git mv src/components/learn src/components/community
git mv src/components/community/LearnHero.astro src/components/community/CommunityHero.astro
```

- [ ] **Step 2: Update imports in community.astro**

Change the import block from:
```typescript
import LearnHero from '../components/learn/LearnHero.astro'
import EventsTicker from '../components/learn/EventsTicker.astro'
import CoursesSection from '../components/learn/CoursesSection.astro'
import DeepDivesSection from '../components/learn/DeepDivesSection.astro'
import EventsPoster from '../components/learn/EventsPoster.astro'
import BlogSection from '../components/learn/BlogSection.astro'
import KeepGoingStrip from '../components/learn/KeepGoingStrip.astro'
```
to:
```typescript
import CommunityHero from '../components/community/CommunityHero.astro'
import EventsTicker from '../components/community/EventsTicker.astro'
import CoursesSection from '../components/community/CoursesSection.astro'
import DeepDivesSection from '../components/community/DeepDivesSection.astro'
import EventsPoster from '../components/community/EventsPoster.astro'
import BlogSection from '../components/community/BlogSection.astro'
import KeepGoingStrip from '../components/community/KeepGoingStrip.astro'
```

Also change the component usage tag from `<LearnHero>` → `<CommunityHero>` and `</LearnHero>` → `</CommunityHero>`.

- [ ] **Step 3: Update CommunityHero.astro**

In `src/components/community/CommunityHero.astro`:

Change h1 text from `Learn<span class="dot">.</span>` → `Community<span class="dot">.</span>`

Change CSS class `.learn-hero` → `.community-hero` (appears in 3 places: the element class declaration, `:global([data-theme='light']) .learn-hero`, and the scoped style selector `.learn-hero`).

The resulting file should have:
```html
<header class="community-hero">
```
```css
  .community-hero { ... }
  :global([data-theme='light']) .community-hero { ... }
```

---

## Task 7: Update route-middleware.ts and dynamic-sidebar.ts

**Files:**
- Modify: `src/route-middleware.ts` (prefix check at ~line 162)
- Modify: `src/dynamic-sidebar.ts` (filter prefix at ~line 236, back-link href at ~line 263)

**Interfaces:**
- Produces: lesson pages at `docs/learning/lessonN-*` trigger the course sidebar; back-link goes to `/community/`

- [ ] **Step 1: Update route-middleware.ts prefix check**

Find (line ~162):
```typescript
  if (currentSlug.startsWith('docs/community/learning/')) {
```

Replace with:
```typescript
  if (currentSlug.startsWith('docs/learning/')) {
```

- [ ] **Step 2: Update dynamic-sidebar.ts lesson filter and back-link**

Find (line ~236):
```typescript
    .filter((doc) => doc.id.startsWith('docs/community/learning/lesson'))
```

Replace with:
```typescript
    .filter((doc) => doc.id.startsWith('docs/learning/lesson'))
```

Find (line ~263):
```typescript
    href: pathWithBase('/learn/'),
```

Replace with:
```typescript
    href: pathWithBase('/community/'),
```

---

## Task 8: Update agent-fundamentals.yaml course hrefs

**Files:**
- Modify: `src/content/courses/agent-fundamentals.yaml`

**Interfaces:**
- Produces: course lesson hrefs pointing to `/docs/learning/lessonN-*/`

- [ ] **Step 1: Update all 15 hrefs (course entry href + 14 lesson hrefs)**

In `src/content/courses/agent-fundamentals.yaml`, replace all occurrences of `/docs/community/learning/` with `/docs/learning/`. There are 15 occurrences (1 top-level href + 14 in lessons array).

The top-level `href:` becomes:
```yaml
href: /docs/learning/lesson1-how-agents-really-work/
```

Each lesson href becomes (for example lesson 1):
```yaml
    href: /docs/learning/lesson1-how-agents-really-work/
```

---

## Task 9: Update test fixtures in dynamic-sidebar.test.ts

**Files:**
- Modify: `test/dynamic-sidebar.test.ts`

**Interfaces:**
- Consumes: `buildCourseSidebar` which now filters on `docs/learning/lesson` prefix

The tests use `docs/community/learning/lessonN-some-title` fixture IDs which will no longer match the filter `doc.id.startsWith('docs/learning/lesson')`. All test fixtures and expected values must be updated.

- [ ] **Step 1: Update makeLessonDocs helper (two occurrences)**

There are two `makeLessonDocs` functions (one in `buildCourseSidebar` suite, one in `getPrevNextLinks over buildCourseSidebar lessons`).

Change both from:
```typescript
  function makeLessonDocs(nums: number[]): DocInfo[] {
    return nums.map((n) => ({
      id: `docs/community/learning/lesson${n}-some-title`,
      title: `Lesson ${n}: Some Title`,
    }))
  }
```
To:
```typescript
  function makeLessonDocs(nums: number[]): DocInfo[] {
    return nums.map((n) => ({
      id: `docs/learning/lesson${n}-some-title`,
      title: `Lesson ${n}: Some Title`,
    }))
  }
```

- [ ] **Step 2: Update currentSlug references in test assertions**

Find all string literals `'docs/community/learning/lesson...'` in the test file and replace with `'docs/learning/lesson...'`:

Line ~158: `'docs/community/learning/lesson1-some-title'` → `'docs/learning/lesson1-some-title'`
Line ~182: `'docs/community/learning/lesson2-some-title'` → `'docs/learning/lesson2-some-title'`
Line ~197: `'docs/community/learning/lesson1-some-title'` → `'docs/learning/lesson1-some-title'`
Line ~218: `'docs/community/learning/lesson1-some-title'` → `'docs/learning/lesson1-some-title'`
Line ~220: `'docs/community/learning/lesson2-some-title'` → `'docs/learning/lesson2-some-title'`
Line ~232: `'docs/community/learning/lesson2-some-title'` → `'docs/learning/lesson2-some-title'`

- [ ] **Step 3: Update the back-link href test assertion**

Find (line ~203):
```typescript
    expect(backLink.href).toMatch(/\/learn\/$/)
```

Replace with:
```typescript
    expect(backLink.href).toMatch(/\/community\/$/)
```

---

## Task 10: Add redirect.ts test cases for the lesson redirects

**Files:**
- Modify: `test/redirect.test.ts`

**Interfaces:**
- Produces: test coverage that the lesson slugs redirect correctly AND that the learn vanity URL redirects to community

- [ ] **Step 1: Add test cases to the resolveRedirect describe block**

In `test/redirect.test.ts`, inside `describe('resolveRedirect', ...)`, add after the existing community redirect tests:

```typescript
  it('redirects /learn vanity URL to community', () => {
    expect(resolveRedirect('learn')).toBe('community')
  })

  it('redirects docs/community/learning/lesson1 to docs/learning/lesson1', () => {
    expect(resolveRedirect('docs/community/learning/lesson1-how-agents-really-work')).toBe(
      'docs/learning/lesson1-how-agents-really-work'
    )
  })

  it('redirects docs/community/learning/lesson14 to docs/learning/lesson14', () => {
    expect(resolveRedirect('docs/community/learning/lesson14-deploying-agents-to-the-cloud')).toBe(
      'docs/learning/lesson14-deploying-agents-to-the-cloud'
    )
  })
```

---

## Task 11: Run quality checks

- [ ] **Step 1: Run typecheck**

```bash
cd /Users/fjonatse/emdash/worktrees/harness-sdk/feature/learn-page-2gs47/site
npm run typecheck
```

Expected: exit 0, no errors.

- [ ] **Step 2: Run vitest**

```bash
cd /Users/fjonatse/emdash/worktrees/harness-sdk/feature/learn-page-2gs47/site
npx vitest run
```

Expected: all tests pass, exit 0.

- [ ] **Step 3: Clean build**

```bash
cd /Users/fjonatse/emdash/worktrees/harness-sdk/feature/learn-page-2gs47/site
rm -rf .astro && npm run build
```

Expected: exit 0. If it fails, check the error — most likely a missing redirectFrom or a stale reference.

- [ ] **Step 4: Verify routes exist**

```bash
test -f /Users/fjonatse/emdash/worktrees/harness-sdk/feature/learn-page-2gs47/site/dist/community/index.html && \
test -f /Users/fjonatse/emdash/worktrees/harness-sdk/feature/learn-page-2gs47/site/dist/docs/learning/lesson1-how-agents-really-work/index.html && \
echo ROUTES_OK
```

Expected: `ROUTES_OK`

- [ ] **Step 5: Verify lesson link count on community page**

```bash
command grep -c "docs/learning" /Users/fjonatse/emdash/worktrees/harness-sdk/feature/learn-page-2gs47/site/dist/community/index.html
```

Expected: ≥ 14

- [ ] **Step 6: Check no stale docs/community/learning references in source**

```bash
command grep -rn "docs/community/learning" \
  /Users/fjonatse/emdash/worktrees/harness-sdk/feature/learn-page-2gs47/site/src/ \
  --include="*.ts" --include="*.astro" --include="*.yml" --include="*.yaml"
```

Expected: zero matches (redirectFrom entries in .mdx files are OK but .ts/.astro/.yml/.yaml files must be clean).

---

## Task 12: Commit and write report

- [ ] **Step 1: Stage all changes**

```bash
cd /Users/fjonatse/emdash/worktrees/harness-sdk/feature/learn-page-2gs47/site
git add \
  src/content/docs/learning/ \
  src/content.config.ts \
  src/util/redirect.ts \
  src/config/navigation.yml \
  src/pages/community.astro \
  src/components/community/ \
  src/route-middleware.ts \
  src/dynamic-sidebar.ts \
  src/content/courses/agent-fundamentals.yaml \
  test/dynamic-sidebar.test.ts \
  test/redirect.test.ts
```

- [ ] **Step 2: Create the commit**

```bash
cd /Users/fjonatse/emdash/worktrees/harness-sdk/feature/learn-page-2gs47/site
git commit -m "$(cat <<'EOF'
refactor(site): rename learn hub to community, move lessons to docs/learning

Fixes the post-merge build break: after main retired the docs/community/
namespace (glob covers only docs/integrations/**), the 14 lesson MDX files
at docs/community/learning/ were excluded from the docs collection and
navigation.yml references to their old slugs caused the build to fail.

Changes:
- git mv src/content/docs/community/learning → src/content/docs/learning
- Add docs/learning/**/*.mdx to the docs collection glob
- Add redirectFrom frontmatter to all 14 lessons for old slug → new slug
- Add explicit STATIC_SLUG_REDIRECTS entries for all 14 lesson slugs to
  prevent the COMMUNITY_PREFIX_RULE catch-all from sending 404-fallback
  requests to docs/integrations/learning/* (wrong)
- Add 'learn': 'community' vanity redirect
- git mv src/pages/learn.astro → src/pages/community.astro; rename CSS
  classes learn-page/learn-footer/learn-footer-inner and keyframes
- git mv src/components/learn → src/components/community; rename
  LearnHero.astro → CommunityHero.astro; update h1 to "Community."
- Update navigation.yml navbar entry (Learn→Community, /learn/→/community/)
  and sidebar Learning group (14 lesson slugs to docs/learning/*)
- Add /docs/learning/ to navbar Community basePath list so lesson pages
  highlight the Community nav item
- Update route-middleware.ts and dynamic-sidebar.ts lesson prefix and
  back-link href
- Update agent-fundamentals.yaml course hrefs to /docs/learning/
- Update test fixtures in dynamic-sidebar.test.ts and redirect.test.ts

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 3: Write task report**

Write to `/Users/fjonatse/emdash/worktrees/harness-sdk/feature/learn-page-2gs47/.superpowers/sdd/task-14-report.md`:

```markdown
# Task 14 Report: Rename /learn/ → /community/, Move Lessons to docs/learning/

## Step Outcomes

### Step 1: Move lessons to docs/learning/
Completed. `git mv src/content/docs/community/learning src/content/docs/learning`.
All 14 MDX files moved. redirectFrom frontmatter added to each lesson file
following the format used in xai.mdx (no leading/trailing slash).

### Step 2: Glob pattern
Completed. Added `"docs/learning/**/*.mdx"` to docs collection pattern in
src/content.config.ts.

### Step 3: Navigation.yml
Completed. Navbar: Learn→Community, /learn/→/community/; basePath now includes
/docs/learning/ so lesson pages highlight Community. Sidebar: all 14 Learning
group entries updated from docs/community/learning/* to docs/learning/*.

### Step 4: Route + page
Completed. src/pages/learn.astro → src/pages/community.astro. CSS classes
renamed: learn-page→community-page, learn-footer→community-footer,
learn-footer-inner→community-footer-inner. Keyframes renamed:
learn-scroll-primary→community-scroll-primary,
learn-scroll-secondary→community-scroll-secondary.
src/components/learn/ → src/components/community/. LearnHero.astro →
CommunityHero.astro. h1 updated from "Learn." to "Community.".
src/content/courses/agent-fundamentals.yaml: all 15 hrefs updated to
/docs/learning/.

### Step 5: Middleware + sidebar builder
Completed. route-middleware.ts: prefix updated from docs/community/learning/
to docs/learning/. dynamic-sidebar.ts: filter prefix and back-link href
updated to /community/.

### Step 6: Old /learn/ URL
Completed. 'learn': 'community' added to STATIC_SLUG_REDIRECTS in redirect.ts.

## Redirect Precedence Answer (Step 1 investigation)

The COMMUNITY_PREFIX_RULE (a `startsWith('docs/community')` regex) is the last
entry in SLUG_RULES and matches before redirectFromMap is checked in the runtime
404 path. This means `docs/community/learning/lesson1-*` would be redirected to
`docs/integrations/learning/lesson1-*` (wrong) if handled by the 404 fallback.

Fix applied: explicit `exactly(...)` entries in STATIC_SLUG_REDIRECTS for all
14 lesson slugs. Exact-match rules appear before the catch-all in SLUG_RULES
array order and are checked first — exact match wins.

For static build-time redirects (buildStaticRedirects), the slugMap merges
redirectFromEntries then staticRedirects — static entries win on conflict.
Since both point to the same target (docs/learning/lessonN-*), there is no
conflict; both mechanisms produce correct stubs.

## Verification Output

```
npm run typecheck: exit 0
npx vitest run: all tests pass
npm run build: exit 0
ROUTES_OK
grep -c "docs/learning" dist/community/index.html: 28
grep -rn "docs/community/learning" src/ (*.ts/*.astro/*.yml/*.yaml): 0 matches
```
```

*(Update this section with actual command output before finalizing.)*
