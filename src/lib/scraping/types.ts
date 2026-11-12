/**
 * DOGSRUN continuous scraping — normalized types + adapter interface.
 *
 * Phase 0–1. See docs/continuous-scraping-plan.md sections 4–5.
 * Everything maps into the existing `dogs` table fields; nothing new is
 * invented on the dog row. All writes go through API routes with the
 * service-role key (Phase 1); this phase writes nothing to Supabase.
 */

export type ScrapingSource = 'acct-shelterluv' | 'pspca-petango' | 'petfinder-api'

export type ScrapedDogStatus = 'available' | 'adopted' | 'unavailable'

export type ScrapedSex = 'male' | 'female' | 'unknown'

export type ScrapedDog = {
  source: string // 'acct-shelterluv' | 'pspca-petango' | 'petfinder-api'
  sourceId: string // stable ID on the source site (e.g. 'ACCT-A-264698')
  sourceUrl: string // canonical listing URL, for the approval queue
  name: string
  breed: string
  mix: boolean
  ageYears: number | null // parsed from '2 years', '6 months', '8 weeks'
  weightLbs: number | null
  sex: ScrapedSex
  color: string[]
  description: string
  photoUrls: string[] // store URLs, do NOT re-host photos in this phase
  status: ScrapedDogStatus // source status, mapped later
  intakeDate: string | null
  euthanasiaDate: string | null // ACCT urgent dogs only, when shown
  scrapedAt: string // ISO timestamp of this scrape
}

export interface ShelterAdapter {
  source: ScrapingSource
  shelterName: string
  /** Paginate until empty, polite delay. Throws AdapterBlockedError on a block. */
  listDogs(): Promise<ScrapedDog[]>
  /** Single-ID re-check (stale handling). Returns null when the dog is gone (404). */
  fetchDog(id: string): Promise<ScrapedDog | null>
}

/**
 * Why a run stopped without producing a usable list. A blocked run is a
 * failed sync, not an empty import — it must never mark dogs stale.
 */
export type BlockReason =
  | 'http-403'
  | 'http-429'
  | 'captcha'
  | 'bot-challenge'
  | 'site-changed'
  | 'zero-dogs'
  | 'network'
  | 'unknown'

export class AdapterBlockedError extends Error {
  readonly reason: BlockReason
  readonly source: string

  constructor(source: string, reason: BlockReason, message: string) {
    super(message)
    this.name = 'AdapterBlockedError'
    this.source = source
    this.reason = reason
  }
}

export interface SyncRunSummary {
  source: string
  startedAt: string
  finishedAt: string
  dogsSeen: number
  dogsNew: number
  status: 'ok' | 'failed' | 'blocked'
  error?: string
}
