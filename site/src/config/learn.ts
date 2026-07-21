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
