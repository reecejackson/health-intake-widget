import { useMemo, useState } from 'react'
import {
  TIERS,
  TOPICS,
  productUrl,
  tierUrl,
  type AnswerOption,
  type Tier,
  type Topic,
} from './triage-data'

type Phase = 'search' | 'intake' | 'result'

interface TriageResult {
  tier: Tier
  summaries: string[]
}

export default function App() {
  const [phase, setPhase] = useState<Phase>('search')
  const [query, setQuery] = useState('')
  const [topic, setTopic] = useState<Topic | null>(null)
  const [picked, setPicked] = useState<AnswerOption[]>([])
  const [result, setResult] = useState<TriageResult | null>(null)

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q || phase !== 'search') return []
    return TOPICS.filter(
      (t) =>
        t.query.startsWith(q) ||
        t.keywords.some((k) => k.startsWith(q) || q.includes(k)),
    )
  }, [query, phase])

  function startIntake(t: Topic) {
    setTopic(t)
    setQuery(t.query)
    setPicked([])
    setResult(null)
    setPhase('intake')
  }

  function submitSearch() {
    if (suggestions.length > 0) startIntake(suggestions[0])
  }

  function answer(option: AnswerOption) {
    if (!topic) return
    if (option.redFlag) {
      setResult({ tier: TIERS.emergency, summaries: [option.summary] })
      setPhase('result')
      return
    }
    const all = [...picked, option]
    if (all.length === topic.questions.length) {
      const score = all.reduce((sum, o) => sum + o.weight, 0)
      const band = topic.bands.find((b) => score >= b.min) ?? topic.bands[topic.bands.length - 1]
      setResult({ tier: TIERS[band.tier], summaries: all.map((o) => o.summary) })
      setPhase('result')
    } else {
      setPicked(all)
    }
  }

  function reset() {
    setPhase('search')
    setQuery('')
    setTopic(null)
    setPicked([])
    setResult(null)
  }

  return (
    <div className="page">
      <header className="site-header">
        <button className="wordmark" onClick={reset}>
          demo<span className="wordmark-accent">store</span>
        </button>
        <div className="search-wrap">
          <input
            className="search-input"
            type="text"
            placeholder="Search demostore"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submitSearch()}
            aria-label="Search"
          />
          <button className="search-btn" onClick={submitSearch} aria-label="Submit search">
            ⌕
          </button>
          {suggestions.length > 0 && (
            <ul className="suggestions">
              {suggestions.map((t) => (
                <li key={t.id}>
                  <button onMouseDown={() => startIntake(t)}>
                    <span className="sug-icon">⌕</span> {t.query}
                    <span className="sug-tag">Health</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="header-right">
          <span>
            Returns
            <br />
            <strong>&amp; Orders</strong>
          </span>
          <span className="cart">🛒 Cart</span>
        </div>
      </header>

      <main className="main">
        {phase === 'search' && (
          <section className="hero">
            <h1>Search for anything — including your health</h1>
            <p>
              When a search looks like a health concern, the care-intake widget meets the
              customer right in the results.
            </p>
            <div className="try-pills">
              <span>Try a search:</span>
              {TOPICS.map((t) => (
                <button key={t.id} onClick={() => startIntake(t)}>
                  {t.query}
                </button>
              ))}
            </div>
          </section>
        )}

        {phase !== 'search' && topic && (
          <div className="results-area">
            <div className="topic-chip">
              <span className="chip-check">✓</span> Health topic detected:{' '}
              <strong>{topic.name}</strong>
            </div>

            <section className="widget" key={topic.id}>
              <div className="widget-head">
                <h2 className="widget-title">Find the right care from Amazon Health</h2>
                <button className="link-btn" onClick={reset}>
                  Start over
                </button>
              </div>

              {phase === 'intake' && (
                <QuestionCard topic={topic} qIndex={picked.length} onAnswer={answer} />
              )}
              {phase === 'result' && result && (
                <ResultCard topic={topic} result={result} />
              )}
            </section>

            <SkeletonResults />
          </div>
        )}
      </main>

      <footer className="disclaimer">
        Concept demo for presentation purposes only. Not medical advice, not a real product,
        and not affiliated with Amazon. If you are experiencing a medical emergency, call 911.
      </footer>
    </div>
  )
}

function QuestionCard({
  topic,
  qIndex,
  onAnswer,
}: {
  topic: Topic
  qIndex: number
  onAnswer: (o: AnswerOption) => void
}) {
  const q = topic.questions[qIndex]
  return (
    <div className="question card-anim" key={qIndex}>
      <div className="progress" aria-label={`Question ${qIndex + 1} of ${topic.questions.length}`}>
        {topic.questions.map((_, i) => (
          <span
            key={i}
            className={'dot' + (i < qIndex ? ' done' : i === qIndex ? ' active' : '')}
          />
        ))}
      </div>
      <h3 className="question-text">{q.text}</h3>
      <div className="options">
        {q.options.map((o) => (
          <button key={o.label} className="option" onClick={() => onAnswer(o)}>
            {o.label}
          </button>
        ))}
      </div>
    </div>
  )
}

function ResultCard({ topic, result }: { topic: Topic; result: TriageResult }) {
  const { tier, summaries } = result
  return (
    <div className="result card-anim" style={{ borderLeftColor: tier.accent }}>
      <div className="result-head">
        <span className="tier-icon">{tier.icon}</span>
        <div>
          <div className="tier-name" style={{ color: tier.accent }}>
            Recommended: {tier.name}
          </div>
          <h3 className="result-headline">{tier.headline}</h3>
        </div>
      </div>
      <p className="rationale">
        <strong>Based on your answers:</strong> {summaries.join(' · ')}
      </p>
      <p className="tier-desc">{tier.description}</p>

      {tier.id === 'otc' ? (
        <div className="products">
          {topic.products.map((p, i) => (
            <a
              className="product"
              key={p.name}
              href={productUrl(p, i, topic)}
              target="_blank"
              rel="noopener noreferrer"
            >
              <div className="product-img">{p.emoji}</div>
              <div className="product-name">{p.name}</div>
              <div className="product-stars">
                ★★★★<span className="star-dim">★</span> <span>{p.reviews}</span>
              </div>
              <div className="product-price">{p.price}</div>
              <span className="cta cta-small">{tier.cta}</span>
            </a>
          ))}
        </div>
      ) : tierUrl(tier.id, topic) ? (
        <a
          className="cta"
          href={tierUrl(tier.id, topic)!}
          target="_blank"
          rel="noopener noreferrer"
        >
          {tier.cta}
        </a>
      ) : (
        <button className="cta">{tier.cta}</button>
      )}
    </div>
  )
}

function SkeletonResults() {
  return (
    <div className="skeletons" aria-hidden="true">
      <div className="skel-label">Product results</div>
      {[0, 1, 2].map((i) => (
        <div className="skel-row" key={i}>
          <div className="skel-img" />
          <div className="skel-lines">
            <div className="skel-line w70" />
            <div className="skel-line w45" />
            <div className="skel-line w30" />
          </div>
        </div>
      ))}
    </div>
  )
}
