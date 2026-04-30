import { test, expect, Page } from '@playwright/test'

const BASE = 'http://localhost:3000'

// ─── Public Pages ─────────────────────────────────────────────────────────────

test.describe('Public Pages', () => {
  test('homepage loads — hero, motto, CTAs', async ({ page }) => {
    await page.goto(BASE)
    await expect(page.locator('text=Every dog deserves a')).toBeVisible()
    await expect(page.locator('text=LOYALTY REPAID').first()).toBeVisible()
    await expect(page.locator('a[href="/register"]').first()).toBeVisible()
    await expect(page.locator('a[href="/dogs"]').first()).toBeVisible()
  })

  test('browse dogs page loads', async ({ page }) => {
    await page.goto(`${BASE}/dogs`)
    await page.waitForLoadState('networkidle')
    await expect(page.locator('h1').first()).toBeVisible()
  })

  test('dog cards link to public dog profile', async ({ page }) => {
    await page.goto(`${BASE}/dogs`)
    await page.waitForLoadState('networkidle')
    const cards = page.locator('a[href^="/dogs/"]')
    if (await cards.count() > 0) {
      await cards.first().click()
      await expect(page).toHaveURL(/\/dogs\/[a-z0-9-]+/)
      await expect(page.locator('h1').first()).toBeVisible()
    }
  })

  test('about page loads with mission and nonprofit info', async ({ page }) => {
    await page.goto(`${BASE}/about`)
    await expect(page.locator('text=About DOGSRUN')).toBeVisible()
    await expect(page.locator('text=Our Mission')).toBeVisible()
    await expect(page.locator('text=EIN')).toBeVisible()
  })

  test('FAQ page loads with accordion items', async ({ page }) => {
    await page.goto(`${BASE}/faq`)
    await expect(page.locator('h1').first()).toBeVisible()
    const items = page.locator('button').filter({ hasText: /\?/ })
    expect(await items.count()).toBeGreaterThan(0)
  })

  test('FAQ accordion opens and shows answer', async ({ page }) => {
    await page.goto(`${BASE}/faq`)
    const firstItem = page.locator('button').filter({ hasText: /\?/ }).first()
    await firstItem.click()
    const answer = page.locator('p').filter({ hasText: /.{20,}/ }).first()
    await expect(answer).toBeVisible()
  })

  test('contact page loads with form fields', async ({ page }) => {
    await page.goto(`${BASE}/contact`)
    await expect(page.locator('input[name="name"]')).toBeVisible()
    await expect(page.locator('input[name="email"]')).toBeVisible()
    await expect(page.locator('select[name="subject"]')).toBeVisible()
    await expect(page.locator('textarea[name="message"]')).toBeVisible()
  })
})

// ─── Navigation ───────────────────────────────────────────────────────────────

test.describe('Navigation', () => {
  test('logo links to homepage', async ({ page }) => {
    await page.goto(`${BASE}/about`)
    await page.locator('nav a[href="/"]').first().click()
    await expect(page).toHaveURL(`${BASE}/`)
  })

  test('navbar shows Login and Register when logged out', async ({ page }) => {
    await page.goto(BASE)
    await expect(page.locator('nav a[href="/auth/login"]')).toBeVisible()
    await expect(page.locator('nav a[href="/register"]')).toBeVisible()
  })

  test('navbar Browse Dogs link works', async ({ page }) => {
    await page.goto(BASE)
    await page.locator('nav a[href="/dogs"]').first().click()
    await expect(page).toHaveURL(`${BASE}/dogs`)
  })

  test('footer links to About, FAQ, Contact', async ({ page }) => {
    await page.goto(BASE)
    const footer = page.locator('footer')
    await expect(footer.locator('a[href="/about"]')).toBeVisible()
    await expect(footer.locator('a[href="/faq"]')).toBeVisible()
    await expect(footer.locator('a[href="/contact"]')).toBeVisible()
  })

  test('footer shows Loyalty Repaid motto', async ({ page }) => {
    await page.goto(BASE)
    await expect(page.locator('footer').locator('text=LOYALTY REPAID')).toBeVisible()
  })
})

// ─── Register Page ───────────────────────────────────────────────────────────

test.describe('Register Page', () => {
  test('loads with Shelter and Rescue tabs', async ({ page }) => {
    await page.goto(`${BASE}/register`)
    await expect(page.locator('button:text("Shelter")').first()).toBeVisible()
    await expect(page.locator('button:text("Rescue")').first()).toBeVisible()
  })

  test('shelter tab is active by default', async ({ page }) => {
    await page.goto(`${BASE}/register`)
    await expect(page.locator('button:text("Shelter")').first()).toHaveCSS('background-color', 'rgb(245, 158, 11)')
  })

  test('?type=rescue pre-selects rescue tab', async ({ page }) => {
    await page.goto(`${BASE}/register?type=rescue`)
    await expect(page.locator('button:text("Rescue")').first()).toHaveCSS('background-color', 'rgb(245, 158, 11)')
  })

  test('shows all required fields', async ({ page }) => {
    await page.goto(`${BASE}/register`)
    await expect(page.locator('input[name="orgName"]')).toBeVisible()
    await expect(page.locator('input[name="city"]')).toBeVisible()
    await expect(page.locator('input[name="email"]')).toBeVisible()
    await expect(page.locator('input[name="password"]')).toBeVisible()
  })

  test('shows 501(c)(3) upload for shelter', async ({ page }) => {
    await page.goto(`${BASE}/register`)
    await expect(page.locator('text=501(c)(3)')).toBeVisible()
  })

  test('shows 501(c)(3) upload for rescue', async ({ page }) => {
    await page.goto(`${BASE}/register`)
    await page.locator('button:text("Rescue")').first().click()
    await expect(page.locator('text=501(c)(3)')).toBeVisible()
  })

  test('submit button label updates with tab', async ({ page }) => {
    await page.goto(`${BASE}/register`)
    await expect(page.locator('button:text("Register as Shelter")')).toBeVisible()
    await page.locator('button:text("Rescue")').first().click()
    await expect(page.locator('button:text("Register as Rescue")')).toBeVisible()
  })

  test('blocks submission without required fields', async ({ page }) => {
    await page.goto(`${BASE}/register`)
    await page.locator('button:text("Register as Shelter")').click()
    await expect(page).toHaveURL(`${BASE}/register`)
  })

  test('blocks submission with invalid email', async ({ page }) => {
    await page.goto(`${BASE}/register`)
    await page.fill('input[name="orgName"]', 'Test Shelter')
    await page.fill('input[name="city"]', 'Philadelphia')
    await page.fill('input[name="email"]', 'notanemail')
    await page.fill('input[name="password"]', 'password123')
    await page.locator('button:text("Register as Shelter")').click()
    await expect(page).toHaveURL(`${BASE}/register`)
  })

  test('blocks submission with short password', async ({ page }) => {
    await page.goto(`${BASE}/register`)
    await page.fill('input[name="orgName"]', 'Test Shelter')
    await page.fill('input[name="city"]', 'Philadelphia')
    await page.fill('input[name="email"]', 'test@shelter.org')
    await page.fill('input[name="password"]', '123')
    await page.locator('button:text("Register as Shelter")').click()
    await expect(page).toHaveURL(`${BASE}/register`)
  })

  test('login link navigates to login page', async ({ page }) => {
    await page.goto(`${BASE}/register`)
    await page.locator('a[href="/auth/login"]').last().click()
    await expect(page).toHaveURL(`${BASE}/auth/login`)
  })
})

// ─── Login Page ───────────────────────────────────────────────────────────────

test.describe('Login Page', () => {
  test('loads with email and password fields', async ({ page }) => {
    await page.goto(`${BASE}/auth/login`)
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.locator('text=Welcome back')).toBeVisible()
  })

  test('toggle to magic link hides password field', async ({ page }) => {
    await page.goto(`${BASE}/auth/login`)
    await page.locator('button:text("Use magic link instead")').click()
    await expect(page.locator('input[type="password"]')).not.toBeVisible()
    await expect(page.locator('button:text("Send magic link")')).toBeVisible()
  })

  test('toggle back to password mode', async ({ page }) => {
    await page.goto(`${BASE}/auth/login`)
    await page.locator('button:text("Use magic link instead")').click()
    await page.locator('button:text("Use password instead")').click()
    await expect(page.locator('input[type="password"]')).toBeVisible()
  })

  test('shows error on wrong credentials', async ({ page }) => {
    await page.goto(`${BASE}/auth/login`)
    await page.fill('input[type="email"]', 'wrong@example.com')
    await page.fill('input[type="password"]', 'wrongpassword')
    await page.locator('button:text("Sign in")').click()
    await page.waitForLoadState('networkidle', { timeout: 15000 })
    await expect(page).toHaveURL(`${BASE}/auth/login`)
    const body = await page.textContent('body')
    expect(body?.toLowerCase()).toMatch(/invalid|error|incorrect|credentials|failed/)
  })

  test('register link navigates to register', async ({ page }) => {
    await page.goto(`${BASE}/auth/login`)
    await page.locator('a[href="/register"]').last().click()
    await expect(page).toHaveURL(`${BASE}/register`)
  })
})

// ─── Auth Guards ──────────────────────────────────────────────────────────────

test.describe('Auth Guards', () => {
  async function assertBlocked(page: Page, url: string, sensitiveText: string) {
    await page.goto(url)
    await page.waitForLoadState('networkidle')
    const redirected = page.url().includes('login') || page.url().includes('register')
    const hasContent = await page.locator(`text=${sensitiveText}`).isVisible()
    expect(redirected || !hasContent).toBeTruthy()
  }

  test('shelter dashboard blocked when logged out', async ({ page }) => {
    await assertBlocked(page, `${BASE}/dashboard`, 'My Dogs')
  })

  test('my dogs page blocked when logged out', async ({ page }) => {
    await assertBlocked(page, `${BASE}/dashboard/dogs`, 'Add a dog')
  })

  test('add dog page blocked when logged out', async ({ page }) => {
    await assertBlocked(page, `${BASE}/dashboard/dogs/new`, 'Post to Network')
  })

  test('rescue portal blocked when logged out', async ({ page }) => {
    await assertBlocked(page, `${BASE}/dashboard/rescue`, 'Interested')
  })

  test('rescue criteria blocked when logged out', async ({ page }) => {
    await assertBlocked(page, `${BASE}/dashboard/criteria`, 'Save Criteria')
  })

  test('admin panel blocked when logged out', async ({ page }) => {
    await assertBlocked(page, `${BASE}/dashboard/admin`, 'Admin Panel')
  })
})

// ─── Responded Page ───────────────────────────────────────────────────────────

test.describe('Responded Page', () => {
  test('loads with success message', async ({ page }) => {
    await page.goto(`${BASE}/responded`)
    await expect(page.locator('text=You\'re Interested')).toBeVisible()
    await expect(page.locator('a[href="/auth/login"]').first()).toBeVisible()
  })
})
