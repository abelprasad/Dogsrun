/**
 * DOGSRUN continuous scraping — dedup.
 *
 * Phase 0–1. See docs/continuous-scraping-plan.md section 6. Two layers,
 * never auto-merge a fuzzy match:
 *
 * 1. Exact: UNIQUE (source, source_id) on the import queue / dogs.
 *    Same source + same source ID = same dog, always. Upsert on re-scrape.
 * 2. Fuzzy (human-only): candidate if same shelter AND name
 *    (case-insensitive, trimmed) + breed + sex match AND age within
 *    0.5 years. Photo URL overlap strengthens it. Fuzzy candidates go to
 *    the approval queue flagged `possible_duplicate_of`, and a human
 *    decides merge / keep-both / reject. The agent never merges.
 *
 * Cross-source duplicates (same dog on ACCT + Petfinder) are expected and
 * structural — there is no universal dog ID. They surface as fuzzy
 * candidates, not silently deduped.
 */
import type { ScrapedDog } from './types'
import { parseBreed } from './normalize'

/** Age tolerance for a fuzzy candidate, in years (plan section 6). */
export const FUZZY_AGE_TOLERANCE_YEARS = 0.5

/** Exact-dedup key for (source, source_id). Case-insensitive, trimmed. */
export function exactDuplicateKey(source: string, sourceId: string): string {
  return `${source.trim().toLowerCase()}::${sourceId.trim().toLowerCase()}`
}

type SourceIdRef = Pick<ScrapedDog, 'source' | 'sourceId'>

export function isExactDuplicate(a: SourceIdRef, b: SourceIdRef): boolean {
  return exactDuplicateKey(a.source, a.sourceId) === exactDuplicateKey(b.source, b.sourceId)
}

/** Drop later rows that repeat an earlier (source, source_id). Keeps first. */
export function dedupeExact<T extends SourceIdRef>(dogs: T[]): { unique: T[]; duplicates: T[] } {
  const seen = new Set<string>()
  const unique: T[] = []
  const duplicates: T[] = []
  for (const dog of dogs) {
    const key = exactDuplicateKey(dog.source, dog.sourceId)
    if (seen.has(key)) duplicates.push(dog)
    else {
      seen.add(key)
      unique.push(dog)
    }
  }
  return { unique, duplicates }
}

/** Minimal shape of an already-known dog, for fuzzy comparison. */
export type ExistingDogRef = {
  id: string
  shelterId?: string | null
  name: string
  breed: string
  sex: string
  ageYears: number | null
  photoUrls?: string[]
}

/** A fuzzy candidate. Human-only: the agent never merges on this. */
export type FuzzyCandidate = {
  existingId: string
  reason: string
  photoOverlap: boolean
}

function normalizeName(name: string): string {
  return name.trim().toLowerCase()
}

function normalizeBreedForCompare(breed: string): string {
  return parseBreed(breed).breed.trim().toLowerCase()
}

function normalizeSex(sex: string): string {
  const text = sex.trim().toLowerCase()
  if (text === 'female' || text === 'f') return 'female'
  if (text === 'male' || text === 'm') return 'male'
  return 'unknown'
}

/**
 * Find human-review fuzzy-duplicate candidates for a scraped dog among
 * already-known dogs. Returns flagged candidates only — no merging, no
 * mutation of either input. Rules (plan section 6):
 * - same shelter (when both shelter IDs are known; unknown never excludes),
 * - name case-insensitive + trimmed,
 * - breed (base breed, case-insensitive) matches,
 * - sex matches and is known on both sides (unknown sex never yields a
 *   candidate — exact dedup still catches same-source re-scrapes),
 * - age within 0.5 years when both ages are known (unknown age never
 *   excludes a candidate).
 * Photo URL overlap is reported on the candidate; it never creates one.
 */
export function findFuzzyCandidates(
  dog: Pick<ScrapedDog, 'name' | 'breed' | 'sex' | 'ageYears' | 'photoUrls'> & {
    shelterId?: string | null
  },
  existing: ExistingDogRef[],
): FuzzyCandidate[] {
  const name = normalizeName(dog.name)
  if (!name) return []
  const breed = normalizeBreedForCompare(dog.breed)
  const sex = normalizeSex(dog.sex)
  if (sex === 'unknown') return []
  const dogPhotos = new Set(dog.photoUrls ?? [])
  const candidates: FuzzyCandidate[] = []

  for (const other of existing) {
    if (
      dog.shelterId &&
      other.shelterId &&
      dog.shelterId.trim().toLowerCase() !== other.shelterId.trim().toLowerCase()
    ) {
      continue
    }
    if (normalizeName(other.name) !== name) continue
    if (normalizeBreedForCompare(other.breed) !== breed) continue
    if (normalizeSex(other.sex) !== sex) continue
    if (
      dog.ageYears !== null &&
      dog.ageYears !== undefined &&
      other.ageYears !== null &&
      other.ageYears !== undefined &&
      Math.abs(dog.ageYears - other.ageYears) > FUZZY_AGE_TOLERANCE_YEARS
    ) {
      continue
    }
    const photoOverlap = (other.photoUrls ?? []).some((url) => dogPhotos.has(url))
    candidates.push({
      existingId: other.id,
      reason: `name+breed+sex match, age within ${FUZZY_AGE_TOLERANCE_YEARS}y${photoOverlap ? ', photo overlap' : ''}`,
      photoOverlap,
    })
  }
  return candidates
}
