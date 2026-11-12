/**
 * DOGSRUN continuous scraping — ACCT Philly (Shelterluv embed) adapter.
 *
 * Phase 0–1. See docs/continuous-scraping-plan.md sections 3–4.
 *
 * How the embed actually works (verified live Nov 11, 2026):
 * - Detail pages are server-rendered shells at
 *   https://www.shelterluv.com/embed/animal/ACCT-A-<id> carrying the full
 *   animal record as JSON in an `:animal="..."` attribute, plus
 *   `window.shelterId = 13458` (ACCT's Shelterluv shelter ID).
 * - The bare list URL `/embed/animal/list` does NOT scope to ACCT: it
 *   renders a different shelter (The Bond Between, shelterId 38131).
 *   Neither path segments, query params, nor Referer change that, so the
 *   adapter does not use the bare list URL as the source of dogs.
 * - The list the embed renders comes from its own backing endpoint,
 *   `GET /api/v3/available-animals/13458`, fetched same-origin by the
 *   embed SPA. listDogs() loads the embed in a real headless browser and
 *   reads that endpoint in-page, exactly as the embed does — one request
 *   returns the whole available list (375 animals across species at
 *   probe time), filtered to dogs here.
 * - If that endpoint ever changes shape, listDogs() falls back to the
 *   rendered list DOM: paginated list pages (polite delay, max pages),
 *   verified to be ACCT's shelter, with each entry enriched via its
 *   detail page. The fallback only accepts ACCT-A-* IDs, so a
 *   wrong-shelter render yields zero entries, never wrong-shelter dogs.
 *
 * Politeness / safety rules (plan section 4):
 * - Headless Playwright, one browser, one context, realistic user agent.
 * - Polite delay >= 1s between page navigations, max ~50 pages per run.
 * - Stop the run on HTTP 403 / 429 / CAPTCHA / bot challenge: log it, do
 *   not retry in the same run, never solve CAPTCHAs. A blocked run is a
 *   failed sync (AdapterBlockedError), not an empty import.
 * - Zero dogs is also a failed run, never an empty import.
 */
import { chromium, type Page } from '@playwright/test'
import {
  AdapterBlockedError,
  type BlockReason,
  type ScrapedDog,
  type ScrapingSource,
  type ShelterAdapter,
} from '../types'
import { normalizeScrapedDog, parseAgeYears } from '../normalize'

export const ACCT_SOURCE: ScrapingSource = 'acct-shelterluv'
export const ACCT_SHELTER_NAME = 'ACCT Philly'
/** ACCT's Shelterluv shelter ID (from `window.shelterId` on ACCT pages). */
export const ACCT_SHELTER_ID = 13458
export const ACCT_LIST_URL = 'https://www.shelterluv.com/embed/animal/list'
export const ACCT_DETAIL_URL_PREFIX = 'https://www.shelterluv.com/embed/animal/'
/** Backing endpoint of the Shelterluv embed list (same-origin, in-page). */
export const ACCT_AVAILABLE_ANIMALS_API = '/api/v3/available-animals/13458'
export const ACCT_SOURCE_ID_PATTERN = /^ACCT-A-\d+$/

/** Polite delay between page navigations (plan: >= 1s). */
export const POLITE_DELAY_MS = 1500
/** Max list pages per run (plan: ~50). */
export const MAX_PAGES_PER_RUN = 50
/** Max detail-page enrichments on the DOM fallback path. */
export const MAX_DETAIL_FETCHES = 200

const REALISTIC_USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export function acctDetailUrl(sourceId: string): string {
  return `${ACCT_DETAIL_URL_PREFIX}${sourceId}`
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** Decode the HTML entities in a server-rendered attribute value. */
function unescapeHtmlAttr(value: string): string {
  return value
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&amp;/gi, '&')
}

type ShelterluvPhoto = { url?: unknown; isCover?: unknown; order_column?: unknown }

/**
 * Photos arrive as an array on detail pages and as a keyed object
 * ({"0": {...}}) on the list endpoint. Cover photo first, then
 * order_column. Shelterluv placeholder images are dropped.
 */
export function normalizeShelterluvPhotos(photos: unknown): string[] {
  const list: ShelterluvPhoto[] = []
  if (Array.isArray(photos)) {
    for (const item of photos) if (isRecord(item)) list.push(item)
  } else if (isRecord(photos)) {
    for (const item of Object.values(photos)) if (isRecord(item)) list.push(item)
  }
  const withMeta = list
    .map((photo) => ({
      url: typeof photo.url === 'string' ? photo.url : '',
      isCover: photo.isCover === true,
      order: typeof photo.order_column === 'number' ? photo.order_column : Number.MAX_SAFE_INTEGER,
    }))
    .filter(
      (photo) =>
        (photo.url.startsWith('http://') || photo.url.startsWith('https://')) &&
        !/default_(dog|cat|animal)\.png/i.test(photo.url),
    )
    .sort((a, b) => Number(b.isCover) - Number(a.isCover) || a.order - b.order)
  return Array.from(new Set(withMeta.map((photo) => photo.url)))
}

/**
 * Map one Shelterluv animal record (detail JSON or list-endpoint JSON)
 * into a ScrapedDog. Returns null for non-dogs, non-ACCT IDs, and
 * nameless rows (the latter is logged by the caller, not imported).
 * Note: list-endpoint records carry `weight_group` but no `weight`, so
 * weightLbs is usually null from listDogs(); fetchDog() (detail page)
 * does return a weight.
 */
export function mapShelterluvAnimal(raw: unknown, scrapedAt?: string): ScrapedDog | null {
  if (!isRecord(raw)) return null
  if (typeof raw.species === 'string' && raw.species !== 'Dog') return null
  const sourceId = typeof raw.uniqueId === 'string' ? raw.uniqueId.trim() : ''
  if (!ACCT_SOURCE_ID_PATTERN.test(sourceId)) return null
  const sourceUrl =
    typeof raw.public_url === 'string' && raw.public_url
      ? raw.public_url
      : acctDetailUrl(sourceId)
  return normalizeScrapedDog({
    source: ACCT_SOURCE,
    sourceId,
    sourceUrl,
    name: typeof raw.name === 'string' ? raw.name : null,
    breed: typeof raw.breed === 'string' ? raw.breed : null,
    secondaryBreed: typeof raw.secondary_breed === 'string' ? raw.secondary_breed : null,
    birthday:
      typeof raw.birthday === 'string' || typeof raw.birthday === 'number' ? raw.birthday : null,
    weightLbs:
      typeof raw.weight === 'string' || typeof raw.weight === 'number' ? raw.weight : null,
    sex: typeof raw.sex === 'string' ? raw.sex : null,
    color: [raw.primary_color, raw.secondary_color].filter(
      (color): color is string => typeof color === 'string',
    ),
    description: typeof raw.kennel_description === 'string' ? raw.kennel_description : null,
    photoUrls: normalizeShelterluvPhotos(raw.photos),
    status: 'available',
    intakeDate: typeof raw.intake_date === 'string' ? raw.intake_date : null,
    // ACCT urgency/euthanasia dates are not exposed by the embed; they
    // live in ACCT's at-risk posts. Left null until a source exists.
    euthanasiaDate: null,
    scrapedAt,
  })
}

/** Read `window.shelterId = <n>` out of a server-rendered embed shell. */
export function extractShelterId(html: string): number | null {
  const match = html.match(/window\.shelterId\s*=\s*(\d+)/)
  return match ? Number(match[1]) : null
}

/**
 * Detect a block / bot challenge in a fetched page. Runs on rendered text
 * (scripts/styles stripped) so JS bundle words cannot false-positive.
 * Never triggers a CAPTCHA solve — the caller throws instead.
 */
export function detectBlock(html: string, status: number): BlockReason | null {
  if (status === 403) return 'http-403'
  if (status === 429) return 'http-429'
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .slice(0, 20000)
  if (/captcha|hcaptcha|recaptcha|verify you are human|are you a robot/i.test(text)) {
    return 'captcha'
  }
  if (
    /just a moment|attention required/i.test(text) &&
    /cloudflare|checking your browser|ray id/i.test(text)
  ) {
    return 'bot-challenge'
  }
  return null
}

export type ShelterluvListEntry = {
  sourceId: string
  sourceUrl: string
  name: string | null
  photoUrl: string | null
}

/**
 * Parse a rendered Shelterluv list page for animal links. Only ACCT-A-*
 * IDs are accepted. Dedupes repeat links; name comes from the card's
 * image alt text, falling back to the link's text.
 */
export function parseShelterluvListHtml(html: string): ShelterluvListEntry[] {
  const entries: ShelterluvListEntry[] = []
  const seen = new Set<string>()
  const anchorPattern =
    /<a\b[^>]*href="([^"]*?\/embed\/animal\/(ACCT-A-\d+)[^"]*)"[^>]*>([\s\S]*?)<\/a>/gi
  for (const match of html.matchAll(anchorPattern)) {
    const sourceId = match[2]
    if (seen.has(sourceId)) continue
    seen.add(sourceId)
    const inner = match[3]
    const img = inner.match(/<img\b[^>]*src="([^"]+)"[^>]*>/i)
    const alt = inner.match(/<img\b[^>]*alt="([^"]*)"[^>]*>/i)
    const nameText = inner
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
    const href = match[1]
    entries.push({
      sourceId,
      sourceUrl: href.startsWith('http') ? href : `https://www.shelterluv.com${href}`,
      name: alt?.[1]?.trim() || nameText || null,
      photoUrl: img?.[1] ?? null,
    })
  }
  return entries
}

/** Find a "next page" link on a rendered list page, if one exists. */
export function findNextPageUrl(html: string, currentUrl: string): string | null {
  const relNext = html.match(/<a\b[^>]*rel=["']next["'][^>]*href="([^"]+)"[^>]*>/i)
  const candidates = relNext
    ? [relNext[1]]
    : Array.from(
        html.matchAll(
          /<a\b[^>]*href="([^"]+)"[^>]*>\s*(?:next|›|»|→)\s*<\/a>/gi,
        ),
        (match) => match[1],
      )
  if (candidates.length === 0) return null
  try {
    return new URL(candidates[0], currentUrl).toString()
  } catch {
    return null
  }
}

function parseShelterluvDetailText(html: string, sourceUrl: string): ScrapedDog | null {
  const titleMatch = html.match(/<title>([^<]*)<\/title>/i)
  const name = titleMatch
    ? titleMatch[1].replace(/\s+is available for adoption.*$/i, '').trim()
    : ''
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, '\n')
    .replace(/&nbsp;/gi, ' ')
    .replace(/[ \t]+/g, ' ')
  const field = (label: string): string | null => {
    const match = text.match(new RegExp(`${label}\\s+([^\\n]+)`, 'i'))
    return match ? match[1].trim() : null
  }
  const sourceId = field('ANIMAL ID') ?? ''
  if (!ACCT_SOURCE_ID_PATTERN.test(sourceId)) return null
  const photoUrls = Array.from(
    new Set(
      Array.from(
        html.matchAll(
          /https:\/\/new-s3\.shelterluv\.com\/profile-pictures\/[A-Za-z0-9_\-/.]+/g,
        ),
        (match) => match[0],
      ),
    ),
  )
  return normalizeScrapedDog({
    source: ACCT_SOURCE,
    sourceId,
    sourceUrl,
    name,
    breed: field('BREED'),
    secondaryBreed: null,
    ageYears: parseAgeYears(field('AGE')),
    weightLbs: field('WEIGHT'),
    sex: field('SEX'),
    color: [],
    description: null,
    photoUrls,
    status: 'available',
    intakeDate: null,
    euthanasiaDate: null,
  })
}

/**
 * Parse a Shelterluv embed detail page. Prefers the server-rendered
 * `:animal="..."` JSON blob (full record); falls back to the rendered
 * label/value text (ANIMAL ID / BREED / SEX / WEIGHT / AGE) when the
 * blob is absent. Returns null when the page is not an ACCT dog.
 */
export function parseShelterluvDetailHtml(html: string, sourceUrl: string): ScrapedDog | null {
  const jsonMatch = html.match(/:animal="([\s\S]*?)"\s*:show-adoption-link/)
  if (jsonMatch) {
    try {
      const parsed: unknown = JSON.parse(unescapeHtmlAttr(jsonMatch[1]))
      const dog = mapShelterluvAnimal(parsed)
      if (dog) return { ...dog, sourceUrl }
    } catch {
      // Fall through to the DOM-text fallback below.
    }
  }
  return parseShelterluvDetailText(html, sourceUrl)
}

export type AcctAdapterOptions = {
  listUrl?: string
  maxPages?: number
  politeDelayMs?: number
  maxDetailFetches?: number
  headless?: boolean
}

export class AcctShelterluvAdapter implements ShelterAdapter {
  readonly source: ScrapingSource = ACCT_SOURCE
  readonly shelterName = ACCT_SHELTER_NAME

  private readonly listUrl: string
  private readonly maxPages: number
  private readonly politeDelayMs: number
  private readonly maxDetailFetches: number
  private readonly headless: boolean

  constructor(options: AcctAdapterOptions = {}) {
    this.listUrl = options.listUrl ?? ACCT_LIST_URL
    this.maxPages = options.maxPages ?? MAX_PAGES_PER_RUN
    // Never below 1s between pages (plan section 4).
    this.politeDelayMs = Math.max(1000, options.politeDelayMs ?? POLITE_DELAY_MS)
    this.maxDetailFetches = options.maxDetailFetches ?? MAX_DETAIL_FETCHES
    this.headless = options.headless ?? true
  }

  async listDogs(): Promise<ScrapedDog[]> {
    const browser = await chromium.launch({ headless: this.headless })
    try {
      const context = await browser.newContext({ userAgent: REALISTIC_USER_AGENT })
      const page = await context.newPage()
      const response = await page.goto(this.listUrl, {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      })
      const status = response?.status() ?? 0
      const shellHtml = await page.content()
      const block = detectBlock(shellHtml, status)
      if (block) {
        throw new AdapterBlockedError(
          this.source,
          block,
          `ACCT list page blocked (HTTP ${status}); run stopped, nothing imported`,
        )
      }

      // Primary path: the embed's own backing endpoint, read in-page so
      // the request is same-origin with the browser session.
      const result = await page.evaluate(async (apiPath: string) => {
        const res = await fetch(apiPath, { headers: { accept: 'application/json' } })
        const text = await res.text()
        let json: unknown = null
        try {
          json = JSON.parse(text)
        } catch {
          // Non-JSON error body; reported via `text` below.
        }
        return { status: res.status, json, text: json === null ? text.slice(0, 500) : '' }
      }, ACCT_AVAILABLE_ANIMALS_API)

      if (result.status === 403) {
        throw new AdapterBlockedError(
          this.source,
          'http-403',
          'ACCT animals endpoint returned 403; run stopped, nothing imported',
        )
      }
      if (result.status === 429) {
        throw new AdapterBlockedError(
          this.source,
          'http-429',
          'ACCT animals endpoint returned 429; run stopped, nothing imported',
        )
      }
      if (isRecord(result.json) && Array.isArray(result.json.animals)) {
        const dogs: ScrapedDog[] = []
        for (const raw of result.json.animals) {
          const dog = mapShelterluvAnimal(raw)
          if (dog) dogs.push(dog)
        }
        if (dogs.length === 0) {
          throw new AdapterBlockedError(
            this.source,
            'zero-dogs',
            'ACCT list returned zero dogs — treated as a failed run, not an empty shelter',
          )
        }
        return dogs
      }

      // Fallback path: the endpoint changed shape. Crawl the rendered
      // list DOM instead (paginated, polite, shelter-verified).
      return await this.listDogsViaDom(page)
    } finally {
      await browser.close()
    }
  }

  /**
   * DOM fallback for listDogs(): collect ACCT entries across paginated
   * list pages, then enrich each via its detail page. Bounded by
   * maxPages and maxDetailFetches, with a polite delay between every
   * navigation. Throws AdapterBlockedError on any block or on zero dogs.
   */
  private async listDogsViaDom(page: Page): Promise<ScrapedDog[]> {
    const entries: ShelterluvListEntry[] = []
    const seenIds = new Set<string>()
    let url: string | null = this.listUrl
    for (let pageIndex = 0; pageIndex < this.maxPages && url; pageIndex++) {
      if (pageIndex > 0) await sleep(this.politeDelayMs)
      const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 })
      const status = response?.status() ?? 0
      const html = await page.content()
      const block = detectBlock(html, status)
      if (block) {
        throw new AdapterBlockedError(
          this.source,
          block,
          `ACCT list page blocked on page ${pageIndex + 1} (HTTP ${status}); run stopped`,
        )
      }
      const shelterId = extractShelterId(html)
      if (shelterId !== null && shelterId !== ACCT_SHELTER_ID) {
        throw new AdapterBlockedError(
          this.source,
          'site-changed',
          `List page rendered shelter ${shelterId}, expected ACCT ${ACCT_SHELTER_ID}`,
        )
      }
      const pageEntries = parseShelterluvListHtml(html)
      if (pageEntries.length === 0) break
      for (const entry of pageEntries) {
        if (!seenIds.has(entry.sourceId)) {
          seenIds.add(entry.sourceId)
          entries.push(entry)
        }
      }
      url = findNextPageUrl(html, url)
    }
    if (entries.length === 0) {
      throw new AdapterBlockedError(
        this.source,
        'zero-dogs',
        'ACCT list rendered zero dogs — treated as a failed run, not an empty shelter',
      )
    }
    const limited = entries.slice(0, this.maxDetailFetches)
    const dogs: ScrapedDog[] = []
    for (const entry of limited) {
      await sleep(this.politeDelayMs)
      const dog = await this.fetchDogOnPage(page, entry.sourceId)
      if (dog) dogs.push(dog)
    }
    if (dogs.length === 0) {
      throw new AdapterBlockedError(
        this.source,
        'zero-dogs',
        'ACCT list entries could not be read as dogs — treated as a failed run',
      )
    }
    return dogs
  }

  async fetchDog(id: string): Promise<ScrapedDog | null> {
    if (!ACCT_SOURCE_ID_PATTERN.test(id.trim())) return null
    const browser = await chromium.launch({ headless: this.headless })
    try {
      const context = await browser.newContext({ userAgent: REALISTIC_USER_AGENT })
      const page = await context.newPage()
      return await this.fetchDogOnPage(page, id.trim())
    } finally {
      await browser.close()
    }
  }

  private async fetchDogOnPage(page: Page, id: string): Promise<ScrapedDog | null> {
    const url = acctDetailUrl(id)
    // Prefer the raw server-rendered shell: it carries the full `:animal`
    // JSON blob, which Vue strips from the DOM during hydration, so
    // page.content() after render only supports the text fallback (which
    // loses color and any JSON-only fields).
    try {
      const apiResponse = await page.request.get(url, { timeout: 30000 })
      const apiStatus = apiResponse.status()
      if (apiStatus === 404) return null
      const apiHtml = await apiResponse.text()
      const apiBlock = detectBlock(apiHtml, apiStatus)
      if (apiBlock) {
        throw new AdapterBlockedError(
          this.source,
          apiBlock,
          `ACCT detail page for ${id} blocked (HTTP ${apiStatus}); run stopped`,
        )
      }
      const apiDog = parseShelterluvDetailHtml(apiHtml, url)
      if (apiDog) return apiDog
      // Blob absent or unparseable: fall through to the rendered DOM.
    } catch (error) {
      if (error instanceof AdapterBlockedError) throw error
      // Request failed (timeout/network): fall through to navigation.
    }
    const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 })
    const status = response?.status() ?? 0
    if (status === 404) return null
    let html = await page.content()
    const block = detectBlock(html, status)
    if (block) {
      throw new AdapterBlockedError(
        this.source,
        block,
        `ACCT detail page for ${id} blocked (HTTP ${status}); run stopped`,
      )
    }
    // Let the SPA finish rendering the label/value text (the JSON blob is
    // server-rendered, so this only matters for the text fallback).
    await page
      .waitForSelector('text=ANIMAL ID', { timeout: 8000 })
      .catch(() => undefined)
    html = await page.content()
    return parseShelterluvDetailHtml(html, url)
  }
}
