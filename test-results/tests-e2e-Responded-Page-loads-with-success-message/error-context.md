# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tests\e2e.spec.ts >> Responded Page >> loads with success message
- Location: tests\e2e.spec.ts:258:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('text=Response Received')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('text=Response Received')

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
      - heading "You're Interested ✓" [level=1] [ref=e21]
      - main [ref=e22]:
        - generic [ref=e23]:
          - img [ref=e25]
          - paragraph [ref=e27]: The shelter has been notified and will reach out to you directly.
          - generic [ref=e28]:
            - link "Log in to your rescue portal" [ref=e29] [cursor=pointer]:
              - /url: /auth/login
            - link "Browse available dogs" [ref=e30] [cursor=pointer]:
              - /url: /dogs
  - contentinfo [ref=e31]:
    - generic [ref=e33]:
      - generic [ref=e34]:
        - img "DOGSRUN logo" [ref=e35]
        - generic [ref=e36]:
          - generic [ref=e37]: DOGSRUN
          - text: Loyalty Repaid
      - generic [ref=e38]:
        - link "Browse Dogs" [ref=e39] [cursor=pointer]:
          - /url: /dogs
        - link "About" [ref=e40] [cursor=pointer]:
          - /url: /about
        - link "FAQ" [ref=e41] [cursor=pointer]:
          - /url: /faq
        - link "Contact" [ref=e42] [cursor=pointer]:
          - /url: /contact
      - generic [ref=e43]: © 2026 DOGSRUN | 501(c)(3) nonprofit
  - button "Open Next.js Dev Tools" [ref=e49] [cursor=pointer]:
    - img [ref=e50]
  - alert [ref=e53]
```

# Test source

```ts
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
  229 | 
  230 |   test('shelter dashboard blocked when logged out', async ({ page }) => {
  231 |     await assertBlocked(page, `${BASE}/dashboard`, 'My Dogs')
  232 |   })
  233 | 
  234 |   test('my dogs page blocked when logged out', async ({ page }) => {
  235 |     await assertBlocked(page, `${BASE}/dashboard/dogs`, 'Add a dog')
  236 |   })
  237 | 
  238 |   test('add dog page blocked when logged out', async ({ page }) => {
  239 |     await assertBlocked(page, `${BASE}/dashboard/dogs/new`, 'Post to Network')
  240 |   })
  241 | 
  242 |   test('rescue portal blocked when logged out', async ({ page }) => {
  243 |     await assertBlocked(page, `${BASE}/dashboard/rescue`, 'Interested')
  244 |   })
  245 | 
  246 |   test('rescue criteria blocked when logged out', async ({ page }) => {
  247 |     await assertBlocked(page, `${BASE}/dashboard/criteria`, 'Save Criteria')
  248 |   })
  249 | 
  250 |   test('admin panel blocked when logged out', async ({ page }) => {
  251 |     await assertBlocked(page, `${BASE}/dashboard/admin`, 'Admin Panel')
  252 |   })
  253 | })
  254 | 
  255 | // ─── Responded Page ───────────────────────────────────────────────────────────
  256 | 
  257 | test.describe('Responded Page', () => {
  258 |   test('loads with success message', async ({ page }) => {
  259 |     await page.goto(`${BASE}/responded`)
> 260 |     await expect(page.locator('text=Response Received')).toBeVisible()
      |                                                          ^ Error: expect(locator).toBeVisible() failed
  261 |     await expect(page.locator('a[href="/dashboard/rescue"]')).toBeVisible()
  262 |   })
  263 | })
  264 | 
```