import { useEffect, useId, useState } from 'react'
import { describePageContext } from '../data/pageContext'
import {
  createReportedQuestion,
  loadLastReporter,
} from '../data/reportedQuestions'
import './ReportQuestionFab.css'

export default function ReportQuestionFab({
  pageContext,
  onSubmitted,
  hidden = false,
}) {
  const formId = useId()
  const [open, setOpen] = useState(false)
  const [reporter, setReporter] = useState('')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [error, setError] = useState('')

  const described = describePageContext(pageContext)

  useEffect(() => {
    if (!open) return
    setReporter(loadLastReporter())
    setTitle('')
    setBody('')
    setError('')
  }, [open])

  useEffect(() => {
    if (!open) return
    function onKey(e) {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  if (hidden) return null

  async function submit(e) {
    e.preventDefault()
    const nextReporter = reporter.trim()
    const nextTitle = title.trim()
    // Preserve Enter / blank lines inside the note; only trim ends.
    const nextBody = body.replace(/^\s+|\s+$/g, '')
    if (!nextReporter || !nextTitle || !nextBody) {
      setError('Reporter, title, and question are required.')
      return
    }

    setError('')
    const result = await createReportedQuestion({
      reporter: nextReporter,
      title: nextTitle,
      body: nextBody,
      pageLabel: described.label,
      link: described.link,
    })

    if (!result.ok) {
      setError(result.error || 'Could not save the question.')
      return
    }

    setOpen(false)
    onSubmitted?.(result.item, result.list)
  }

  return (
    <>
      <button
        type="button"
        className="rqf-fab"
        aria-label="Report a question"
        title="Report a question from this page"
        onClick={() => setOpen(true)}
      >
        <span className="rqf-fab-icon" aria-hidden>
          ?
        </span>
        <span className="rqf-fab-label">Ask</span>
      </button>

      {open ? (
        <div className="rqf-layer" role="presentation">
          <button
            type="button"
            className="rqf-backdrop"
            aria-label="Close"
            onClick={() => setOpen(false)}
          />
          <div
            className="rqf-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby={`${formId}-title`}
          >
            <header className="rqf-head">
              <div>
                <p className="rqf-kicker">Report from UI</p>
                <h2 id={`${formId}-title`}>Ask a question</h2>
              </div>
              <button
                type="button"
                className="rqf-close"
                aria-label="Close"
                onClick={() => setOpen(false)}
              >
                ×
              </button>
            </header>

            <p className="rqf-context">
              <span className="rqf-context-label">Current page</span>
              <span className="rqf-context-value">{described.label}</span>
            </p>

            <form className="rqf-form" onSubmit={submit}>
              <label className="rqf-field">
                <span>Your name (reporter)</span>
                <input
                  value={reporter}
                  onChange={(e) => setReporter(e.target.value)}
                  placeholder="e.g. Aziz"
                  autoFocus
                />
              </label>
              <label className="rqf-field">
                <span>Title</span>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Short title for the question"
                />
              </label>
              <label className="rqf-field">
                <span>Question / notes</span>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Write the question or clarification needed… (Enter keeps new lines)"
                  rows={8}
                />
              </label>

              {error ? <p className="rqf-error">{error}</p> : null}

              <div className="rqf-actions">
                <button
                  type="button"
                  className="rqf-btn ghost"
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="rqf-btn primary">
                  Submit to Questions
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  )
}
