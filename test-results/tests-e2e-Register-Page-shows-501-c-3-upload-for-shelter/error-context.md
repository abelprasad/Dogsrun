# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tests\e2e.spec.ts >> Register Page >> shows 501(c)(3) upload for shelter
- Location: tests\e2e.spec.ts:126:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('text=501(c)(3)')
Expected: visible
Error: strict mode violation: locator('text=501(c)(3)') resolved to 2 elements:
    1) <label class="mb-1 block text-xs font-bold uppercase tracking-[0.18em] text-[#5d6a64]">…</label> aka getByText('(c)(3) Determination Letter *')
    2) <div class="text-[#6b7280] text-xs font-medium">…</div> aka getByText('© 2026 DOGSRUN | 501(c)(3)')

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('text=501(c)(3)')

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
        - generic [ref=e21]: Join the network
        - heading "Join the network" [level=1] [ref=e23]
        - paragraph [ref=e24]: Help us save more dogs, faster.
      - main [ref=e25]:
        - generic [ref=e26]:
          - generic [ref=e27]:
            - generic [ref=e28]:
              - button "shelter" [ref=e29]
              - button "rescue" [ref=e30]
            - generic [ref=e31]:
              - generic [ref=e32]:
                - generic [ref=e33]: Organization Name
                - textbox "City Animal Shelter" [ref=e34]
              - generic [ref=e35]:
                - generic [ref=e36]:
                  - generic [ref=e37]: City
                  - textbox "Philadelphia" [ref=e38]
                - generic [ref=e39]:
                  - generic [ref=e40]: State
                  - combobox [ref=e41]:
                    - option "Select state..." [selected]
                    - option "AL"
                    - option "AK"
                    - option "AZ"
                    - option "AR"
                    - option "CA"
                    - option "CO"
                    - option "CT"
                    - option "DE"
                    - option "FL"
                    - option "GA"
                    - option "HI"
                    - option "ID"
                    - option "IL"
                    - option "IN"
                    - option "IA"
                    - option "KS"
                    - option "KY"
                    - option "LA"
                    - option "ME"
                    - option "MD"
                    - option "MA"
                    - option "MI"
                    - option "MN"
                    - option "MS"
                    - option "MO"
                    - option "MT"
                    - option "NE"
                    - option "NV"
                    - option "NH"
                    - option "NJ"
                    - option "NM"
                    - option "NY"
                    - option "NC"
                    - option "ND"
                    - option "OH"
                    - option "OK"
                    - option "OR"
                    - option "PA"
                    - option "RI"
                    - option "SC"
                    - option "SD"
                    - option "TN"
                    - option "TX"
                    - option "UT"
                    - option "VT"
                    - option "VA"
                    - option "WA"
                    - option "WV"
                    - option "WI"
                    - option "WY"
                    - option "DC"
              - generic [ref=e42]:
                - generic [ref=e43]: Work Email
                - textbox "director@org.org" [ref=e44]
              - generic [ref=e45]:
                - generic [ref=e46]: Password
                - textbox [ref=e47]
              - generic [ref=e48]:
                - generic [ref=e49]: 501(c)(3) Determination Letter *
                - paragraph [ref=e50]: PDF only · Max 10MB
                - generic [ref=e51] [cursor=pointer]:
                  - img [ref=e52]
                  - generic [ref=e54]: Click to upload PDF
              - button "Register as Shelter" [ref=e55]
          - paragraph [ref=e56]:
            - text: Already have an account?
            - link "Login" [ref=e57] [cursor=pointer]:
              - /url: /auth/login
  - contentinfo [ref=e58]:
    - generic [ref=e60]:
      - generic [ref=e61]:
        - img "DOGSRUN logo" [ref=e62]
        - generic [ref=e63]:
          - generic [ref=e64]: DOGSRUN
          - text: Loyalty Repaid
      - generic [ref=e65]:
        - link "Browse Dogs" [ref=e66] [cursor=pointer]:
          - /url: /dogs
        - link "About" [ref=e67] [cursor=pointer]:
          - /url: /about
        - link "FAQ" [ref=e68] [cursor=pointer]:
          - /url: /faq
        - link "Contact" [ref=e69] [cursor=pointer]:
          - /url: /contact
      - generic [ref=e70]: © 2026 DOGSRUN | 501(c)(3) nonprofit
  - button "Open Next.js Dev Tools" [ref=e76] [cursor=pointer]:
    - img [ref=e77]
```

# Test source

```ts
  28  |       await expect(page).toHaveURL(/\/dogs\/[a-z0-9-]+/)
  29  |       await expect(page.locator('h1').first()).toBeVisible()
  30  |     }
  31  |   })
  32  | 
  33  |   test('about page loads with mission and nonprofit info', async ({ page }) => {
  34  |     await page.goto(`${BASE}/about`)
  35  |     await expect(page.locator('text=About DOGSRUN')).toBeVisible()
  36  |     await expect(page.locator('text=Our Mission')).toBeVisible()
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
> 128 |     await expect(page.locator('text=501(c)(3)')).toBeVisible()
      |                                                  ^ Error: expect(locator).toBeVisible() failed
  129 |   })
  130 | 
  131 |   test('shows 501(c)(3) upload for rescue', async ({ page }) => {
  132 |     await page.goto(`${BASE}/register`)
  133 |     await page.locator('button:text("Rescue")').first().click()
  134 |     await expect(page.locator('text=501(c)(3)')).toBeVisible()
  135 |   })
  136 | 
  137 |   test('submit button label updates with tab', async ({ page }) => {
  138 |     await page.goto(`${BASE}/register`)
  139 |     await expect(page.locator('button:text("Register as Shelter")')).toBeVisible()
  140 |     await page.locator('button:text("Rescue")').first().click()
  141 |     await expect(page.locator('button:text("Register as Rescue")')).toBeVisible()
  142 |   })
  143 | 
  144 |   test('blocks submission without required fields', async ({ page }) => {
  145 |     await page.goto(`${BASE}/register`)
  146 |     await page.locator('button:text("Register as Shelter")').click()
  147 |     await expect(page).toHaveURL(`${BASE}/register`)
  148 |   })
  149 | 
  150 |   test('blocks submission with invalid email', async ({ page }) => {
  151 |     await page.goto(`${BASE}/register`)
  152 |     await page.fill('input[name="orgName"]', 'Test Shelter')
  153 |     await page.fill('input[name="city"]', 'Philadelphia')
  154 |     await page.fill('input[name="email"]', 'notanemail')
  155 |     await page.fill('input[name="password"]', 'password123')
  156 |     await page.locator('button:text("Register as Shelter")').click()
  157 |     await expect(page).toHaveURL(`${BASE}/register`)
  158 |   })
  159 | 
  160 |   test('blocks submission with short password', async ({ page }) => {
  161 |     await page.goto(`${BASE}/register`)
  162 |     await page.fill('input[name="orgName"]', 'Test Shelter')
  163 |     await page.fill('input[name="city"]', 'Philadelphia')
  164 |     await page.fill('input[name="email"]', 'test@shelter.org')
  165 |     await page.fill('input[name="password"]', '123')
  166 |     await page.locator('button:text("Register as Shelter")').click()
  167 |     await expect(page).toHaveURL(`${BASE}/register`)
  168 |   })
  169 | 
  170 |   test('login link navigates to login page', async ({ page }) => {
  171 |     await page.goto(`${BASE}/register`)
  172 |     await page.locator('a[href="/auth/login"]').last().click()
  173 |     await expect(page).toHaveURL(`${BASE}/auth/login`)
  174 |   })
  175 | })
  176 | 
  177 | // ─── Login Page ───────────────────────────────────────────────────────────────
  178 | 
  179 | test.describe('Login Page', () => {
  180 |   test('loads with email and password fields', async ({ page }) => {
  181 |     await page.goto(`${BASE}/auth/login`)
  182 |     await expect(page.locator('input[type="email"]')).toBeVisible()
  183 |     await expect(page.locator('input[type="password"]')).toBeVisible()
  184 |     await expect(page.locator('text=Welcome back')).toBeVisible()
  185 |   })
  186 | 
  187 |   test('toggle to magic link hides password field', async ({ page }) => {
  188 |     await page.goto(`${BASE}/auth/login`)
  189 |     await page.locator('button:text("Use magic link instead")').click()
  190 |     await expect(page.locator('input[type="password"]')).not.toBeVisible()
  191 |     await expect(page.locator('button:text("Send magic link")')).toBeVisible()
  192 |   })
  193 | 
  194 |   test('toggle back to password mode', async ({ page }) => {
  195 |     await page.goto(`${BASE}/auth/login`)
  196 |     await page.locator('button:text("Use magic link instead")').click()
  197 |     await page.locator('button:text("Use password instead")').click()
  198 |     await expect(page.locator('input[type="password"]')).toBeVisible()
  199 |   })
  200 | 
  201 |   test('shows error on wrong credentials', async ({ page }) => {
  202 |     await page.goto(`${BASE}/auth/login`)
  203 |     await page.fill('input[type="email"]', 'wrong@example.com')
  204 |     await page.fill('input[type="password"]', 'wrongpassword')
  205 |     await page.locator('button:text("Sign in")').click()
  206 |     await page.waitForLoadState('networkidle', { timeout: 15000 })
  207 |     await expect(page).toHaveURL(`${BASE}/auth/login`)
  208 |     const body = await page.textContent('body')
  209 |     expect(body?.toLowerCase()).toMatch(/invalid|error|incorrect|credentials|failed/)
  210 |   })
  211 | 
  212 |   test('register link navigates to register', async ({ page }) => {
  213 |     await page.goto(`${BASE}/auth/login`)
  214 |     await page.locator('a[href="/register"]').last().click()
  215 |     await expect(page).toHaveURL(`${BASE}/register`)
  216 |   })
  217 | })
  218 | 
  219 | // ─── Auth Guards ──────────────────────────────────────────────────────────────
  220 | 
  221 | test.describe('Auth Guards', () => {
  222 |   async function assertBlocked(page: Page, url: string, sensitiveText: string) {
  223 |     await page.goto(url)
  224 |     await page.waitForLoadState('networkidle')
  225 |     const redirected = page.url().includes('login') || page.url().includes('register')
  226 |     const hasContent = await page.locator(`text=${sensitiveText}`).isVisible()
  227 |     expect(redirected || !hasContent).toBeTruthy()
  228 |   }
```