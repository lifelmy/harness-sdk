/**
 * Client-side event expiry: remove events whose end (or start) date is past today.
 * Progressive enhancement — build-time filtering is the primary gate; this is the
 * freshness backstop.
 *
 * Exported for testability; community.astro's inline script imports and calls it.
 */

/**
 * Remove expired `[data-expires]` elements from the given root, then adjust
 * the ticker, poster, and events list to reflect what remains.
 *
 * @param root     - The document or a scoped element to search within.
 * @param todayIso - Today's date as an ISO 8601 string (YYYY-MM-DD).
 */
export function expireEvents(root: Document | Element, todayIso: string): void {
  root.querySelectorAll<HTMLElement>('[data-expires]').forEach((el) => {
    if (el.dataset.expires! < todayIso) el.remove()
  })

  // If the ticker has no event entries left, hide it entirely.
  const ticker = root.querySelector<HTMLElement>('.ticker')
  if (ticker && !ticker.querySelector('[data-expires]')) ticker.hidden = true

  // Poster: drop the other-events list when all its rows expired (avoids a
  // stray border-top rule), and fall back to evergreen only when nothing
  // dated is left in the poster — an expired headliner alone must not hide
  // still-upcoming rows.
  const poster = root.querySelector<HTMLElement>('.poster')
  if (poster) {
    const list = poster.querySelector<HTMLElement>('.list')
    if (list) {
      if (!list.querySelector('[data-expires]')) {
        list.remove()
      } else if (!poster.querySelector('#poster-headliner')) {
        // Headliner expired but rows remain — remove the top border so the
        // list doesn't float with a decorative gap above it.
        list.classList.add('list--bare')
      }
    }
    if (!poster.querySelector('[data-expires]')) {
      const evergreen = root.querySelector<HTMLElement>('#poster-evergreen')
      if (evergreen) evergreen.removeAttribute('hidden')
      const cal = root.querySelector<HTMLElement>('#poster-cal')
      if (cal) cal.textContent = 'Join the Discord →'
    }
  }
}
