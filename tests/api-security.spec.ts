import { expect, test, type APIRequestContext, type Page } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'
import { randomUUID } from 'crypto'

dotenv.config({ path: path.join(process.cwd(), '.env.local') })

const serviceClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const PASSWORD = `Dogsrun-${randomUUID()}!`
const createdUserIds: string[] = []
const createdOrgIds: string[] = []
const createdDogIds: string[] = []
const createdAlertIds: string[] = []

type OrgType = 'shelter' | 'rescue'

async function createAuthOrg(type: OrgType, approvalStatus = 'approved') {
  const email = `test-${type}-${randomUUID()}@dogsrun-test.local`
  const { data, error } = await serviceClient.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
  })

  if (error || !data.user) throw new Error(`Failed to create ${type} auth user: ${error?.message}`)

  const org = {
    id: data.user.id,
    name: `[TEST] ${type} ${randomUUID().slice(0, 8)}`,
    email,
    city: 'Philadelphia',
    state: 'PA',
    type,
    approval_status: approvalStatus,
    is_active: true,
  }

  const { error: orgError } = await serviceClient.from('organizations').insert(org)
  if (orgError) throw new Error(`Failed to create ${type} org: ${orgError.message}`)

  createdUserIds.push(data.user.id)
  createdOrgIds.push(data.user.id)
  return { id: data.user.id, email, password: PASSWORD, org }
}

async function createOrgOnly(type: OrgType, approvalStatus = 'approved') {
  const id = randomUUID()
  const { error } = await serviceClient.from('organizations').insert({
    id,
    name: `[TEST] ${type} ${randomUUID().slice(0, 8)}`,
    email: `test-${type}-${randomUUID()}@dogsrun-test.local`,
    city: 'Philadelphia',
    state: 'PA',
    type,
    approval_status: approvalStatus,
    is_active: true,
  })

  if (error) throw new Error(`Failed to create ${type} org: ${error.message}`)
  createdOrgIds.push(id)
  return id
}

async function createDog(shelterId: string) {
  const { data, error } = await serviceClient
    .from('dogs')
    .insert({
      shelter_id: shelterId,
      name: `[TEST] Security Dog ${randomUUID().slice(0, 8)}`,
      breed: 'Labrador',
      mix: false,
      age_years: 3,
      weight_lbs: 60,
      sex: 'male',
      color: ['yellow'],
      state: 'PA',
      description: 'Security test dog',
      status: 'available',
      parvo: false,
      tripod: false,
      blind: false,
      other_issues: false,
    })
    .select('id')
    .single()

  if (error || !data) throw new Error(`Failed to create dog: ${error?.message}`)
  createdDogIds.push(data.id)
  return data.id
}

async function createAlert(dogId: string, rescueId: string) {
  const { data, error } = await serviceClient
    .from('alerts')
    .insert({
      dog_id: dogId,
      rescue_id: rescueId,
      status: 'sent',
      sent_at: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (error || !data) throw new Error(`Failed to create alert: ${error?.message}`)
  createdAlertIds.push(data.id)
  return data.id
}

async function login(page: Page, email: string, password: string) {
  await page.goto('/auth/login')
  await page.fill('input[type="email"]', email)
  await page.fill('input[type="password"]', password)
  await page.locator('button:text("Sign In")').click()
  await page.waitForURL(/\/dashboard/, { timeout: 15000 })
}

function expectJsonError(responseBody: unknown, pattern: RegExp) {
  expect(JSON.stringify(responseBody).toLowerCase()).toMatch(pattern)
}

test.afterAll(async () => {
  if (createdAlertIds.length > 0) {
    await serviceClient.from('alerts').delete().in('id', createdAlertIds)
  }
  if (createdDogIds.length > 0) {
    await serviceClient.from('dogs').delete().in('id', createdDogIds)
  }
  if (createdOrgIds.length > 0) {
    await serviceClient.from('rescue_criteria').delete().in('rescue_id', createdOrgIds)
    await serviceClient.from('organizations').delete().in('id', createdOrgIds)
  }
  for (const userId of createdUserIds) {
    await serviceClient.auth.admin.deleteUser(userId)
  }
})

test.describe('API security', () => {
  test('auth-required endpoints reject anonymous callers', async ({ request }) => {
    const endpoints: Array<{ path: string; body: Record<string, string> }> = [
      { path: '/api/alerts', body: { dog_id: randomUUID() } },
      { path: '/api/alerts/respond', body: { alert_id: randomUUID(), status: 'responded' } },
      { path: '/api/notify-shelter', body: { alert_id: randomUUID() } },
    ]

    for (const endpoint of endpoints) {
      const response = await request.post(endpoint.path, { data: endpoint.body })
      expect(response.status(), endpoint.path).toBe(401)
      expectJsonError(await response.json(), /unauthorized/)
    }
  })

  test('email response endpoint rejects invalid action values', async ({ request }) => {
    const response = await request.get(`/api/respond?alert_id=${randomUUID()}&action=delete`)

    expect(response.status()).toBe(400)
    expectJsonError(await response.json(), /invalid action/)
  })

  test('registration rejects mismatched user id and email', async ({ request }) => {
    const response = await postRegistration(request, {
      user_id: '00000000-0000-0000-0000-000000000000',
      email: `mismatch-${randomUUID()}@dogsrun-test.local`,
    })

    expect(response.status()).toBe(403)
    expectJsonError(await response.json(), /invalid registration user/)
  })

  test('rescues cannot trigger alerts for arbitrary dogs', async ({ page }) => {
    const rescue = await createAuthOrg('rescue')
    const shelterId = await createOrgOnly('shelter')
    const dogId = await createDog(shelterId)

    await login(page, rescue.email, rescue.password)

    const response = await page.request.post('/api/alerts', {
      data: { dog_id: dogId },
    })

    expect(response.status()).toBe(403)
    expectJsonError(await response.json(), /forbidden/)
  })

  test('shelters cannot trigger alerts for dogs they do not own', async ({ page }) => {
    const shelter = await createAuthOrg('shelter')
    const otherShelterId = await createOrgOnly('shelter')
    const dogId = await createDog(otherShelterId)

    await login(page, shelter.email, shelter.password)

    const response = await page.request.post('/api/alerts', {
      data: { dog_id: dogId },
    })

    expect(response.status()).toBe(403)
    expectJsonError(await response.json(), /forbidden/)
  })

  test('notify-shelter rejects rescues that do not own the alert', async ({ page }) => {
    const alertOwner = await createAuthOrg('rescue')
    const otherRescue = await createAuthOrg('rescue')
    const shelterId = await createOrgOnly('shelter')
    const dogId = await createDog(shelterId)
    const alertId = await createAlert(dogId, alertOwner.id)

    await login(page, otherRescue.email, otherRescue.password)

    const response = await page.request.post('/api/notify-shelter', {
      data: { alert_id: alertId },
    })

    expect(response.status()).toBe(403)
    expectJsonError(await response.json(), /forbidden/)
  })
})

async function postRegistration(
  request: APIRequestContext,
  overrides: Partial<Record<'user_id' | 'email', string>> = {}
) {
  return request.post('/api/register', {
    multipart: {
      user_id: overrides.user_id ?? randomUUID(),
      name: '[TEST] Registration Security Org',
      email: overrides.email ?? `registration-${randomUUID()}@dogsrun-test.local`,
      city: 'Philadelphia',
      state: 'PA',
      type: 'shelter',
      tax_doc: {
        name: '501c3.pdf',
        mimeType: 'application/pdf',
        buffer: Buffer.from('%PDF-1.4\n% test pdf\n'),
      },
    },
  })
}
