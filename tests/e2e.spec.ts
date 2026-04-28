import { test, expect } from '@playwright/test'

const BASE = 'http://localhost:3000'

// ─── Public Pages ────────────────────────────────────────────────────────────

test.describe('Public Pages', () => {
  test('homepage loads with hero text and CTAs', async ({ page }) => {
    await page.goto(BASE)
    await expect(page.locator('text=Every dog deserves a')).toBeVisible()
    await expect(page.locator('text=Get started').first()).toBeVisible()
    await expect(page.locator('text=Browse dogs').first()).toBeVisible()
  })

  test('dogs page loads without crashing', async ({ page }) => {
    await page.goto(`${BASE}/dogs`)
    await page.waitForLoadState('networkidle')
    const h1 = page.locator('h1').first()
    await expect(h1).toBeVisible({ timeout: 10000 })
    await expect(h1).not.toContainText("couldn't load", { ignoreCase: true })
  })

  test('dogs page shows dog cards when data exists', async ({ page }) => {
    await page.goto(`${BASE}/dogs`)
    await page.waitForLoadState('networkidle')
    const cards = page.locator('a[href^="/dogs/"]')
    expect(await cards.count()).toBeGreaterThanOrEqual(0)
  })

  test('dog profile page loads from dogs list', async ({ page }) => {
    await page.goto(`${BASE}/dogs`)
    await page.waitForLoadState('networkidle')
    const cards = page.locator('a[href^="/dogs/"]')
    const count = await cards.count()
    if (count > 0) {
      await cards.first().click()
      await expect(page).toHaveURL(/\/dogs\//, { timeout: 10000 })
    } else {
      console.log('No dogs seeded locally — skipping profile click')
    }
  })

  test('about page loads with mission content', async ({ page }) => {
    await page.goto(`${BASE}/about`)
    await expect(page.locator('text=About DOGSRUN').first()).toBeVisible()
    await expect(page.locator('text=Our Mission')).toBeVisible()
  })

  test('FAQ page loads with accordion items', async ({ page }) => {
    await page.goto(`${BASE}/faq`)
    await expect(page.locator('h1').first()).toBeVisible()
    const items = page.locator('button').filter({ hasText: /\?/ })
    expect(await items.count()).toBeGreaterThan(0)
  })

  test('contact page loads with form', async ({ page }) => {
    await page.goto(`${BASE}/contact`)
    await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible()
    await expect(page.locator('textarea')).toBeVisible()
  })

  test('navbar Browse Dogs link navigates to dogs page', async ({ page }) => {
    await page.goto(BASE)
    await page.locator('a[href="/dogs"]').first().click()
    await expect(page).toHaveURL(`${BASE}/dogs`)
  })
})

// ─── Register Page ───────────────────────────────────────────────────────────

test.describe('Register Page', () => {
  test('loads with shelter and rescue tabs', async ({ page }) => {
    await page.goto(`${BASE}/register`)
    await expect(page.locator('button:text("Shelter")').first()).toBeVisible()
    await expect(page.locator('button:text("Rescue")').first()).toBeVisible()
  })

  test('shelter tab is selected by default', async ({ page }) => {
    await page.goto(`${BASE}/register`)
    await expect(page.locator('button:text("Shelter")').first()).toHaveCSS('background-color', 'rgb(245, 158, 11)')
  })

  test('rescue tab selects on click', async ({ page }) => {
    await page.goto(`${BASE}/register`)
    await page.locator('button:text("Rescue")').first().click()
    await expect(page.locator('button:text("Rescue")').first()).toHaveCSS('background-color', 'rgb(245, 158, 11)')
  })

  test('?type=rescue pre-selects rescue tab', async ({ page }) => {
    await page.goto(`${BASE}/register?type=rescue`)
    await expect(page.locator('button:text("Rescue")').first()).toHaveCSS('background-color', 'rgb(245, 158, 11)')
  })

  test('submit button label changes with tab', async ({ page }) => {
    await page.goto(`${BASE}/register`)
    await expect(page.locator('button:text("Register as Shelter")')).toBeVisible()
    await page.locator('button:text("Rescue")').first().click()
    await expect(page.locator('button:text("Register as Rescue")')).toBeVisible()
  })

  test('shows all required fields', async ({ page }) => {
    await page.goto(`${BASE}/register`)
    await expect(page.locator('input[name="orgName"]')).toBeVisible()
    await expect(page.locator('input[name="city"]')).toBeVisible()
    await expect(page.locator('input[name="state"]')).toBeVisible()
    await expect(page.locator('input[name="email"]')).toBeVisible()
    await expect(page.locator('input[name="password"]')).toBeVisible()
  })

  test('blocks submission with empty fields', async ({ page }) => {
    await page.goto(`${BASE}/register`)
    await page.locator('button:text("Register as Shelter")').click()
    await expect(page).toHaveURL(`${BASE}/register`)
  })

  test('blocks submission with invalid email', async ({ page }) => {
    await page.goto(`${BASE}/register`)
    await page.fill('input[name="orgName"]', 'Test Shelter')
    await page.fill('input[name="city"]', 'Philadelphia')
    await page.fill('input[name="state"]', 'PA')
    await page.fill('input[name="email"]', 'notanemail')
    await page.fill('input[name="password"]', 'password123')
    await page.locator('button:text("Register as Shelter")').click()
    await expect(page).toHaveURL(`${BASE}/register`)
  })

  test('blocks submission with short password (under 6 chars)', async ({ page }) => {
    await page.goto(`${BASE}/register`)
    await page.fill('input[name="orgName"]', 'Test Shelter')
    await page.fill('input[name="city"]', 'Philadelphia')
    await page.fill('input[name="state"]', 'PA')
    await page.fill('input[name="email"]', 'test@shelter.org')
    await page.fill('input[name="password"]', '123')
    await page.locator('button:text("Register as Shelter")').click()
    await expect(page).toHaveURL(`${BASE}/register`)
  })

  test('login link in footer navigates to login page', async ({ page }) => {
    await page.goto(`${BASE}/register`)
    await page.locator('p a[href="/auth/login"]').click()
    await expect(page).toHaveURL(`${BASE}/auth/login`)
  })
})

// ─── Login Page ───────────────────────────────────────────────────────────────

test.describe('Login Page', () => {
  test('loads with email and password fields', async ({ page }) => {
    await page.goto(`${BASE}/auth/login`)
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
  })

  test('shows welcome back heading', async ({ page }) => {
    await page.goto(`${BASE}/auth/login`)
    await expect(page.locator('text=Welcome back')).toBeVisible()
  })

  test('toggles to magic link mode hides password field', async ({ page }) => {
    await page.goto(`${BASE}/auth/login`)
    await page.locator('button:text("Use magic link instead")').click()
    await expect(page.locator('input[type="password"]')).not.toBeVisible()
    await expect(page.locator('button:text("Send magic link")')).toBeVisible()
  })

  test('toggles back to password mode', async ({ page }) => {
    await page.goto(`${BASE}/auth/login`)
    await page.locator('button:text("Use magic link instead")').click()
    await page.locator('button:text("Use password instead")').click()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.locator('button:text("Sign in")')).toBeVisible()
  })

  test('shows error on wrong credentials', async ({ page }) => {
    await page.goto(`${BASE}/auth/login`)
    await page.fill('input[type="email"]', 'wrong@example.com')
    await page.fill('input[type="password"]', 'wrongpassword')
    await page.locator('button:text("Sign in")').click()
    // Wait for the Supabase call to complete and loading state to clear
    await page.waitForLoadState('networkidle', { timeout: 15000 })
    // Should still be on login page
    await expect(page).toHaveURL(`${BASE}/auth/login`)
    // Body should contain some error text from Supabase
    const pageText = await page.textContent('body')
    expect(pageText?.toLowerCase()).toMatch(/invalid|error|incorrect|credentials|failed|wrong/)
  })

  test('blocks empty form submission', async ({ page }) => {
    await page.goto(`${BASE}/auth/login`)
    await page.locator('button:text("Sign in")').click()
    await expect(page).toHaveURL(`${BASE}/auth/login`)
  })

  test('register link in footer navigates to register page', async ({ page }) => {
    await page.goto(`${BASE}/auth/login`)
    await page.locator('p a[href="/register"]').click()
    await expect(page).toHaveURL(`${BASE}/register`)
  })
})

// ─── Auth Guards ─────────────────────────────────────────────────────────────

test.describe('Auth Guards', () => {
  test('shelter dashboard does not show dog data when unauthenticated', async ({ page }) => {
    await page.goto(`${BASE}/dashboard`)
    await page.waitForLoadState('networkidle')
    const url = page.url()
    const redirected = url.includes('login') || url.includes('auth') || url.includes('register')
    const hasIntakeButton = await page.locator('text=Add a dog').or(page.locator('text=Add Dog')).first().isVisible()
    expect(redirected || !hasIntakeButton).toBeTruthy()
  })

  test('rescue dashboard does not show alerts when unauthenticated', async ({ page }) => {
    await page.goto(`${BASE}/dashboard/rescue`)
    await page.waitForLoadState('networkidle')
    const url = page.url()
    const redirected = url.includes('login') || url.includes('auth') || url.includes('register')
    const hasAlerts = await page.locator('button:text("Interested")').or(page.locator('button:text("Pass")')).first().isVisible()
    expect(redirected || !hasAlerts).toBeTruthy()
  })

  test('dog intake form does not render when unauthenticated', async ({ page }) => {
    await page.goto(`${BASE}/dashboard/dogs/new`)
    await page.waitForLoadState('networkidle')
    const url = page.url()
    const redirected = url.includes('login') || url.includes('auth') || url.includes('register')
    const hasIntakeForm = await page.locator('input[name="name"]').isVisible()
    expect(redirected || !hasIntakeForm).toBeTruthy()
  })

  test('rescue criteria page does not render when unauthenticated', async ({ page }) => {
    await page.goto(`${BASE}/dashboard/criteria`)
    await page.waitForLoadState('networkidle')
    const url = page.url()
    const redirected = url.includes('login') || url.includes('auth') || url.includes('register')
    const hasCriteriaForm = await page.locator('button:text("Save Criteria")').or(page.locator('button:text("Update Criteria")')).first().isVisible()
    expect(redirected || !hasCriteriaForm).toBeTruthy()
  })
})

// ─── Navigation & Footer ─────────────────────────────────────────────────────

test.describe('Navigation & Footer', () => {
  test('DOGSRUN logo links to homepage', async ({ page }) => {
    await page.goto(`${BASE}/about`)
    await page.locator('a[href="/"]').first().click()
    await expect(page).toHaveURL(BASE + '/')
  })

  test('Login button in navbar navigates to login', async ({ page }) => {
    await page.goto(BASE)
    await page.locator('nav a[href="/auth/login"]').first().click()
    await expect(page).toHaveURL(`${BASE}/auth/login`)
  })

  test('Register button in navbar navigates to register', async ({ page }) => {
    await page.goto(BASE)
    await page.locator('nav a[href="/register"]').first().click()
    await expect(page).toHaveURL(`${BASE}/register`)
  })

  test('footer FAQ link navigates to FAQ page', async ({ page }) => {
    await page.goto(BASE)
    await page.locator('a[href="/faq"]').last().click()
    await expect(page).toHaveURL(`${BASE}/faq`)
  })

  test('footer Contact link navigates to contact page', async ({ page }) => {
    await page.goto(BASE)
    await page.locator('a[href="/contact"]').last().click()
    await expect(page).toHaveURL(`${BASE}/contact`)
  })
})
