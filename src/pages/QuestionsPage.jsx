import { useEffect, useMemo, useRef, useState } from 'react'
import {
  VISIBLE_CLIENT_QUESTIONS,
  QUESTION_SECTIONS,
} from '../data/clientQuestions'
import './QuestionsPage.css'

function BodyBlock({ block }) {
  if (block.type === 'ul' || block.type === 'ol') {
    const Tag = block.type
    return (
      <Tag className="q-body-list">
        {block.items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </Tag>
    )
  }
  return <p className="q-body-p">{block.text}</p>
}

function isResolved(question) {
  return question.status === 'resolved'
}

function QuestionCard({
  question,
  accent,
  open,
  onToggle,
  onOpenLinkedPage,
  cardRef,
}) {
  const resolved = isResolved(question)

  return (
    <article
      ref={cardRef}
      id={`question-${question.id}`}
      className={`q-card ${open ? 'is-open' : ''} ${resolved ? 'is-resolved' : 'is-status-open'}`}
      style={{ '--q-accent': accent }}
    >
      <button
        type="button"
        className="q-card-trigger"
        aria-expanded={open}
        onClick={onToggle}
      >
        <span className="q-card-rail" aria-hidden />
        <span className="q-card-main">
          <span className="q-card-meta">
            <span className="q-id">{question.id}</span>
            <span className={`q-chip ${resolved ? 'resolved' : 'open'}`}>
              {resolved ? 'Resolved' : 'Open'}
            </span>
            {question.link ? (
              <span className="q-linked-tag">Linked UI</span>
            ) : null}
          </span>
          <span className="q-card-title">{question.title}</span>
          {!open ? (
            <span className="q-card-summary">{question.summary}</span>
          ) : null}
        </span>
        <span className={`q-chevron ${open ? 'up' : ''}`} aria-hidden>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path
              d="M4.5 6.75L9 11.25L13.5 6.75"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </button>

      {open ? (
        <div className="q-card-panel">
          {question.link ? (
            <button
              type="button"
              className="q-page-link"
              onClick={() => onOpenLinkedPage?.(question.link, question.id)}
            >
              <span className="q-page-link-kicker">Related UI</span>
              <span className="q-page-link-label">{question.link.label}</span>
              <span className="q-page-link-arrow" aria-hidden>
                →
              </span>
            </button>
          ) : null}
          <p className="q-source">
            <span className="q-source-label">Source</span>
            {question.source}
          </p>
          {resolved && question.decision?.length ? (
            <div className="q-decision">
              <p className="q-decision-label">Decision</p>
              <div className="q-body">
                {question.decision.map((block, i) => (
                  <BodyBlock key={`${question.id}-decision-${i}`} block={block} />
                ))}
              </div>
            </div>
          ) : null}
          <div className="q-body">
            {question.body.map((block, i) => (
              <BodyBlock key={`${question.id}-${i}`} block={block} />
            ))}
          </div>
        </div>
      ) : null}
    </article>
  )
}

export default function QuestionsPage({
  focusQuestionId = null,
  onFocusConsumed,
  onOpenLinkedPage,
}) {
  const [openId, setOpenId] = useState(focusQuestionId)
  const [filterSection, setFilterSection] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const cardRefs = useRef({})

  useEffect(() => {
    if (!focusQuestionId) return
    const q = VISIBLE_CLIENT_QUESTIONS.find((item) => item.id === focusQuestionId)
    if (!q) {
      onFocusConsumed?.()
      return
    }
    setFilterSection(q.sectionId)
    setFilterStatus(isResolved(q) ? 'resolved' : 'open')
    setOpenId(focusQuestionId)
    window.requestAnimationFrame(() => {
      cardRefs.current[focusQuestionId]?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      })
    })
    onFocusConsumed?.()
  }, [focusQuestionId, onFocusConsumed])

  const statusScoped = useMemo(() => {
    return VISIBLE_CLIENT_QUESTIONS.filter((q) => {
      if (filterStatus === 'open') return !isResolved(q)
      if (filterStatus === 'resolved') return isResolved(q)
      return true
    })
  }, [filterStatus])

  const grouped = useMemo(() => {
    const sections = QUESTION_SECTIONS.map((section) => ({
      ...section,
      questions: statusScoped.filter((q) => q.sectionId === section.id),
    })).filter((s) => s.questions.length > 0)
    if (filterSection === 'all') return sections
    return sections.filter((s) => s.id === filterSection)
  }, [filterSection, statusScoped])

  const total = VISIBLE_CLIENT_QUESTIONS.length
  const openCount = VISIBLE_CLIENT_QUESTIONS.filter((q) => !isResolved(q)).length
  const resolvedCount = total - openCount
  const visibleCount = grouped.reduce((sum, s) => sum + s.questions.length, 0)

  function toggle(id) {
    setOpenId((prev) => (prev === id ? null : id))
  }

  return (
    <div className="q-page">
      <header className="q-hero">
        <div className="q-hero-glow" aria-hidden />
        <div className="q-hero-copy">
          <p className="q-eyebrow">Delivery review</p>
          <h1>Client questions</h1>
          <p className="q-hero-sub">
            Open decisions for the Ad Space delivery. Expand a question to read
            the full context, options, and follow-ups. Linked questions jump to
            the related wireframe screen.
          </p>
        </div>
        <div className="q-hero-stats" aria-label="Question counts">
          <div className="q-stat q-stat-open">
            <span className="q-stat-value">{openCount}</span>
            <span className="q-stat-label">Open</span>
          </div>
          <div className="q-stat q-stat-resolved">
            <span className="q-stat-value">{resolvedCount}</span>
            <span className="q-stat-label">Resolved</span>
          </div>
          <div className="q-stat">
            <span className="q-stat-value">{QUESTION_SECTIONS.length}</span>
            <span className="q-stat-label">Areas</span>
          </div>
        </div>
      </header>

      <div className="q-filter-bars">
        <div className="q-filters" role="tablist" aria-label="Filter by status">
          <button
            type="button"
            role="tab"
            aria-selected={filterStatus === 'all'}
            className={`q-filter ${filterStatus === 'all' ? 'active' : ''}`}
            onClick={() => setFilterStatus('all')}
          >
            All statuses
            <span className="q-filter-count">{total}</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={filterStatus === 'open'}
            className={`q-filter status-open ${filterStatus === 'open' ? 'active' : ''}`}
            onClick={() => setFilterStatus('open')}
          >
            Open
            <span className="q-filter-count">{openCount}</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={filterStatus === 'resolved'}
            className={`q-filter status-resolved ${filterStatus === 'resolved' ? 'active' : ''}`}
            onClick={() => setFilterStatus('resolved')}
          >
            Resolved
            <span className="q-filter-count">{resolvedCount}</span>
          </button>
        </div>

        <div className="q-filters" role="tablist" aria-label="Filter by area">
          <button
            type="button"
            role="tab"
            aria-selected={filterSection === 'all'}
            className={`q-filter ${filterSection === 'all' ? 'active' : ''}`}
            onClick={() => setFilterSection('all')}
          >
            All areas
            <span className="q-filter-count">{statusScoped.length}</span>
          </button>
          {QUESTION_SECTIONS.map((section) => {
            const count = statusScoped.filter(
              (q) => q.sectionId === section.id,
            ).length
            if (count === 0) return null
            return (
              <button
                key={section.id}
                type="button"
                role="tab"
                aria-selected={filterSection === section.id}
                className={`q-filter ${filterSection === section.id ? 'active' : ''}`}
                style={{ '--q-accent': section.accent }}
                onClick={() => setFilterSection(section.id)}
              >
                <span className="q-filter-dot" aria-hidden />
                {section.code}
                <span className="q-filter-count">{count}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="q-sections">
        {visibleCount === 0 ? (
          <p className="q-empty">No questions match these filters.</p>
        ) : null}
        {grouped.map((section) => (
          <section key={section.id} className="q-section">
            <div className="q-section-head">
              <span
                className="q-section-badge"
                style={{ '--q-accent': section.accent }}
              >
                {section.code}
              </span>
              <h2>{section.title}</h2>
              <span className="q-section-count">
                {section.questions.length} question
                {section.questions.length === 1 ? '' : 's'}
              </span>
            </div>

            <div className="q-list">
              {section.questions.map((question) => (
                <QuestionCard
                  key={question.id}
                  question={question}
                  accent={section.accent}
                  open={openId === question.id}
                  onToggle={() => toggle(question.id)}
                  onOpenLinkedPage={onOpenLinkedPage}
                  cardRef={(el) => {
                    cardRefs.current[question.id] = el
                  }}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
