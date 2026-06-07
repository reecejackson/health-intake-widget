// Records the ~60s walkthrough video for the presentation slide:
// run 1 — "asthma care" red-flag short-circuit → emergency care
// run 2 — "back pain" mild path → self-care product recommendations
// Outputs video/walkthrough.mp4 (1920x1080, 30fps).
import { chromium } from 'playwright'
import { spawn, execFileSync } from 'node:child_process'
import { mkdirSync, readdirSync, renameSync, rmSync } from 'node:fs'
import ffmpegPath from 'ffmpeg-static'

const URL = 'http://localhost:4173/health-intake-widget/'
mkdirSync('video', { recursive: true })

const preview = spawn('npx', ['vite', 'preview', '--port', '4173', '--strictPort'], {
  stdio: 'ignore',
})

const browser = await chromium.launch()
const context = await browser.newContext({
  viewport: { width: 1920, height: 1080 },
  recordVideo: { dir: 'video/raw', size: { width: 1920, height: 1080 } },
})

// visible cursor dot — Playwright videos don't render the OS pointer
await context.addInitScript(() => {
  window.addEventListener('DOMContentLoaded', () => {
    const dot = document.createElement('div')
    dot.style.cssText =
      'position:fixed;z-index:99999;width:22px;height:22px;border-radius:50%;' +
      'background:rgba(15,17,17,.45);border:2.5px solid #fff;' +
      'box-shadow:0 1px 6px rgba(0,0,0,.45);pointer-events:none;' +
      'transform:translate(-50%,-50%);left:-50px;top:-50px;transition:width .1s,height .1s'
    document.body.appendChild(dot)
    window.addEventListener('mousemove', (e) => {
      dot.style.left = e.clientX + 'px'
      dot.style.top = e.clientY + 'px'
    })
    window.addEventListener('mousedown', () => {
      dot.style.width = '17px'
      dot.style.height = '17px'
    })
    window.addEventListener('mouseup', () => {
      dot.style.width = '22px'
      dot.style.height = '22px'
    })
  })
})

const page = await context.newPage()

const pause = (ms) => page.waitForTimeout(ms)

async function moveAndClick(locator, settle = 350) {
  const box = await locator.boundingBox()
  const x = box.x + box.width / 2
  const y = box.y + box.height / 2
  await page.mouse.move(x, y, { steps: 28 })
  await pause(settle)
  await page.mouse.down()
  await pause(90)
  await page.mouse.up()
}

async function searchFor(text, suggestion) {
  await moveAndClick(page.getByRole('textbox', { name: 'Search' }))
  await page.keyboard.type(text, { delay: 115 })
  await pause(1100) // let the suggestion dropdown register
  await moveAndClick(page.locator('.suggestions button', { hasText: suggestion }))
}

async function answerSequence(labels, beforeMs = 2000) {
  for (const label of labels) {
    await pause(beforeMs)
    await moveAndClick(page.getByRole('button', { name: label, exact: true }))
  }
}

// wait for preview server
for (let i = 0; i < 20; i++) {
  try {
    await page.goto(URL, { timeout: 1000 })
    break
  } catch {
    await new Promise((r) => setTimeout(r, 300))
  }
}

await page.mouse.move(960, 400)
await pause(2600) // hold on the hero

// ---- run 1: asthma care → red-flag → emergency ----
await searchFor('asthma care', 'asthma care')
await pause(2400) // topic chip + widget entrance
await answerSequence(["Yes — it's hard to speak or catch my breath"])
await pause(6500) // hold on the emergency recommendation

await moveAndClick(page.getByRole('button', { name: 'Start over' }))
await pause(1300)

// ---- run 2: back pain → mild path → self-care products ----
await searchFor('back pain', 'back pain relief')
await pause(1800)
await answerSequence(['No', 'No — it came on gradually', 'A few days'])
await pause(8000) // hold on the product recommendations

await context.close()
await browser.close()
preview.kill()

// convert webm -> mp4 for Google Slides
const raw = readdirSync('video/raw').find((f) => f.endsWith('.webm'))
renameSync(`video/raw/${raw}`, 'video/walkthrough.webm')
rmSync('video/raw', { recursive: true })
execFileSync(ffmpegPath, [
  '-y',
  '-i',
  'video/walkthrough.webm',
  '-c:v',
  'libx264',
  '-pix_fmt',
  'yuv420p',
  '-r',
  '30',
  '-crf',
  '20',
  'video/walkthrough.mp4',
])
console.log('done: video/walkthrough.mp4')
