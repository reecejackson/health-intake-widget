// Triage configuration — a lightweight stand-in for the Amazon Care
// "reasons for visit" dataset. Each health topic carries intake questions
// whose answers are weighted; the summed severity score maps to a level
// of care via per-topic bands. Red-flag answers short-circuit straight
// to emergency care.

export type TierId = 'otc' | 'pharmacy' | 'virtual' | 'primary' | 'emergency'

export interface Tier {
  id: TierId
  name: string
  icon: string
  headline: string
  description: string
  cta: string
  accent: string
}

export interface AnswerOption {
  label: string
  weight: number
  /** short fragment used in the "Based on your answers" rationale */
  summary: string
  /** immediately escalate to emergency care */
  redFlag?: boolean
}

export interface Question {
  text: string
  options: AnswerOption[]
}

export interface Product {
  emoji: string
  name: string
  price: string
  reviews: string
}

export interface Band {
  /** minimum severity score for this tier; bands are checked highest-first */
  min: number
  tier: TierId
}

export interface Topic {
  id: string
  name: string
  /** the seeded search query shown in suggestions */
  query: string
  keywords: string[]
  questions: Question[]
  products: Product[]
  bands: Band[]
}

export const TIERS: Record<TierId, Tier> = {
  otc: {
    id: 'otc',
    name: 'Self-care',
    icon: '🧺',
    headline: 'You can likely manage this with over-the-counter products',
    description:
      'Your answers suggest mild symptoms that usually respond to self-care. These customer favorites can help — and a clinician is one step away if anything changes.',
    cta: 'Add to cart',
    accent: '#067D62',
  },
  pharmacy: {
    id: 'pharmacy',
    name: 'Pharmacy',
    icon: '💊',
    headline: 'A pharmacy refill looks like the right next step',
    description:
      'It sounds like your treatment is working and you mainly need your medication. Transfer or refill your prescription and have it delivered.',
    cta: 'Refill a prescription',
    accent: '#007185',
  },
  virtual: {
    id: 'virtual',
    name: 'Virtual care',
    icon: '💻',
    headline: 'A virtual visit can treat this — usually within the hour',
    description:
      'Symptoms like yours typically need a prescription, but not an in-person exam. Message a licensed clinician and pick up treatment today.',
    cta: 'Start virtual visit · $35',
    accent: '#3358D4',
  },
  primary: {
    id: 'primary',
    name: 'Primary care',
    icon: '🩺',
    headline: 'Book an in-person visit with a primary care provider',
    description:
      'Your answers suggest something that deserves an exam and an ongoing care plan, not a one-off fix. A primary care provider can take it from here.',
    cta: 'Book a primary care visit',
    accent: '#6649B8',
  },
  emergency: {
    id: 'emergency',
    name: 'Urgent / emergency care',
    icon: '🚨',
    headline: 'Please seek in-person care right away',
    description:
      'One of your answers is a red-flag symptom that should be evaluated immediately. If symptoms are severe, call 911 or go to the nearest emergency room.',
    cta: 'Find urgent care near you',
    accent: '#B12704',
  },
}

export const TOPICS: Topic[] = [
  {
    id: 'asthma',
    name: 'Asthma',
    query: 'asthma care',
    keywords: ['asthma', 'inhaler', 'wheez', 'albuterol'],
    questions: [
      {
        text: 'Are you having severe trouble breathing right now?',
        options: [
          {
            label: "Yes — it's hard to speak or catch my breath",
            weight: 0,
            summary: 'severe difficulty breathing right now',
            redFlag: true,
          },
          {
            label: "No, but I'm wheezing more than usual",
            weight: 2,
            summary: 'increased wheezing',
          },
          {
            label: 'No, my breathing is okay',
            weight: 0,
            summary: 'no acute breathing trouble',
          },
        ],
      },
      {
        text: 'How often have you needed your rescue inhaler this week?',
        options: [
          { label: "I haven't needed it", weight: 0, summary: 'no rescue inhaler use' },
          { label: 'Once or twice', weight: 1, summary: 'occasional rescue inhaler use' },
          { label: 'Most days', weight: 3, summary: 'rescue inhaler needed most days' },
        ],
      },
      {
        text: 'How have your symptoms changed over the past few days?',
        options: [
          {
            label: 'Steadily getting worse',
            weight: 3,
            summary: 'symptoms steadily worsening',
          },
          { label: 'About the same', weight: 1, summary: 'symptoms stable' },
          {
            label: 'I mostly need a refill of my usual prescription',
            weight: 2,
            summary: 'stable — needs a prescription refill',
          },
        ],
      },
    ],
    products: [
      { emoji: '🌬️', name: 'Peak flow meter', price: '$19.99', reviews: '8,214' },
      {
        emoji: '🛏️',
        name: 'Allergen-barrier pillow covers, 2-pack',
        price: '$14.99',
        reviews: '23,907',
      },
      { emoji: '🌀', name: 'HEPA air purifier, small room', price: '$89.99', reviews: '41,332' },
    ],
    bands: [
      { min: 6, tier: 'primary' },
      { min: 4, tier: 'virtual' },
      { min: 2, tier: 'pharmacy' },
      { min: 0, tier: 'otc' },
    ],
  },
  {
    id: 'uti',
    name: 'Urinary tract infection',
    query: 'uti relief',
    keywords: ['uti', 'urinary', 'bladder', 'burning'],
    questions: [
      {
        text: 'Along with urinary symptoms, do you have a fever, back or side pain, or vomiting?',
        options: [
          {
            label: 'Yes, one or more of those',
            weight: 0,
            summary: 'possible kidney involvement (fever / back pain / vomiting)',
            redFlag: true,
          },
          {
            label: 'No, just urinary symptoms',
            weight: 0,
            summary: 'no signs of kidney involvement',
          },
        ],
      },
      {
        text: 'How long have you had symptoms?',
        options: [
          { label: 'They just started today', weight: 2, summary: 'symptoms started today' },
          { label: '1–3 days', weight: 3, summary: 'symptoms for 1–3 days' },
          { label: 'More than 3 days', weight: 4, summary: 'symptoms for more than 3 days' },
        ],
      },
      {
        text: 'Have you had UTIs before?',
        options: [
          {
            label: 'Yes — I recognize these symptoms',
            weight: 1,
            summary: 'recognizes recurrent UTI symptoms',
          },
          { label: 'No, this is my first time', weight: 2, summary: 'first-time symptoms' },
        ],
      },
    ],
    products: [
      {
        emoji: '💊',
        name: 'Urinary pain relief tablets, 30 ct',
        price: '$7.99',
        reviews: '17,580',
      },
      { emoji: '🧪', name: 'At-home UTI test strips, 25 ct', price: '$10.99', reviews: '9,442' },
      { emoji: '🫐', name: 'Cranberry supplement, 60 ct', price: '$13.99', reviews: '31,068' },
    ],
    bands: [
      { min: 6, tier: 'primary' },
      { min: 3, tier: 'virtual' },
      { min: 0, tier: 'otc' },
    ],
  },
  {
    id: 'migraine',
    name: 'Migraine',
    query: 'migraine relief',
    keywords: ['migraine', 'headache', 'head pain'],
    questions: [
      {
        text: 'Did this headache come on suddenly and severely — the worst headache of your life?',
        options: [
          {
            label: 'Yes, like nothing before',
            weight: 0,
            summary: "sudden, severe 'thunderclap' headache",
            redFlag: true,
          },
          {
            label: 'No, it feels like my usual migraines',
            weight: 0,
            summary: 'typical migraine pattern',
          },
        ],
      },
      {
        text: 'How often do you get migraines?',
        options: [
          { label: 'A few times a year', weight: 0, summary: 'infrequent migraines' },
          { label: 'A few times a month', weight: 2, summary: 'several migraines a month' },
          { label: 'Several times a week', weight: 3, summary: 'migraines several times a week' },
        ],
      },
      {
        text: 'Does your current treatment control the pain?',
        options: [
          {
            label: 'I manage with over-the-counter pain relievers',
            weight: 0,
            summary: 'manages with OTC relief',
          },
          {
            label: 'Yes — I just need a refill',
            weight: 2,
            summary: 'treatment works — needs a refill',
          },
          {
            label: 'Somewhat, but not always',
            weight: 3,
            summary: 'treatment only partly effective',
          },
          { label: 'No, nothing seems to help', weight: 4, summary: 'treatment not working' },
        ],
      },
    ],
    products: [
      { emoji: '💊', name: 'Migraine relief caplets, 100 ct', price: '$9.99', reviews: '52,116' },
      { emoji: '🧊', name: 'Cooling gel head wrap', price: '$12.99', reviews: '14,733' },
      { emoji: '🕶️', name: 'Light-filtering glasses', price: '$24.99', reviews: '6,029' },
    ],
    bands: [
      { min: 6, tier: 'primary' },
      { min: 4, tier: 'virtual' },
      { min: 2, tier: 'pharmacy' },
      { min: 0, tier: 'otc' },
    ],
  },
  {
    id: 'backpain',
    name: 'Back pain',
    query: 'back pain relief',
    keywords: ['back pain', 'backache', 'back ache', 'lower back', 'sciatica'],
    questions: [
      {
        text: 'Do you have numbness in your legs, or any new loss of bladder or bowel control?',
        options: [
          {
            label: 'Yes',
            weight: 0,
            summary: 'leg numbness or loss of bladder/bowel control',
            redFlag: true,
          },
          { label: 'No', weight: 0, summary: 'no nerve-related red flags' },
        ],
      },
      {
        text: 'Did the pain start after an injury, fall, or accident?',
        options: [
          { label: 'No — it came on gradually', weight: 0, summary: 'gradual onset, no injury' },
          {
            label: 'Yes, a minor strain (lifting, exercise)',
            weight: 1,
            summary: 'minor strain',
          },
          { label: 'Yes — a fall or accident', weight: 3, summary: 'pain following a fall or accident' },
        ],
      },
      {
        text: 'How long has it been bothering you?',
        options: [
          { label: 'A few days', weight: 0, summary: 'pain for a few days' },
          { label: 'A few weeks', weight: 2, summary: 'pain for a few weeks' },
          { label: 'More than a month', weight: 3, summary: 'pain for over a month' },
        ],
      },
    ],
    products: [
      { emoji: '🔥', name: 'Heat wraps, 6 ct', price: '$9.49', reviews: '28,651' },
      { emoji: '💊', name: 'Ibuprofen 200 mg, 100 ct', price: '$8.99', reviews: '96,210' },
      { emoji: '🩹', name: 'Lidocaine patches, 15 ct', price: '$11.99', reviews: '19,874' },
    ],
    bands: [
      { min: 5, tier: 'primary' },
      { min: 3, tier: 'virtual' },
      { min: 0, tier: 'otc' },
    ],
  },
]
