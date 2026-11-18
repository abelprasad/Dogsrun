// The four special-needs flags on a dog and the matching `accepts_*` column on
// rescue criteria. Add a flag here and the forms, matching and badges follow.

export const SPECIAL_NEEDS = [
  { key: 'parvo', label: 'Parvo', acceptsKey: 'accepts_parvo' },
  { key: 'tripod', label: 'Tripod / Amputee', acceptsKey: 'accepts_tripod' },
  { key: 'blind', label: 'Blind / Vision Impaired', acceptsKey: 'accepts_blind' },
  { key: 'other_issues', label: 'Other Issues', acceptsKey: 'accepts_other' },
] as const

export type SpecialNeedKey = (typeof SPECIAL_NEEDS)[number]['key']
export type AcceptsKey = (typeof SPECIAL_NEEDS)[number]['acceptsKey']

export function hasSpecialNeeds(dog: Partial<Record<SpecialNeedKey, boolean | null>>): boolean {
  return SPECIAL_NEEDS.some(({ key }) => Boolean(dog[key]))
}

/** True when the dog has a special need the criteria does not accept. */
export function violatesSpecialNeeds(
  dog: Partial<Record<SpecialNeedKey, boolean | null>>,
  criteria: Partial<Record<AcceptsKey, boolean | null>>,
): boolean {
  return SPECIAL_NEEDS.some(({ key, acceptsKey }) => dog[key] && !criteria[acceptsKey])
}
