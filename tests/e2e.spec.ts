import { test, expect } from '@playwright/test'

test('homepage loads with gradient hero', async ({ page }) => {
  await page.goto('https://dogsrun.net')
  await expect(page.locator('text=Every dog deserves a')).toBeVisible()
  await expect(page.locator('text=Get Started').first()).toBeVisible()
  await expect(page.locator('text=Browse Dogs').first()).toBeVisible()
})

test('dogs page shows all dogs', async ({ page }) => {
  await page.goto('https://dogsrun.net/dogs')
  await expect(page.locator('text=Dogs looking for a second chance')).toBeVisible()
  const cards = page.locator('a[href^="/dogs/"]')
  const count = await cards.count()
  expect(count).toBeGreaterThan(3)
})

test('about page loads', async ({ page }) => {
  await page.goto('https://dogsrun.net/about')
  await expect(page.locator('text=Connecting shelters and rescues').first()).toBeVisible()
  await expect(page.locator('text=Our Mission')).toBeVisible()
})

test('register page loads with shelter and rescue tabs', async ({ page }) => {
  await page.goto('https://dogsrun.net/register')
  await expect(page.locator('text=Shelter').first()).toBeVisible()
  await expect(page.locator('text=Rescue').first()).toBeVisible()
})

test('login page loads', async ({ page }) => {
  await page.goto('https://dogsrun.net/auth/login')
  await expect(page.locator('input[type="email"]')).toBeVisible()
  await expect(page.locator('input[type="password"]')).toBeVisible()
})

test('shelter dashboard requires auth', async ({ page }) => {
  await page.goto('https://dogsrun.net/dashboard')
  await expect(page).toHaveURL(/login|auth/)
})

test('rescue dashboard requires auth', async ({ page }) => {
  await page.goto('https://dogsrun.net/dashboard/rescue')
  await expect(page).toHaveURL(/login|auth/)
})

test('public dog profile loads', async ({ page }) => {
  await page.goto('https://dogsrun.net/dogs')
  const firstDog = page.locator('a[href^="/dogs/"]').first()
  await firstDog.click()
  await expect(page.locator('text=Interested in rescuing')).toBeVisible()
})
