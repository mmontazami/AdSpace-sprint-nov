import { useMemo, useState } from 'react'
import RelatedQuestionChip from '../../components/RelatedQuestionChip'
import { ANY_ASPECT_RATIO } from '../../data/aspectRatios'
import {
  anyContentKey,
  cloneContentPackage,
  contentLibraryForCreative,
  countFilledSlots,
  createContentStub,
  hasContentPackage,
  labelForContentKey,
  normalizePackageLoops,
} from '../../data/creativeContent'
import SlotMediaEditor, { SlotPlaybackPreview } from './SlotMediaEditor'

/**
 * Content step inside create/edit creative.
 * Format (orientation / resolution) is already chosen — media goes straight
 * onto the matching ANY orientation package.
 * “Copy from other creatives” is an action that lists same-format packages only.
 */
export default function CreativeContentStep({
  creative,
  creatives = [],
  campaign,
  contentByKey = {},
  onChangeContent,
  focusContentQuestion = false,
  onOpenQuestion,
}) {
  const slotCount = Math.max(1, Number(campaign?.slots) || 6)
  const formatKey = creative?.orientation
    ? anyContentKey(creative.orientation)
    : null

  const [subPhase, setSubPhase] = useState('edit') // edit | copyBrowse
  const [confirmOverwrite, setConfirmOverwrite] = useState(null)
  const [activePreviewId, setActivePreviewId] = useState(null)

  const library = useMemo(
    () => contentLibraryForCreative(creatives, creative),
    [creatives, creative],
  )

  const editingPackage = formatKey ? contentByKey[formatKey] || null : null

  const formatSummary =
    creative.orientation === 'Square'
      ? 'Square · 1:1'
      : creative.orientation
        ? `${creative.orientation} · ${
            creative.targetAspectRatio === ANY_ASPECT_RATIO ||
            !creative.targetAspectRatio
              ? 'Any resolution'
              : creative.targetAspectRatio
          }`
        : 'Format not set'

  function writePackage(key, pack) {
    onChangeContent({
      ...contentByKey,
      [key]: pack,
    })
  }

  function handleLoopsChange(loops) {
    if (!formatKey) return
    const pack = createContentStub({
      key: formatKey,
      creativeName: creative.name,
      slotCount,
      loops,
    })
    if (editingPackage?.id) pack.id = editingPackage.id
    pack.assetCount = countFilledSlots(loops)
    writePackage(formatKey, pack)
  }

  function requestCopy(item) {
    if (!formatKey) return
    const nextPack = cloneContentPackage(item.package, {
      key: formatKey,
      creativeName: creative.name,
      slotCount,
    })
    nextPack.sourceCreativeId = item.creativeId
    nextPack.sourceKey = item.key
    nextPack.note = `Copied from ${item.creativeName} (${item.label})`

    if (hasContentPackage(contentByKey, formatKey)) {
      setConfirmOverwrite({
        pack: nextPack,
        fromLabel: `${item.creativeName} · ${item.label}`,
        existingTitle: contentByKey[formatKey]?.title || formatKey,
      })
      return
    }

    applyCopy(nextPack)
  }

  function applyCopy(pack) {
    if (!formatKey) return
    writePackage(formatKey, pack)
    setConfirmOverwrite(null)
    setActivePreviewId(null)
    setSubPhase('edit')
  }

  if (!formatKey) {
    return (
      <div className="creatives-empty">
        <h3>Format required</h3>
        <p>Set orientation in the Format step before adding media.</p>
      </div>
    )
  }

  return (
    <div
      className={`creative-content-step ${
        subPhase === 'edit' ? 'is-editor' : ''
      }`}
    >
      {subPhase === 'edit' && (
        <>
          <section
            className={`content-section content-format-banner has-question ${
              focusContentQuestion ? 'is-question-focus' : ''
            }`}
          >
            <div className="content-section-head content-format-head">
              <div>
                <h3>Media · {labelForContentKey(formatKey)}</h3>
                <p>
                  Format is already set ({formatSummary}). Drop media into
                  slots for this creative.
                </p>
                <RelatedQuestionChip
                  questionId="Q04.9"
                  title="Multi-resolution variants under one media asset"
                  onOpen={() => onOpenQuestion?.('Q04.9')}
                />
              </div>
              <button
                type="button"
                className="btn-ghost compact content-copy-action"
                onClick={() => {
                  setActivePreviewId(null)
                  setSubPhase('copyBrowse')
                }}
              >
                Copy from other creatives
              </button>
            </div>
          </section>

          <SlotMediaEditor
            key={`${creative.id}_${formatKey}`}
            packageKey={formatKey}
            packageLabel={labelForContentKey(formatKey)}
            initialPackage={editingPackage}
            slotCount={slotCount}
            creativeName={creative.name || 'Creative'}
            onChange={handleLoopsChange}
          />
        </>
      )}

      {subPhase === 'copyBrowse' && (
        <section className="content-section content-copy-browse">
          <div className="content-section-head content-copy-browse-head">
            <div>
              <h3>Copy from other creatives</h3>
              <p>
                Media from other creatives in this campaign with the same
                format ({formatSummary}). Play a preview, then use it.
              </p>
            </div>
            <button
              type="button"
              className="btn-ghost compact"
              onClick={() => {
                setActivePreviewId(null)
                setSubPhase('edit')
              }}
            >
              Back to editor
            </button>
          </div>

          {library.length === 0 ? (
            <div className="content-copy-empty">
              <h4>No matching media</h4>
              <p>
                No other creatives in this campaign share {formatSummary}.
                Change Format, or add content on another matching creative
                first.
              </p>
            </div>
          ) : (
            <ul className="content-library-list">
              {library.map((item) => {
                const loops = normalizePackageLoops(item.package, slotCount)
                const filled =
                  item.package.assetCount ?? countFilledSlots(loops)
                return (
                  <li key={item.id} className="content-copy-card">
                    <div className="content-copy-card-top">
                      <div className="content-library-main">
                        <span
                          className={`content-lib-pill ${
                            item.isAny ? 'any' : ''
                          }`}
                        >
                          {item.label}
                        </span>
                        <div>
                          <strong>{item.package.title}</strong>
                          <span>
                            {item.creativeName}
                            {item.isExample ? ' · example' : ''}
                            {filled > 0
                              ? ` · ${filled} filled slot${
                                  filled === 1 ? '' : 's'
                                }`
                              : ''}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="btn-primary compact"
                        onClick={() => requestCopy(item)}
                      >
                        Use this
                      </button>
                    </div>

                    <div className="content-copy-card-preview">
                      <SlotPlaybackPreview
                        loops={loops}
                        slotCount={slotCount}
                        packageLabel={item.label}
                        compact
                        forcePaused={
                          activePreviewId != null &&
                          activePreviewId !== item.id
                        }
                        onPlayingChange={(playing) => {
                          if (playing) setActivePreviewId(item.id)
                          else if (activePreviewId === item.id) {
                            setActivePreviewId(null)
                          }
                        }}
                      />
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      )}

      {confirmOverwrite && (
        <div
          className="content-confirm-backdrop"
          role="presentation"
          onClick={() => setConfirmOverwrite(null)}
        >
          <div
            className="content-confirm-sheet"
            role="alertdialog"
            aria-labelledby="content-overwrite-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="content-overwrite-title">Replace existing content?</h3>
            <p>
              <strong>{labelForContentKey(formatKey)}</strong> already has “
              {confirmOverwrite.existingTitle}”. Copying from{' '}
              {confirmOverwrite.fromLabel} will replace it.
            </p>
            <div className="content-confirm-actions">
              <button
                type="button"
                className="btn-ghost"
                onClick={() => setConfirmOverwrite(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={() => applyCopy(confirmOverwrite.pack)}
              >
                Replace
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
