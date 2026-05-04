/**
 * DOGSRUN - authenticated integration smoke test
 *
 * Creates real Supabase Auth users, approved shelter/rescue orgs, rescue criteria,
 * and dogs. It signs in through the app before calling protected endpoints, so the
 * script matches the current auth model.
 *
 * Usage:
 *   npx tsx scripts/seed-test.ts
 *   npx tsx scripts/seed-test.ts --keep-data
 *   npx tsx scripts/seed-test.ts --cleanup
 *
 * Requirements:
 *   - npm run dev running on http://localhost:3000
 *   - .env.local with Supabase URL, anon key, service role key, and Resend key
 */

import { createClient } from '@supabase/supabase-js'
import { chromium, type Browser, type Page } from '@playwright/test'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.join(process.cwd(), '.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const BASE = 'http://localhost:3000'
const PASSWORD = 'DogsrunSeedTest!123'
const KEEP_DATA = process.argv.includes('--keep-data')
const CLEANUP_ONLY = process.argv.includes('--cleanup')

const TEST_EMAILS = {
  shelter: 'test-shelter@dogsrun-test.local',
  rescue: 'test-rescue@dogsrun-test.local',
}

type SeedContext = {
  shelterId: string
  rescueId: string
  shelterPage: Page
  browser: Browser
}

type TestDog = {
  id: string
  age_years: number | null
  weight_lbs: number | null
}

function log(msg: string) { console.log(`     ${msg}`) }
function ok(msg: string) { console.log(`  OK ${msg}`) }
function warn(msg: string) { console.log(`  WARN ${msg}`) }
function fail(msg: string): never { throw new Error(msg) }
function section(title: string) { console.log(`\n-- ${title}`) }

async function getUserIdByEmail(email: string) {
  const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 })
  if (error) fail(`Failed to list auth users: ${error.message}`)
  return data.users.find(user => user.email?.toLowerCase() === email.toLowerCase())?.id ?? null
}

async function cleanup() {
  section('Cleanup')

  const orgIds = new Set<string>()
  for (const email of Object.values(TEST_EMAILS)) {
    const userId = await getUserIdByEmail(email)
    if (userId) orgIds.add(userId)
  }

  const { data: orgs } = await supabase
    .from('organizations')
    .select('id')
    .in('email', Object.values(TEST_EMAILS))

  for (const org of orgs ?? []) orgIds.add(org.id)

  if (orgIds.size > 0) {
    const ids = Array.from(orgIds)
    await supabase.from('alerts').delete().in('rescue_id', ids)
    await supabase.from('dogs').delete().in('shelter_id', ids)
    await supabase.from('rescue_criteria').delete().in('rescue_id', ids)
    await supabase.from('organizations').delete().in('id', ids)
  }

  for (const email of Object.values(TEST_EMAILS)) {
    const userId = await getUserIdByEmail(email)
    if (userId) await supabase.auth.admin.deleteUser(userId)
  }

  ok('Removed seed users, orgs, criteria, dogs, and alerts')
}

async function createAuthUser(email: string) {
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
  })

  if (error || !data.user) fail(`Failed to create auth user ${email}: ${error?.message}`)
  return data.user.id
}

async function seedData() {
  section('Seed')

  const shelterId = await createAuthUser(TEST_EMAILS.shelter)
  const rescueId = await createAuthUser(TEST_EMAILS.rescue)

  const { error: orgError } = await supabase.from('organizations').insert([
    {
      id: shelterId,
      name: '[TEST] Philly Test Shelter',
      email: TEST_EMAILS.shelter,
      city: 'Philadelphia',
      state: 'PA',
      type: 'shelter',
      approval_status: 'approved',
      is_active: true,
    },
    {
      id: rescueId,
      name: '[TEST] Golden Rescue',
      email: TEST_EMAILS.rescue,
      city: 'Philadelphia',
      state: 'PA',
      type: 'rescue',
      approval_status: 'approved',
      is_active: true,
    },
  ])
  if (orgError) fail(`Failed to insert orgs: ${orgError.message}`)

  const { error: criteriaError } = await supabase.from('rescue_criteria').insert({
    rescue_id: rescueId,
    breeds: ['Labrador', 'Golden Retriever'],
    max_age_years: 10,
    max_weight_lbs: 100,
    sex_preference: 'any',
    accepts_mixes: true,
    states_served: ['PA', 'NJ', 'DE'],
    accepts_parvo: false,
    accepts_tripod: true,
    accepts_blind: false,
    accepts_other: false,
    is_active: true,
  })
  if (criteriaError) fail(`Failed to insert criteria: ${criteriaError.message}`)

  ok(`Shelter ${shelterId}`)
  ok(`Rescue ${rescueId}`)
  return { shelterId, rescueId }
}

async function createDog(shelterId: string, overrides: Record<string, unknown> = {}): Promise<TestDog> {
  const { data, error } = await supabase
    .from('dogs')
    .insert({
      shelter_id: shelterId,
      name: '[TEST] Buddy',
      breed: 'Labrador',
      mix: false,
      age_years: 3,
      weight_lbs: 60,
      sex: 'male',
      color: ['yellow'],
      state: 'PA',
      description: 'Friendly test dog',
      status: 'available',
      parvo: false,
      tripod: false,
      blind: false,
      other_issues: false,
      ...overrides,
    })
    .select('id, age_years, weight_lbs')
    .single()

  if (error || !data) fail(`Failed to insert dog: ${error?.message}`)
  ok(`Dog ${data.id}`)
  return data
}

async function login(page: Page, email: string) {
  await page.goto(`${BASE}/auth/login`)
  await page.fill('input[type="email"]', email)
  await page.fill('input[type="password"]', PASSWORD)
  await page.locator('button:text("Sign In")').click()
  await page.waitForURL(/\/dashboard/, { timeout: 15000 })
}

async function createContext(): Promise<SeedContext> {
  const { shelterId, rescueId } = await seedData()
  const browser = await chromium.launch({ headless: true })
  const shelterPage = await browser.newPage({ baseURL: BASE })
  await login(shelterPage, TEST_EMAILS.shelter)
  ok('Signed in as shelter')
  return { shelterId, rescueId, shelterPage, browser }
}

async function triggerAlerts(page: Page, dogId: string) {
  const res = await page.request.post('/api/alerts', {
    data: { dog_id: dogId },
  })

  if (!res.ok()) fail(`/api/alerts returned ${res.status()}: ${await res.text()}`)

  const data = await res.json()
  log(`Response: ${JSON.stringify(data)}`)
  if (!data.matches || data.matches === 0) fail('No matches found; expected at least one')
  ok(`${data.matches} match(es) found`)
}

async function countAlerts(rescueId: string) {
  const { data, error } = await supabase
    .from('alerts')
    .select('id')
    .eq('rescue_id', rescueId)

  if (error) fail(`Failed to count alerts: ${error.message}`)
  return data?.length ?? 0
}

async function latestSentAlert(rescueId: string) {
  const { data, error } = await supabase
    .from('alerts')
    .select('id')
    .eq('rescue_id', rescueId)
    .eq('status', 'sent')
    .order('sent_at', { ascending: false })
    .limit(1)

  if (error) fail(`Failed to query latest sent alert: ${error.message}`)
  return data?.[0]?.id ?? null
}

async function testAlertMatching(ctx: SeedContext) {
  section('Test 1: authenticated shelter triggers matching')
  const dog = await createDog(ctx.shelterId)
  await triggerAlerts(ctx.shelterPage, dog.id)

  const alertId = await latestSentAlert(ctx.rescueId)
  if (!alertId) fail('No sent alert found after matching')
  ok(`Alert ${alertId}`)
  return { dog, alertId }
}

async function testPassResponse(alertId: string) {
  section('Test 2: public Pass link updates alert to declined')

  const res = await fetch(`${BASE}/api/respond?alert_id=${alertId}&action=pass`, {
    redirect: 'manual',
  })

  if (![200, 302, 307, 308].includes(res.status)) {
    fail(`/api/respond pass returned ${res.status}: ${await res.text()}`)
  }

  const { data } = await supabase
    .from('alerts')
    .select('status')
    .eq('id', alertId)
    .single()

  if (data?.status !== 'declined') fail(`Alert status is ${data?.status}; expected declined`)
  ok('Alert status updated to declined')
}

async function testNonMatchingDog(ctx: SeedContext) {
  section('Test 3: non-matching dog produces no alert')
  const before = await countAlerts(ctx.rescueId)
  const dog = await createDog(ctx.shelterId, {
    name: '[TEST] Non-Matching Dog',
    breed: 'Chihuahua',
    state: 'CA',
  })

  const res = await ctx.shelterPage.request.post('/api/alerts', {
    data: { dog_id: dog.id },
  })

  if (!res.ok()) fail(`/api/alerts non-match returned ${res.status()}: ${await res.text()}`)

  const after = await countAlerts(ctx.rescueId)
  if (after > before) fail('Non-matching dog incorrectly created an alert')
  ok('No alert created')
}

async function testSpecialNeedsBlocking(ctx: SeedContext) {
  section('Test 4: special-needs criteria block works')
  const before = await countAlerts(ctx.rescueId)
  const dog = await createDog(ctx.shelterId, {
    name: '[TEST] Parvo Dog',
    parvo: true,
  })

  const res = await ctx.shelterPage.request.post('/api/alerts', {
    data: { dog_id: dog.id },
  })

  if (!res.ok()) fail(`/api/alerts special-needs returned ${res.status()}: ${await res.text()}`)

  const after = await countAlerts(ctx.rescueId)
  if (after > before) fail('Parvo dog matched a rescue that does not accept parvo')
  ok('Parvo dog blocked')
}

async function testStatusUpdate(ctx: SeedContext, dog: TestDog) {
  section('Test 5: authenticated status update preserves numeric fields')

  const res = await ctx.shelterPage.request.post('/api/dogs/update', {
    data: { dog_id: dog.id, status: 'urgent' },
  })

  if (!res.ok()) fail(`/api/dogs/update returned ${res.status()}: ${await res.text()}`)

  const { data } = await supabase
    .from('dogs')
    .select('status, age_years, weight_lbs')
    .eq('id', dog.id)
    .single()

  if (data?.status !== 'urgent') fail(`Dog status is ${data?.status}; expected urgent`)
  if (data.age_years !== dog.age_years) fail(`Dog age changed to ${data.age_years}; expected ${dog.age_years}`)
  if (data.weight_lbs !== dog.weight_lbs) fail(`Dog weight changed to ${data.weight_lbs}; expected ${dog.weight_lbs}`)
  ok('Status updated and numeric fields preserved')
}

async function testSecurityRejections(ctx: SeedContext, dog: TestDog) {
  section('Test 6: protected endpoints reject anonymous calls')

  const alertRes = await fetch(`${BASE}/api/alerts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dog_id: dog.id }),
  })
  if (alertRes.status !== 401) fail(`Anonymous /api/alerts returned ${alertRes.status}; expected 401`)

  const updateRes = await fetch(`${BASE}/api/dogs/update`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dog_id: dog.id, status: 'available' }),
  })
  if (updateRes.status !== 401) fail(`Anonymous /api/dogs/update returned ${updateRes.status}; expected 401`)

  ok('Anonymous calls rejected')
}

async function main() {
  console.log('\nDOGSRUN - authenticated integration smoke test')
  console.log('============================================')

  let ctx: SeedContext | null = null

  try {
    await cleanup()
    ctx = await createContext()

    const { dog, alertId } = await testAlertMatching(ctx)
    await testPassResponse(alertId)
    await testNonMatchingDog(ctx)
    await testSpecialNeedsBlocking(ctx)
    await testStatusUpdate(ctx, dog)
    await testSecurityRejections(ctx, dog)

    console.log('\n============================================')
    console.log('All integration smoke tests passed')
  } finally {
    if (ctx) await ctx.browser.close()
    if (KEEP_DATA) {
      warn('Keeping test data because --keep-data was provided')
    } else {
      await cleanup()
    }
  }
}

if (CLEANUP_ONLY) {
  cleanup().then(() => process.exit(0)).catch(error => {
    console.error(error)
    process.exit(1)
  })
} else {
  main().catch(error => {
    console.error('\nUnhandled error:', error)
    process.exit(1)
  })
}
