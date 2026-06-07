// Verifies the triage logic end-to-end against the production build:
// every care tier must be reachable via a real click path, and the
// red-flag short-circuit must skip remaining questions.
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import { mkdirSync } from 'node:fs'

const URL = 'http://localhost:4173/health-intake-widget/'
mkdirSync('shots', { recursive: true })

const preview = spawn('npx', ['vite', 'preview', '--port', '4173', '--strictPort'], {
  stdio: 'ignore',
})

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })

// wait for preview server
for (let i = 0; i < 20; i++) {
  try {
    await page.goto(URL, { timeout: 1000 })
    break
  } catch {
    await new Promise((r) => setTimeout(r, 300))
  }
}

const CASES = [
  {
    name: 'asthma red-flag short-circuit',
    pill: 'asthma care',
    answers: ["Yes — it's hard to speak or catch my breath"],
    expect: 'Urgent / emergency care',
    shot: 'result-emergency.png',
  },
  {
    name: 'back pain mild → self-care products',
    pill: 'back pain relief',
    answers: ['No', 'No — it came on gradually', 'A few days'],
    expect: 'Self-care',
    shot: 'result-otc.png',
  },
  {
    name: 'migraine refill → pharmacy',
    pill: 'migraine relief',
    answers: [
      'No, it feels like my usual migraines',
      'A few times a year',
      'Yes — I just need a refill',
    ],
    expect: 'Pharmacy',
    shot: 'result-pharmacy.png',
  },
  {
    name: 'uti typical → virtual care',
    pill: 'uti relief',
    answers: ['No, just urinary symptoms', '1–3 days', 'Yes — I recognize these symptoms'],
    expect: 'Virtual care',
    shot: 'result-virtual.png',
  },
  {
    name: 'asthma worsening → primary care',
    pill: 'asthma care',
    answers: ["No, but I'm wheezing more than usual", 'Most days', 'Steadily getting worse'],
    expect: 'Primary care',
    shot: 'result-primary.png',
  },
]

let failed = 0

// landing page + search suggestions screenshots
await page.goto(URL)
await page.screenshot({ path: 'shots/01-hero.png' })
await page.getByRole('textbox', { name: 'Search' }).fill('asthma')
await page.waitForSelector('.suggestions')
await page.screenshot({ path: 'shots/02-suggestions.png' })

for (const c of CASES) {
  await page.goto(URL)
  await page.getByRole('button', { name: c.pill, exact: true }).click()
  for (const a of c.answers) {
    await page.getByRole('button', { name: a, exact: true }).click()
  }
  const tier = (await page.locator('.tier-name').textContent()).trim()
  const ok = tier === `Recommended: ${c.expect}`
  if (!ok) failed++
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${c.name}  →  "${tier}" (expected "${c.expect}")`)
  await page.waitForTimeout(700) // let entrance animations settle before the screenshot
  await page.screenshot({ path: `shots/${c.shot}` })
}

// question card screenshot (mid-intake)
await page.goto(URL)
await page.getByRole('button', { name: 'asthma care', exact: true }).click()
await page.waitForSelector('.question')
await page.waitForTimeout(1200) // widget entrance has a 0.45s delayed slide-in
await page.screenshot({ path: 'shots/03-question.png' })

await browser.close()
preview.kill()
process.exit(failed > 0 ? 1 : 0)
