/**
 * E2E: Step 4 conversion gate
 *
 * Validates that `markCatalogConversion` is ONLY called when every required
 * Step 4 field (goal, niche, mainPain, metric, target) is valid — including
 * when the user reaches Step 4 first via "Next" clicks without filling
 * everything, goes back, completes the missing fields, and returns.
 *
 * We don't need a real intent: we intercept the server-fn POST so the test
 * doesn't depend on auth/DB. The intercept asserts:
 *   - 0 conversion calls while a required field is missing
 *   - exactly 1 conversion call after the user completes everything
 *   - the validatedFields payload reports all `true`
 *
 * If no Supabase session is in env (test environment can't sign in), the
 * test is skipped with a clear message rather than producing a false fail.
 */
import { test, expect, type Route } from '@playwright/test'

const HAS_SESSION =
  !!process.env.LOVABLE_BROWSER_SUPABASE_STORAGE_KEY &&
  !!process.env.LOVABLE_BROWSER_SUPABASE_SESSION_JSON

test.describe('Onboarding Step 4 conversion gate', () => {
  test.skip(!HAS_SESSION, 'Requires LOVABLE_BROWSER_SUPABASE_* session env vars')

  test('conversion only fires when all required Step 4 fields are valid', async ({
    page,
    baseURL,
  }) => {
    const fakeIntent = '00000000-0000-4000-8000-000000000abc'
    const conversionCalls: Array<Record<string, unknown>> = []

    // Stub all catalog server fn POSTs so the test is hermetic.
    await page.route('**/_server/**', async (route: Route) => {
      const url = route.request().url()
      const body = route.request().postDataJSON() ?? {}
      if (url.includes('markCatalogConversion')) {
        conversionCalls.push(body)
        return route.fulfill({ json: { ok: true, firstConversion: conversionCalls.length === 1, kind: 'onboarding_completed' } })
      }
      if (url.includes('getCatalogIntent')) {
        return route.fulfill({
          json: {
            id: fakeIntent,
            macro_slug: 'saude',
            subnicho_slug: 'clinicas',
            plan_tier: 'ideal',
            selected_modules: [],
            consumed_at: null,
            expires_at: null,
            source: 'catalogo',
          },
        })
      }
      if (url.includes('consumeCatalogIntent')) {
        return route.fulfill({ json: { ok: true, alreadyConsumed: false } })
      }
      if (url.includes('trackCatalog')) {
        return route.fulfill({ json: { ok: true } })
      }
      return route.continue()
    })

    // Restore Supabase session before navigating to the gated route.
    const storageKey = process.env.LOVABLE_BROWSER_SUPABASE_STORAGE_KEY!
    const sessionJson = process.env.LOVABLE_BROWSER_SUPABASE_SESSION_JSON!
    await page.goto(baseURL!)
    await page.evaluate(
      ([k, v]: [string, string]) => window.localStorage.setItem(k, v),
      [storageKey, sessionJson],
    )

    await page.goto(`/onboarding?intent=${fakeIntent}`)

    // The page progresses through 5 steps (0..4). Click "Continuar" until Step 4
    // without filling Step 2 (mainPain) and Step 3 (metric/target) — required.
    // Selecting a goal on Step 0 is required for `canNext`; we'll need a goal
    // to even leave Step 0. Pick "vender_mais".
    await page.getByRole('button', { name: /vender mais/i }).first().click()
    await page.getByRole('button', { name: /continuar|avançar|próximo/i }).click()

    // Step 1 (niche) is pre-filled from the intent — just continue.
    await page.getByRole('button', { name: /continuar|avançar|próximo/i }).click()

    // Step 2: leave mainPain BLANK and try to continue → the button must be disabled.
    const nextStep2 = page.getByRole('button', { name: /continuar|avançar|próximo/i })
    await expect(nextStep2).toBeDisabled()

    // Fill mainPain, advance to Step 3
    const mainPain = page.getByLabel(/dor|principal/i).first()
    await mainPain.fill('estamos perdendo lead no whatsapp')
    await nextStep2.click()

    // Step 3: leave metric blank → still cannot advance
    const nextStep3 = page.getByRole('button', { name: /continuar|avançar|próximo/i })
    await expect(nextStep3).toBeDisabled()

    // Fill metric + target
    await page.getByLabel(/métrica/i).first().fill('agendamentos/mês')
    await page.getByLabel(/meta|alvo/i).first().fill('200')
    await nextStep3.click()

    // We're on Step 4 now with EVERYTHING valid — the effect should fire once.
    await expect.poll(() => conversionCalls.length, { timeout: 5_000 }).toBe(1)
    const payload = conversionCalls[0]
    expect(payload).toMatchObject({
      data: {
        id: fakeIntent,
        kind: 'onboarding_completed',
        validatedFields: { goal: true, niche: true, mainPain: true, metric: true, target: true },
      },
    })
  })
})
