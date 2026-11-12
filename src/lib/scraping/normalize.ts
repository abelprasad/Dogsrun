/**
 * DOGSRUN continuous scraping — normalization helpers.
 *
 * Phase 0–1. See docs/continuous-scraping-plan.md section 5.
 * Rules:
 * - Age: "2 years" -> 2, "6 months" -> 0.5, "8 weeks" -> 0.15,
 *   unparseable -> null. Shelterluv's compact form "5Y/8M/1W" is also parsed.
 * - Sex: male/female/unknown only; anything else -> unknown.
 * - Breed: as listed; "Mixed Breed" / "Mix" -> mix: true, breed = base breed.
 * - Photos: keep source URLs; the first becomes `photo_url` on approval.
 *   No downloading/re-hosting in Phase 0–1.
 * - Description: strip HTML, trim, cap at 2,000 chars.
 * - Missing name -> skip the dog (normalizeScrapedDog returns null);
 *   a nameless row is not importable.
 */
import type { ScrapedDog, ScrapedSex } from './types'

export const DESCRIPTION_MAX_CHARS = 2000

function round2(value: number): number {
  return Math.round(value * 100) / 100
}

const YEAR_MS = 365.25 * 24 * 60 * 60 * 1000

/**
 * Parse an age string into years, or null when it cannot be parsed.
 * Accepts "2 years", "6 months", "8 weeks", "1 year 7 months",
 * "3 yrs 11 mos", Shelterluv compact "5Y/8M/1W", and a bare number
 * (treated as years). Weeks use 52 weeks/year, months 12 months/year.
 */
export function parseAgeYears(raw: string | number | null | undefined): number | null {
  if (raw === null || raw === undefined) return null
  if (typeof raw === 'number') {
    return Number.isFinite(raw) && raw >= 0 ? round2(raw) : null
  }
  const text = raw.trim().toLowerCase()
  if (!text || text === 'unknown' || text === 'not available' || text === 'n/a') return null

  // Shelterluv compact form: "5Y/8M/1W" (years/months/weeks).
  const compact = text.match(/^(\d+)\s*y\s*\/\s*(\d+)\s*m\s*\/\s*(\d+)\s*w$/)
  if (compact) {
    const years = Number(compact[1]) + Number(compact[2]) / 12 + Number(compact[3]) / 52
    return round2(years)
  }

  // Number + unit pairs, e.g. "1 year 7 months", "3 yrs 11 mos", "8 weeks".
  let total = 0
  let matched = false
  const pairPattern = /(\d+(?:\.\d+)?)\s*(years?|yrs?|months?|mos?|weeks?|wks?|days?)/g
  for (const match of text.matchAll(pairPattern)) {
    matched = true
    const value = Number(match[1])
    const unit = match[2]
    if (unit.startsWith('y')) total += value
    else if (unit.startsWith('mo')) total += value / 12
    else if (unit.startsWith('w')) total += value / 52
    else if (unit.startsWith('d')) total += value / 365.25
  }
  if (matched) return round2(total)

  // Bare number, e.g. "2" in an age field, treated as years.
  const bare = text.match(/^(\d+(?:\.\d+)?)$/)
  if (bare) return round2(Number(bare[1]))

  return null
}

/** Parse a Shelterluv unix `birthday` (seconds or ms) into age in years. */
export function parseBirthdayAge(
  birthday: string | number | null | undefined,
  nowMs: number = Date.now(),
): number | null {
  if (birthday === null || birthday === undefined || birthday === '') return null
  const numeric = typeof birthday === 'number' ? birthday : Number(String(birthday).trim())
  if (!Number.isFinite(numeric) || numeric <= 0) return null
  // 10 digits = seconds, 13 digits = milliseconds.
  const birthdayMs = numeric < 1e11 ? numeric * 1000 : numeric
  if (birthdayMs > nowMs) return null
  return round2((nowMs - birthdayMs) / YEAR_MS)
}

/** male/female/unknown only; anything else (including 'Unknown') -> unknown. */
export function parseSex(raw: string | null | undefined): ScrapedSex {
  if (!raw) return 'unknown'
  const text = raw.trim().toLowerCase()
  if (text === 'female' || text === 'f') return 'female'
  if (text === 'male' || text === 'm') return 'male'
  return 'unknown'
}

const SIZE_SUFFIX = /^\s*\((small|medium|large|x-?large|extra large|toy|giant)\)\s*$/i

/**
 * Split a listed breed into base breed + mix flag.
 * "Mixed Breed (Medium)" -> { breed: 'Mixed Breed', mix: true }
 * "Labrador Retriever Mix" -> { breed: 'Labrador Retriever', mix: true }
 * "Terrier, American Staffordshire/Mixed Breed (Medium)" ->
 *   { breed: 'Terrier, American Staffordshire', mix: true }
 * A real `secondaryBreed` of "Mix" also sets mix; any other secondary breed
 * is ignored (the dogs table holds a single breed string).
 */
export function parseBreed(
  raw: string | null | undefined,
  secondaryBreed?: string | null,
): { breed: string; mix: boolean } {
  let base = (raw ?? '').trim()
  // Drop a trailing size parenthetical, e.g. " (Medium)".
  base = base.replace(/\s*\([^)]*\)\s*$/, (paren) => (SIZE_SUFFIX.test(paren) ? '' : paren)).trim()

  const secondary = (secondaryBreed ?? '').trim()
  const mixWord = /\bmix\b|\bmixed\b/i
  const isMix =
    mixWord.test(base) ||
    base.toLowerCase() === 'mixed breed' ||
    base.toLowerCase().startsWith('mixed breed') ||
    secondary.toLowerCase() === 'mix'

  let breed = base
    .replace(/\s*\/\s*mixed breed\s*/gi, '')
    .replace(/\s+mixed breed\s*/gi, '')
    .replace(/\s+mix\s*$/i, '')
    .trim()
  if (!breed) breed = 'Mixed Breed'
  if (!base) breed = 'Unknown'
  return { breed, mix: isMix }
}

/** "63.4 lbs" -> 63.4, "40 lbs" -> 40, unparseable -> null. */
export function parseWeightLbs(raw: string | number | null | undefined): number | null {
  if (raw === null || raw === undefined) return null
  if (typeof raw === 'number') {
    return Number.isFinite(raw) && raw >= 0 ? Math.round(raw * 10) / 10 : null
  }
  const match = raw.match(/(\d+(?:\.\d+)?)\s*(?:lbs?|pounds?)?/i)
  if (!match) return null
  const value = Number(match[1])
  return Number.isFinite(value) && value >= 0 ? Math.round(value * 10) / 10 : null
}

/** Strip HTML, decode common entities, collapse whitespace, cap at 2,000 chars. */
export function cleanDescription(html: string | null | undefined): string {
  if (!html) return ''
  const text = html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&amp;/gi, '&')
    .replace(/\s+/g, ' ')
    .trim()
  return text.length > DESCRIPTION_MAX_CHARS ? text.slice(0, DESCRIPTION_MAX_CHARS) : text
}

/** Pull a stable source ID (e.g. 'ACCT-A-235558') out of a listing URL. */
export function extractSourceIdFromUrl(url: string): string | null {
  const direct = url.match(/([A-Za-z]+-A-\d+)/)
  if (direct) return direct[1]
  const path = url.match(/\/animal\/([A-Za-z0-9-]+)/)
  return path ? path[1] : null
}

export type RawScrapedDogInput = {
  source: string
  sourceId: string
  sourceUrl: string
  name: string | null | undefined
  breed?: string | null
  secondaryBreed?: string | null
  ageYears?: number | null
  birthday?: string | number | null
  weightLbs?: string | number | null
  sex?: string | null
  color?: Array<string | null> | null
  description?: string | null
  photoUrls?: string[] | null
  status?: ScrapedDog['status']
  intakeDate?: string | null
  euthanasiaDate?: string | null
  scrapedAt?: string
}

/**
 * Single normalization entry point. Returns null when the dog has no name —
 * a nameless row is not importable, so the caller logs it and skips it.
 */
export function normalizeScrapedDog(input: RawScrapedDogInput): ScrapedDog | null {
  const name = (input.name ?? '').trim()
  if (!name) return null
  const { breed, mix } = parseBreed(input.breed, input.secondaryBreed)
  const ageYears = input.ageYears ?? parseBirthdayAge(input.birthday)
  const color = Array.from(
    new Set((input.color ?? []).map((c) => (c ?? '').trim()).filter(Boolean)),
  )
  const photoUrls = Array.from(
    new Set(
      (input.photoUrls ?? [])
        .map((u) => (u ?? '').trim())
        .filter((u) => u.startsWith('http://') || u.startsWith('https://')),
    ),
  )
  return {
    source: input.source,
    sourceId: input.sourceId.trim(),
    sourceUrl: input.sourceUrl,
    name,
    breed,
    mix,
    ageYears,
    weightLbs: parseWeightLbs(input.weightLbs),
    sex: parseSex(input.sex),
    color,
    description: cleanDescription(input.description),
    photoUrls,
    status: input.status ?? 'available',
    intakeDate: input.intakeDate ?? null,
    euthanasiaDate: input.euthanasiaDate ?? null,
    scrapedAt: input.scrapedAt ?? new Date().toISOString(),
  }
}
