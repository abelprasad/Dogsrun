const unsplash = (photoId: string, width: number) =>
  `https://images.unsplash.com/${photoId}?auto=format&fit=crop&w=${width}&q=85`

export const HERO_PHOTO_ID = 'photo-1587300003388-59208cc962cb'
export const RESCUE_PHOTO_ID = 'photo-1561037404-61cd46aa615b'

export const heroPhoto = (width: number) => unsplash(HERO_PHOTO_ID, width)
export const rescuePhoto = (width: number) => unsplash(RESCUE_PHOTO_ID, width)

/** Headline network stats, in homepage order. */
export const NETWORK_STATS: Array<[string, string]> = [
  ['50+', 'states in the network'],
  ['24/7', 'matching, always on'],
  ['1-click', 'rescue response'],
]

export const ORG = {
  legalName: 'Dog Shelter & Rescue Unification Network, LLC',
  ein: '993286395',
  phone: '(904) 923-4441',
  phoneHref: 'tel:+19049234441',
  addressLines: ['221 W 9th St #896', 'Wilmington, DE 19801'],
} as const
