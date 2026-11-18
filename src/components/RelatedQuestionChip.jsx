import { CLIENT_QUESTIONS } from '../data/clientQuestions'
import './RelatedQuestionChip.css'

/**
 * Inline marker on a UI surface that has a client question.
 * Click → jump to Client questions with that item expanded.
 * Resolved questions show a distinct “Resolved” state.
 */
export default function RelatedQuestionChip({
  questionId,
  title,
  onOpen,
}) {
  if (!questionId || !onOpen) return null

  const question = CLIENT_QUESTIONS.find((q) => q.id === questionId)
  const resolved = question?.status === 'resolved'
  const displayTitle = title || question?.title

  return (
    <button
      type="button"
      className={`rq-chip ${resolved ? 'is-resolved' : ''}`}
      onClick={onOpen}
      title={
        displayTitle
          ? `${resolved ? 'Resolved' : 'Open'} ${questionId}: ${displayTitle}`
          : `${resolved ? 'Resolved' : 'Open'} ${questionId}`
      }
    >
      <span className="rq-chip-pulse" aria-hidden />
      <span className="rq-chip-id">{questionId}</span>
      <span className="rq-chip-label">
        {resolved ? 'Resolved' : 'Open question'}
      </span>
    </button>
  )
}
