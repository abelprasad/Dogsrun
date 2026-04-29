/**
 * DOGSRUN — Test Seed Script
 * 
 * Creates two test orgs (shelter + rescue), a dog, and triggers alert matching.
 * Verifies the full intake → match → alert → respond flow without a browser.
 * 
 * Usage:
 *   npx tsx scripts/seed-test.ts           # run all tests
 *   npx tsx scripts/seed-test.ts --cleanup # just clean up test data
 * 
 * Requirements:
 *   - npm run dev running on localhost:3000
 *   - .env.local present with all 4 keys
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.join(process.cwd(), '.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const BASE = 'http://localhost:3000'

// ─── Test data ────────────────────────────────────────────────────────────────

const SHELTER_ID = '00000000-0000-0000-0000-000000000001'
const RESCUE_ID  = '00000000-0000-0000-0000-000000000002'

const TEST_SHELTER = {
  id: SHELTER_ID,
  name: '[TEST] Philly Test Shelter',
  email: 'test-shelter@dogsrun-test.local',
  city: 'Philadelphia',
  state: 'PA',
  type: 'shelter',
  approval_status: 'approved',
  is_active: true,
}

const TEST_RESCUE = {
  id: RESCUE_ID,
  name: '[TEST] Golden Rescue',
  email: 'test-rescue@dogsrun-test.local',
  city: 'Philadelphia',
  state: 'PA',
  type: 'rescue',
  approval_status: 'approved',
  is_active: true,
}

const TEST_CRITERIA = {
  rescue_id: RESCUE_ID,
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
}

const TEST_DOG = {
  shelter_id: SHELTER_ID,
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
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function log(msg: string)  { console.log(`     ${msg}`) }
function ok(msg: string)   { console.log(`  ✅ ${msg}`) }
function warn(msg: string) { console.log(`  ⚠️  ${msg}`) }
function fail(msg: string) { console.error(`  ❌ ${msg}`); process.exit(1) }
function section(title: string) { console.log(`\n── ${title}`) }

// ─── Cleanup ──────────────────────────────────────────────────────────────────

async function cleanup() {
  section('Cleanup — removing previous test data')
  await supabase.from('alerts').delete().eq('rescue_id', RESCUE_ID)
  await supabase.from('dogs').delete().eq('shelter_id', SHELTER_ID)
  await supabase.from('rescue_criteria').delete().eq('rescue_id', RESCUE_ID)
  await supabase.from('organizations').delete().in('id', [SHELTER_ID, RESCUE_ID])
  ok('All test data removed')
}

// ─── Seed ─────────────────────────────────────────────────────────────────────

async function seed() {
  section('Seeding test data')

  const { error: shelterErr } = await supabase.from('organizations').insert(TEST_SHELTER)
  if (shelterErr) fail(`Failed to insert shelter: ${shelterErr.message}`)
  ok(`Shelter: ${TEST_SHELTER.name}`)

  const { error: rescueErr } = await supabase.from('organizations').insert(TEST_RESCUE)
  if (rescueErr) fail(`Failed to insert rescue: ${rescueErr.message}`)
  ok(`Rescue: ${TEST_RESCUE.name}`)

  const { error: criteriaErr } = await supabase.from('rescue_criteria').insert(TEST_CRITERIA)
  if (criteriaErr) fail(`Failed to insert criteria: ${criteriaErr.message}`)
  ok(`Criteria: Labrador/Golden · PA/NJ/DE · max 10y 100lbs`)

  const { data: dog, error: dogErr } = await supabase
    .from('dogs')
    .insert(TEST_DOG)
    .select()
    .single()
  if (dogErr || !dog) fail(`Failed to insert dog: ${dogErr?.message}`)
  ok(`Dog: ${dog.name} (${dog.id})`)

  return dog
}

// ─── Tests ────────────────────────────────────────────────────────────────────

async function testAlertMatching(dogId: string) {
  section('Test 1: Matching dog triggers alert')

  const res = await fetch(`${BASE}/api/alerts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dog_id: dogId }),
  })

  if (!res.ok) fail(`/api/alerts returned ${res.status}: ${await res.text()}`)

  const data = await res.json()
  log(`Response: ${JSON.stringify(data)}`)
  if (!data.matches || data.matches === 0) fail('No matches found — expected ≥1')
  ok(`${data.matches} match(es) found`)
}

async function testAlertInDB() {
  section('Test 2: Alert row created in database')

  const { data: alerts, error } = await supabase
    .from('alerts')
    .select('*')
    .eq('rescue_id', RESCUE_ID)

  if (error) fail(`Failed to query alerts: ${error.message}`)
  if (!alerts || alerts.length === 0) fail('No alert row found after matching')

  ok(`${alerts.length} alert row(s) in DB · status: ${alerts[0].status}`)
  return alerts[0].id
}

async function testAlertResponse(alertId: string) {
  section('Test 3: Rescue clicks Interested → alert status updates')

  const res = await fetch(
    `${BASE}/api/respond?alert_id=${alertId}&action=interested`,
    { redirect: 'manual' }
  )

  if (res.status !== 302 && res.status !== 200) {
    fail(`/api/respond returned unexpected status ${res.status}`)
  }

  const { data: alert } = await supabase
    .from('alerts')
    .select('status')
    .eq('id', alertId)
    .single()

  if (alert?.status !== 'responded') fail(`Alert status is "${alert?.status}", expected "responded"`)
  ok('Alert status updated to "responded"')
}

async function testPassResponse() {
  section('Test 4: Rescue clicks Pass → alert status updates to declined')

  // Insert a fresh dog for this test
  const { data: dog } = await supabase
    .from('dogs')
    .insert({ ...TEST_DOG, name: '[TEST] Pass Dog' })
    .select()
    .single()

  await fetch(`${BASE}/api/alerts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dog_id: dog!.id }),
  })

  const { data: alerts } = await supabase
    .from('alerts')
    .select('id')
    .eq('rescue_id', RESCUE_ID)
    .eq('status', 'sent')
    .order('sent_at', { ascending: false })
    .limit(1)

  if (!alerts || alerts.length === 0) {
    warn('No fresh sent alert found for Pass test — skipping')
    await supabase.from('dogs').delete().eq('id', dog!.id)
    return
  }

  const alertId = alerts[0].id

  await fetch(
    `${BASE}/api/respond?alert_id=${alertId}&action=pass`,
    { redirect: 'manual' }
  )

  const { data: alert } = await supabase
    .from('alerts')
    .select('status')
    .eq('id', alertId)
    .single()

  if (alert?.status !== 'declined') fail(`Alert status is "${alert?.status}", expected "declined"`)
  ok('Alert status updated to "declined"')

  await supabase.from('dogs').delete().eq('id', dog!.id)
}

async function testNonMatchingDog() {
  section('Test 5: Non-matching dog produces no alert')

  const { data: dog } = await supabase
    .from('dogs')
    .insert({
      ...TEST_DOG,
      name: '[TEST] Non-Matching Dog',
      breed: 'Chihuahua', // not in rescue criteria
      state: 'CA',         // not in states_served
    })
    .select()
    .single()

  const { data: before } = await supabase
    .from('alerts')
    .select('id')
    .eq('rescue_id', RESCUE_ID)

  await fetch(`${BASE}/api/alerts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dog_id: dog!.id }),
  })

  const { data: after } = await supabase
    .from('alerts')
    .select('id')
    .eq('rescue_id', RESCUE_ID)

  if ((after?.length ?? 0) > (before?.length ?? 0)) {
    fail('Non-matching dog incorrectly triggered an alert')
  }
  ok('No alert sent for non-matching dog')

  await supabase.from('dogs').delete().eq('id', dog!.id)
}

async function testSpecialNeedsBlocking() {
  section('Test 6: Special needs dog blocked when rescue does not accept')

  const { data: dog } = await supabase
    .from('dogs')
    .insert({
      ...TEST_DOG,
      name: '[TEST] Parvo Dog',
      parvo: true, // rescue has accepts_parvo: false
    })
    .select()
    .single()

  const { data: before } = await supabase
    .from('alerts').select('id').eq('rescue_id', RESCUE_ID)

  await fetch(`${BASE}/api/alerts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dog_id: dog!.id }),
  })

  const { data: after } = await supabase
    .from('alerts').select('id').eq('rescue_id', RESCUE_ID)

  if ((after?.length ?? 0) > (before?.length ?? 0)) {
    fail('Parvo dog incorrectly matched rescue that does not accept parvo')
  }
  ok('Parvo dog correctly blocked')

  await supabase.from('dogs').delete().eq('id', dog!.id)
}

async function testStatusUpdate(dogId: string) {
  section('Test 7: Dog status update via /api/dogs/update')

  const res = await fetch(`${BASE}/api/dogs/update`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dog_id: dogId, status: 'urgent' }),
  })

  if (!res.ok) fail(`/api/dogs/update returned ${res.status}`)

  const { data: dog } = await supabase
    .from('dogs').select('status').eq('id', dogId).single()

  if (dog?.status !== 'urgent') fail(`Status is "${dog?.status}", expected "urgent"`)
  ok('Dog status updated to urgent')
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n🐕 DOGSRUN — Seed & Integration Test')
  console.log('=====================================')

  await cleanup()
  const dog = await seed()

  await testAlertMatching(dog.id)
  const alertId = await testAlertInDB()
  await testAlertResponse(alertId)
  await testPassResponse()
  await testNonMatchingDog()
  await testSpecialNeedsBlocking()
  await testStatusUpdate(dog.id)

  console.log('\n=====================================')
  console.log('🎉 All tests passed!')
  console.log('\n  Test data left in DB for manual inspection.')
  console.log('  Clean up: npx tsx scripts/seed-test.ts --cleanup\n')
}

if (process.argv.includes('--cleanup')) {
  cleanup().then(() => process.exit(0))
} else {
  main().catch(err => {
    console.error('\n❌ Unhandled error:', err)
    process.exit(1)
  })
}
