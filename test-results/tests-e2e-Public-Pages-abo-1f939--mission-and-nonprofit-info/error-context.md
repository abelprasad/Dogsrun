# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tests\e2e.spec.ts >> Public Pages >> about page loads with mission and nonprofit info
- Location: tests\e2e.spec.ts:33:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('text=Our Mission')
Expected: visible
Error: strict mode violation: locator('text=Our Mission') resolved to 2 elements:
    1) <div class="mb-6 inline-flex items-center gap-3 border-y border-[#f4b942]/30 py-3 text-[11px] font-bold uppercase tracking-[0.28em] text-[#f4b942]">…</div> aka getByText('Our mission', { exact: true })
    2) <h2 class="text-3xl font-black tracking-tight text-[#13241d]">Our Mission</h2> aka getByRole('heading', { name: 'Our Mission' })

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('text=Our Mission')

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - navigation [ref=e2]:
    - generic [ref=e3]:
      - generic [ref=e4]:
        - link "DOGSRUN logo DOGSRUN Loyalty Repaid" [ref=e5] [cursor=pointer]:
          - /url: /
          - img "DOGSRUN logo" [ref=e6]
          - generic [ref=e7]:
            - generic [ref=e8]: DOGSRUN
            - text: Loyalty Repaid
        - generic [ref=e9]:
          - link "Browse Dogs" [ref=e10] [cursor=pointer]:
            - /url: /dogs
          - link "About" [ref=e11] [cursor=pointer]:
            - /url: /about
          - link "FAQ" [ref=e12] [cursor=pointer]:
            - /url: /faq
          - link "Contact" [ref=e13] [cursor=pointer]:
            - /url: /contact
      - generic [ref=e14]:
        - link "Login" [ref=e15] [cursor=pointer]:
          - /url: /auth/login
        - link "Register" [ref=e16] [cursor=pointer]:
          - /url: /register
  - main [ref=e17]:
    - generic [ref=e18]:
      - generic [ref=e20]:
        - generic [ref=e21]: Our mission
        - heading "About DOGSRUN" [level=1] [ref=e23]
        - paragraph [ref=e24]: Connecting shelters and rescues to save more lives through real-time matching and seamless communication.
      - generic [ref=e26]:
        - img "Dog photo 1" [ref=e28]
        - img "Dog photo 2" [ref=e30]
        - img "Dog photo 3" [ref=e32]
      - main [ref=e33]:
        - generic [ref=e34]:
          - generic [ref=e35]:
            - heading "Our Mission" [level=2] [ref=e36]
            - paragraph [ref=e37]: At DOGSRUN, we bring together dog shelters and rescue organizations in a seamless network. Our platform enables shelters to share detailed information about dogs in need, while rescues receive timely notifications tailored to their adoption criteria.
            - paragraph [ref=e38]: We are committed to improving the lives of shelter dogs by creating a collaborative network that reduces overcrowding and helps more dogs find loving homes faster.
            - link "Join the network" [ref=e39] [cursor=pointer]:
              - /url: /register
          - generic [ref=e40]:
            - heading "How DOGSRUN Works" [level=3] [ref=e41]
            - generic [ref=e42]:
              - generic [ref=e43]:
                - generic [ref=e44]: "01"
                - generic [ref=e45]:
                  - heading "Add a dog" [level=4] [ref=e46]
                  - paragraph [ref=e47]: Shelters enter details for dogs that need specialized rescue support.
              - generic [ref=e48]:
                - generic [ref=e49]: "02"
                - generic [ref=e50]:
                  - heading "Instant match" [level=4] [ref=e51]
                  - paragraph [ref=e52]: Our system automatically matches dogs with rescue organizations based on criteria.
              - generic [ref=e53]:
                - generic [ref=e54]: "03"
                - generic [ref=e55]:
                  - heading "Save lives" [level=4] [ref=e56]
                  - paragraph [ref=e57]: Rescues get notified instantly and can respond immediately to pull the dog.
        - generic [ref=e58]:
          - heading "Nonprofit Information" [level=2] [ref=e59]
          - generic [ref=e60]:
            - generic [ref=e61]:
              - paragraph [ref=e62]: Organization
              - paragraph [ref=e63]: Dog Shelter & Rescue Unification Network, LLC
              - paragraph [ref=e64]: 501(c)(3) Public Charity
            - generic [ref=e65]:
              - paragraph [ref=e66]: Nonprofit ID
              - paragraph [ref=e67]: EIN 993286395
            - generic [ref=e68]:
              - paragraph [ref=e69]: Mailing Address
              - paragraph [ref=e70]: "221 W 9th St #896"
              - paragraph [ref=e71]: Wilmington, DE 19801
            - generic [ref=e72]:
              - paragraph [ref=e73]: Phone
              - paragraph [ref=e74]: 904-923-4441
  - contentinfo [ref=e75]:
    - generic [ref=e77]:
      - generic [ref=e78]:
        - img "DOGSRUN logo" [ref=e79]
        - generic [ref=e80]:
          - generic [ref=e81]: DOGSRUN
          - text: Loyalty Repaid
      - generic [ref=e82]:
        - link "Browse Dogs" [ref=e83] [cursor=pointer]:
          - /url: /dogs
        - link "About" [ref=e84] [cursor=pointer]:
          - /url: /about
        - link "FAQ" [ref=e85] [cursor=pointer]:
          - /url: /faq
        - link "Contact" [ref=e86] [cursor=pointer]:
          - /url: /contact
      - generic [ref=e87]: © 2026 DOGSRUN | 501(c)(3) nonprofit
  - button "Open Next.js Dev Tools" [ref=e93] [cursor=pointer]:
    - img [ref=e94]
```

# Test source

```ts
  1   | import { test, expect, Page } from '@playwright/test'
  2   | 
  3   | const BASE = 'http://localhost:3000'
  4   | 
  5   | // ─── Public Pages ─────────────────────────────────────────────────────────────
  6   | 
  7   | test.describe('Public Pages', () => {
  8   |   test('homepage loads — hero, motto, CTAs', async ({ page }) => {
  9   |     await page.goto(BASE)
  10  |     await expect(page.locator('text=Every dog deserves a')).toBeVisible()
  11  |     await expect(page.locator('text=LOYALTY REPAID').first()).toBeVisible()
  12  |     await expect(page.locator('a[href="/register"]').first()).toBeVisible()
  13  |     await expect(page.locator('a[href="/dogs"]').first()).toBeVisible()
  14  |   })
  15  | 
  16  |   test('browse dogs page loads', async ({ page }) => {
  17  |     await page.goto(`${BASE}/dogs`)
  18  |     await page.waitForLoadState('networkidle')
  19  |     await expect(page.locator('h1').first()).toBeVisible()
  20  |   })
  21  | 
  22  |   test('dog cards link to public dog profile', async ({ page }) => {
  23  |     await page.goto(`${BASE}/dogs`)
  24  |     await page.waitForLoadState('networkidle')
  25  |     const cards = page.locator('a[href^="/dogs/"]')
  26  |     if (await cards.count() > 0) {
  27  |       await cards.first().click()
  28  |       await expect(page).toHaveURL(/\/dogs\/[a-z0-9-]+/)
  29  |       await expect(page.locator('h1').first()).toBeVisible()
  30  |     }
  31  |   })
  32  | 
  33  |   test('about page loads with mission and nonprofit info', async ({ page }) => {
  34  |     await page.goto(`${BASE}/about`)
  35  |     await expect(page.locator('text=About DOGSRUN')).toBeVisible()
> 36  |     await expect(page.locator('text=Our Mission')).toBeVisible()
      |                                                    ^ Error: expect(locator).toBeVisible() failed
  37  |     await expect(page.locator('text=EIN')).toBeVisible()
  38  |   })
  39  | 
  40  |   test('FAQ page loads with accordion items', async ({ page }) => {
  41  |     await page.goto(`${BASE}/faq`)
  42  |     await expect(page.locator('h1').first()).toBeVisible()
  43  |     const items = page.locator('button').filter({ hasText: /\?/ })
  44  |     expect(await items.count()).toBeGreaterThan(0)
  45  |   })
  46  | 
  47  |   test('FAQ accordion opens and shows answer', async ({ page }) => {
  48  |     await page.goto(`${BASE}/faq`)
  49  |     const firstItem = page.locator('button').filter({ hasText: /\?/ }).first()
  50  |     await firstItem.click()
  51  |     const answer = page.locator('p').filter({ hasText: /.{20,}/ }).first()
  52  |     await expect(answer).toBeVisible()
  53  |   })
  54  | 
  55  |   test('contact page loads with form fields', async ({ page }) => {
  56  |     await page.goto(`${BASE}/contact`)
  57  |     await expect(page.locator('input[name="name"]')).toBeVisible()
  58  |     await expect(page.locator('input[name="email"]')).toBeVisible()
  59  |     await expect(page.locator('select[name="subject"]')).toBeVisible()
  60  |     await expect(page.locator('textarea[name="message"]')).toBeVisible()
  61  |   })
  62  | })
  63  | 
  64  | // ─── Navigation ───────────────────────────────────────────────────────────────
  65  | 
  66  | test.describe('Navigation', () => {
  67  |   test('logo links to homepage', async ({ page }) => {
  68  |     await page.goto(`${BASE}/about`)
  69  |     await page.locator('nav a[href="/"]').first().click()
  70  |     await expect(page).toHaveURL(`${BASE}/`)
  71  |   })
  72  | 
  73  |   test('navbar shows Login and Register when logged out', async ({ page }) => {
  74  |     await page.goto(BASE)
  75  |     await expect(page.locator('nav a[href="/auth/login"]')).toBeVisible()
  76  |     await expect(page.locator('nav a[href="/register"]')).toBeVisible()
  77  |   })
  78  | 
  79  |   test('navbar Browse Dogs link works', async ({ page }) => {
  80  |     await page.goto(BASE)
  81  |     await page.locator('nav a[href="/dogs"]').first().click()
  82  |     await expect(page).toHaveURL(`${BASE}/dogs`)
  83  |   })
  84  | 
  85  |   test('footer links to About, FAQ, Contact', async ({ page }) => {
  86  |     await page.goto(BASE)
  87  |     const footer = page.locator('footer')
  88  |     await expect(footer.locator('a[href="/about"]')).toBeVisible()
  89  |     await expect(footer.locator('a[href="/faq"]')).toBeVisible()
  90  |     await expect(footer.locator('a[href="/contact"]')).toBeVisible()
  91  |   })
  92  | 
  93  |   test('footer shows Loyalty Repaid motto', async ({ page }) => {
  94  |     await page.goto(BASE)
  95  |     await expect(page.locator('footer').locator('text=LOYALTY REPAID')).toBeVisible()
  96  |   })
  97  | })
  98  | 
  99  | // ─── Register Page ───────────────────────────────────────────────────────────
  100 | 
  101 | test.describe('Register Page', () => {
  102 |   test('loads with Shelter and Rescue tabs', async ({ page }) => {
  103 |     await page.goto(`${BASE}/register`)
  104 |     await expect(page.locator('button:text("Shelter")').first()).toBeVisible()
  105 |     await expect(page.locator('button:text("Rescue")').first()).toBeVisible()
  106 |   })
  107 | 
  108 |   test('shelter tab is active by default', async ({ page }) => {
  109 |     await page.goto(`${BASE}/register`)
  110 |     await expect(page.locator('button:text("Shelter")').first()).toHaveCSS('background-color', 'rgb(245, 158, 11)')
  111 |   })
  112 | 
  113 |   test('?type=rescue pre-selects rescue tab', async ({ page }) => {
  114 |     await page.goto(`${BASE}/register?type=rescue`)
  115 |     await expect(page.locator('button:text("Rescue")').first()).toHaveCSS('background-color', 'rgb(245, 158, 11)')
  116 |   })
  117 | 
  118 |   test('shows all required fields', async ({ page }) => {
  119 |     await page.goto(`${BASE}/register`)
  120 |     await expect(page.locator('input[name="orgName"]')).toBeVisible()
  121 |     await expect(page.locator('input[name="city"]')).toBeVisible()
  122 |     await expect(page.locator('input[name="email"]')).toBeVisible()
  123 |     await expect(page.locator('input[name="password"]')).toBeVisible()
  124 |   })
  125 | 
  126 |   test('shows 501(c)(3) upload for shelter', async ({ page }) => {
  127 |     await page.goto(`${BASE}/register`)
  128 |     await expect(page.locator('text=501(c)(3)')).toBeVisible()
  129 |   })
  130 | 
  131 |   test('shows 501(c)(3) upload for rescue', async ({ page }) => {
  132 |     await page.goto(`${BASE}/register`)
  133 |     await page.locator('button:text("Rescue")').first().click()
  134 |     await expect(page.locator('text=501(c)(3)')).toBeVisible()
  135 |   })
  136 | 
```