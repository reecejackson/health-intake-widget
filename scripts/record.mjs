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

// wait for the preview server BEFORE the recording context exists —
// recording starts at context creation, so any wait after that point
// becomes blank white frames at the head of the video
for (let i = 0; i < 40; i++) {
  try {
    await fetch(URL)
    break
  } catch {
    await new Promise((r) => setTimeout(r, 250))
  }
}

const browser = await chromium.launch()
// Playwright's screencast captures at CSS-viewport size and never upscales,
// so supersampling must happen in-page: a 2560x1440 viewport with the page
// at 2x CSS zoom renders a 1280x720 layout at double resolution. The ffmpeg
// pass then downscales the master to a sharp 1080p.
const context = await browser.newContext({
  viewport: { width: 2560, height: 1440 },
  recordVideo: { dir: 'video/raw', size: { width: 2560, height: 1440 } },
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

await page.goto(URL)
await page.evaluate(() => {
  document.documentElement.style.zoom = '2'
})

await page.mouse.move(1280, 600)
await pause(3400) // hold on the hero (the first ~1.5s is trimmed below)

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
  // trim the pre-paint blank frames so the video (and its poster
  // thumbnail in Slides/Drive) opens on the hero, not a white screen
  '-ss',
  '1.5',
  '-i',
  'video/walkthrough.webm',
  '-vf',
  'scale=1920:1080:flags=lanczos',
  '-c:v',
  'libx264',
  '-pix_fmt',
  'yuv420p',
  '-r',
  '30',
  '-crf',
  '16',
  '-preset',
  'slow',
  '-profile:v',
  'high',
  '-movflags',
  '+faststart',
  'video/walkthrough.mp4',
])
console.log('done: video/walkthrough.mp4')
