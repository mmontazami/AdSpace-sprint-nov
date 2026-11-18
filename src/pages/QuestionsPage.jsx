import { useEffect, useId, useMemo, useRef, useState } from 'react'
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

function formatWhen(iso) {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    })
  } catch {
    return iso
  }
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

function ReportedCard({
  question,
  open,
  onToggle,
  onOpenLinkedPage,
  onRequestDelete,
  cardRef,
}) {
  return (
    <article
      ref={cardRef}
      id={`question-${question.id}`}
      className={`q-card is-status-open ${open ? 'is-open' : ''}`}
      style={{ '--q-accent': '#c4a5ff' }}
    >
      <div className="q-card-row">
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
              <span className="q-chip open">Reported</span>
              <span className="q-linked-tag">{question.reporter}</span>
            </span>
            <span className="q-card-title">{question.title}</span>
            {!open ? (
              <span className="q-card-summary">
                From {question.pageLabel}
                {question.createdAt
                  ? ` · ${formatWhen(question.createdAt)}`
                  : ''}
              </span>
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
        <button
          type="button"
          className="q-delete-btn"
          title="Delete reported question"
          onClick={(e) => {
            e.stopPropagation()
            onRequestDelete?.(question)
          }}
        >
          Delete
        </button>
      </div>

      {open ? (
        <div className="q-card-panel">
          {question.link ? (
            <button
              type="button"
              className="q-page-link"
              onClick={() => onOpenLinkedPage?.(question.link, question.id)}
            >
              <span className="q-page-link-kicker">Reported from</span>
              <span className="q-page-link-label">
                {question.link.label || question.pageLabel}
              </span>
              <span className="q-page-link-arrow" aria-hidden>
                →
              </span>
            </button>
          ) : (
            <p className="q-source">
              <span className="q-source-label">Reported from</span>
              {question.pageLabel}
            </p>
          )}
          <p className="q-source">
            <span className="q-source-label">Reporter</span>
            {question.reporter}
            {question.createdAt ? ` · ${formatWhen(question.createdAt)}` : ''}
          </p>
          <div className="q-body">
            <p className="q-body-p q-body-pre">{question.body}</p>
          </div>
        </div>
      ) : null}
    </article>
  )
}

function DeleteReportedModal({ question, onClose, onConfirm }) {
  const titleId = useId()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose?.()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  async function submit(e) {
    e.preventDefault()
    const result = await onConfirm?.(question.id, password)
    if (result && result.ok === false) {
      setError(result.error || 'Could not delete.')
      return
    }
    onClose?.()
  }

  if (!question) return null

  return (
    <div className="q-delete-layer" role="presentation">
      <button
        type="button"
        className="q-delete-backdrop"
        aria-label="Close"
        onClick={onClose}
      />
      <div
        className="q-delete-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <h2 id={titleId}>Delete {question.id}?</h2>
        <p className="q-delete-copy">
          Enter the password to permanently remove “{question.title}”.
        </p>
        <form className="q-delete-form" onSubmit={submit}>
          <label className="q-delete-field">
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                setError('')
              }}
              autoFocus
              placeholder="Required to delete"
            />
          </label>
          {error ? <p className="q-delete-error">{error}</p> : null}
          <div className="q-delete-actions">
            <button type="button" className="q-delete-btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="q-delete-btn-danger">
              Delete
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function QuestionsPage({
  activeTab = 'client',
  onTabChange,
  focusQuestionId = null,
  onFocusConsumed,
  onOpenLinkedPage,
  reportedQuestions = [],
  onDeleteReported,
}) {
  const [openId, setOpenId] = useState(focusQuestionId)
  const [filterSection, setFilterSection] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [pendingDelete, setPendingDelete] = useState(null)
  const cardRefs = useRef({})

  useEffect(() => {
    if (!focusQuestionId) return

    const isReported = String(focusQuestionId).startsWith('R')
    if (isReported) {
      onTabChange?.('reported')
      setOpenId(focusQuestionId)
      window.requestAnimationFrame(() => {
        cardRefs.current[focusQuestionId]?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        })
      })
      onFocusConsumed?.()
      return
    }

    const q = VISIBLE_CLIENT_QUESTIONS.find((item) => item.id === focusQuestionId)
    if (!q) {
      onFocusConsumed?.()
      return
    }
    onTabChange?.('client')
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
  }, [focusQuestionId, onFocusConsumed, onTabChange])

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
  const reportedCount = reportedQuestions.length

  function toggle(id) {
    setOpenId((prev) => (prev === id ? null : id))
  }

  async function handleConfirmDelete(id, password) {
    const result = await onDeleteReported?.(id, password)
    if (result?.ok) {
      setOpenId((prev) => (prev === id ? null : prev))
    }
    return result
  }

  return (
    <div className="q-page">
      <header className="q-hero">
        <div className="q-hero-glow" aria-hidden />
        <div className="q-hero-copy">
          <p className="q-eyebrow">Delivery review</p>
          <h1>Client questions</h1>
          <p className="q-hero-sub">
            Open decisions for the Ad Space delivery. Use the Ask button on any
            wireframe page to capture a new question — it lands in Reported with
            a link back to that page or tab.
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
          <div className="q-stat q-stat-reported">
            <span className="q-stat-value">{reportedCount}</span>
            <span className="q-stat-label">Reported</span>
          </div>
        </div>
      </header>

      <div className="q-mode-tabs" role="tablist" aria-label="Question source">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'client'}
          className={`q-mode-tab ${activeTab === 'client' ? 'active' : ''}`}
          onClick={() => onTabChange?.('client')}
        >
          Client questions
          <span className="q-filter-count">{total}</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'reported'}
          className={`q-mode-tab reported ${activeTab === 'reported' ? 'active' : ''}`}
          onClick={() => onTabChange?.('reported')}
        >
          Reported from UI
          <span className="q-filter-count">{reportedCount}</span>
        </button>
      </div>

      {activeTab === 'client' ? (
        <>
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
        </>
      ) : (
        <div className="q-sections">
          <section className="q-section">
            <div className="q-section-head">
              <span
                className="q-section-badge"
                style={{ '--q-accent': '#c4a5ff' }}
              >
                UI
              </span>
              <h2>Reported from wireframes</h2>
              <span className="q-section-count">
                {reportedCount} question{reportedCount === 1 ? '' : 's'}
              </span>
            </div>

            {reportedCount === 0 ? (
              <p className="q-empty">
                No reported questions yet. Use the Ask button on any page to
                capture one — the page (and tab/step) is saved with it.
              </p>
            ) : (
              <div className="q-list">
                {reportedQuestions.map((question) => (
                  <ReportedCard
                    key={question.id}
                    question={question}
                    open={openId === question.id}
                    onToggle={() => toggle(question.id)}
                    onOpenLinkedPage={onOpenLinkedPage}
                    onRequestDelete={(q) => setPendingDelete(q)}
                    cardRef={(el) => {
                      cardRefs.current[question.id] = el
                    }}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {pendingDelete ? (
        <DeleteReportedModal
          question={pendingDelete}
          onClose={() => setPendingDelete(null)}
          onConfirm={handleConfirmDelete}
        />
      ) : null}
    </div>
  )
}
