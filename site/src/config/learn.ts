/**
 * Editorial configuration for the /community/ page.
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
  thumbnail: 'target' | 'question'
}

export const deepDives: DeepDive[] = [
  {
    title: 'How steering hooks hit 100% agent accuracy',
    tag: 'Case study · Blog',
    description: 'A production case study in constraining agent behavior — and the numbers behind the headline.',
    href: '/blog/steering-accuracy-beats-prompts-workflows/',
    thumbnail: 'target',
  },
]

export const suggestTopicHref = 'https://discord.gg/strands'
