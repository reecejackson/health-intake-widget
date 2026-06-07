# Health Intake Widget — Presentation Demo

Recreation of the Amazon health-search intake widget for Reece's strategy presentation.
Narrative: search intent → topic detection → Amazon Care reasons-for-visit triage → routed level of care ("just products" vs. see a clinician).

## Spec (agreed via grilling session)

**Flow**
- [ ] Amazon-inspired mock search bar (light theme, navy header, orange accents, NO Amazon logo/trademarks)
- [ ] 4 seeded queries via keyword matching (no real NLP): **asthma care, UTI, migraine, back pain**
- [ ] Visible "Health topic detected: X" chip moment, then intake widget slides in
- [ ] 3 triage questions per topic, modeled on reasons-for-visit signals; each answer carries a severity weight
- [ ] **Red-flag short-circuit**: Q1 per topic escalates immediately to emergency tier (e.g., asthma "severe trouble breathing right now")

**Triage questions** (clinically plausible drafts)
| Topic | Q1 — red flag | Q2 | Q3 |
|---|---|---|---|
| Asthma | Severe trouble breathing right now? | Rescue inhaler frequency | Worsening over days? |
| UTI | Fever / back pain / vomiting? | Symptom duration | Had UTIs before? |
| Migraine | Worst headache of life / sudden onset? | Frequency per month | Current meds working? |
| Back pain | Leg numbness / loss of bladder control? | Recent injury? | Duration (acute vs chronic) |

**5 care tiers** (each demo topic should be able to land on a different tier)
1. Self-care / OTC products → 2–3 mock product cards (name, price, "Add to cart")
2. Pharmacy (refill-style)
3. Virtual care ("Start virtual visit – $35")
4. One Medical-style primary care ("Book a visit")
5. Emergency / urgent care ("Find urgent care near you") ← red-flag outcome

**Recommendation screen**
- [ ] "Based on your answers: …" rationale line (makes the dataset retrofit visible)
- [ ] Realistic but dead CTAs per tier
- [ ] Product cards on tier 1

**Polish**
- [ ] Smooth step transitions (slide/fade) — matters for the recorded video
- [ ] "Start over" reset button
- [ ] Subtle progress dots
- [ ] Disclaimer footer: concept demo, not medical advice, not affiliated with Amazon

**Stack**
- [ ] Vite + React + TypeScript, single plain CSS file, zero other deps
- [ ] All triage data in one typed `triage-data.ts` config (data drives the widget)
- [ ] No code will be shown in the presentation — optimize for on-screen experience

**Delivery**
- [ ] Static production build
- [ ] Deploy to **GitHub Pages** via `gh` (only authenticated CLI available)
- [ ] **Scripted Playwright walkthrough video** (~60s, 1920×1080 MP4, human-paced):
      asthma red-flag escalation run + back-pain → products run
- [ ] Reece embeds MP4 in Google Slide (via Drive) + puts live link on slide
- [ ] Ruled out: Google Apps Script HTML Service wrapping (works as hosting, but Slides
      cannot embed web apps; dialogs only work in edit mode)

## Tasks
- [x] Scaffold Vite + React + TS app
- [x] Build `triage-data.ts` (topics, questions, weights, tiers, products, rationales)
- [x] Build components: SearchBar → TopicChip → IntakeQuestions → RecommendationCard
- [x] Styling (Amazon-inspired light theme) + transitions + progress dots + reset + disclaimer
- [x] Verify all 4 topics land on distinct tiers; verify red-flag short-circuits
- [x] Production build, deploy to GitHub Pages
- [x] Playwright-scripted MP4 walkthrough
- [x] Hand off: live URL + video file

## Review

**Shipped 2026-06-06.**

- **Live demo:** https://reecejackson.github.io/health-intake-widget/
- **Repo:** https://github.com/reecejackson/health-intake-widget (public)
- **Video:** `video/walkthrough.mp4` — 41.6s, 1920×1080, 1.0 MB. Run 1: asthma
  red-flag → emergency. Run 2: back pain mild path → self-care products.
- **Verification:** `node scripts/verify.mjs` asserts all 5 care tiers are
  reachable via real click paths against the production build (5/5 PASS):
  emergency (asthma red flag), self-care (back pain mild), pharmacy (migraine
  refill), virtual (UTI typical), primary (asthma worsening).
- **Re-record video:** `node scripts/record.mjs` (after `npm run build`).
- Architecture: all triage logic lives in `src/triage-data.ts` — topics →
  weighted questions → per-topic severity bands → tiers, red flags short-circuit.
  `App.tsx` is a small phase state machine (search → intake → result).
- Notes: gh CLI is v1.x (legacy `repo create` syntax); Pages serves the
  `gh-pages` branch (deploy = build + force-push `dist/`).
