import { useCallback, useEffect, useState } from 'react'
import CampaignsPage from './pages/CampaignsPage'
import CampaignBuilder from './pages/builder/CampaignBuilder'
import CampaignDetailPage from './pages/CampaignDetailPage'
import AdvertisersPage from './pages/AdvertisersPage'
import AdvertiserDetailPage from './pages/AdvertiserDetailPage'
import ScreensPage from './pages/ScreensPage'
import EarningsPage from './pages/EarningsPage'
import ScreenUptimePage from './pages/ScreenUptimePage'
import ScreenDetailPage from './pages/ScreenDetailPage'
import QuestionsPage from './pages/QuestionsPage'
import ReportQuestionFab from './components/ReportQuestionFab'
import {
  ADVERTISERS,
  createAdvertiser,
  normalizeAdvertiserList,
} from './data/advertisers'
import {
  deleteReportedQuestion,
  fetchReportedQuestions,
} from './data/reportedQuestions'
import './App.css'

export default function App() {
  const [view, setView] = useState('list')
  /** Uptime list row (or id) for Screen Detail. */
  const [screenDetailRef, setScreenDetailRef] = useState(null)
  /** Selected advertiser for detail. */
  const [advertiserDetail, setAdvertiserDetail] = useState(null)
  /** Shared advertiser directory for list / detail / campaign builder. */
  const [advertisers, setAdvertisers] = useState(() =>
    normalizeAdvertiserList(ADVERTISERS),
  )
  /** Deep-link into Client questions (expand + scroll). */
  const [focusQuestionId, setFocusQuestionId] = useState(null)
  /** Questions page mode: curated client list vs user-reported. */
  const [questionsTab, setQuestionsTab] = useState('client')
  /** Reported questions captured from the floating Ask control. */
  const [reportedQuestions, setReportedQuestions] = useState([])
  /** Live page/tab context for the report FAB. */
  const [pageContext, setPageContext] = useState({ view: 'list' })
  /** Deep-link into Campaign Builder (step + field anchor). */
  const [builderNav, setBuilderNav] = useState({ step: 1, anchor: null })
  /** Deep-link into Campaign Detail (tab + field anchor). */
  const [detailNav, setDetailNav] = useState({
    tab: 'overview',
    anchor: null,
  })

  useEffect(() => {
    if (view === 'builder' || view === 'detail') return
    setPageContext({ view })
  }, [view])

  useEffect(() => {
    let cancelled = false
    fetchReportedQuestions().then((result) => {
      if (cancelled || !result.ok) return
      setReportedQuestions(result.list || [])
    })
    return () => {
      cancelled = true
    }
  }, [])

  const onCampaignsNav =
    view === 'list' || view === 'builder' || view === 'detail'
  const onAdvertisersNav =
    view === 'advertisers' || view === 'advertiser-detail'
  const onScreensNav = view === 'screens'
  const onEarningsNav = view === 'earnings'
  const onUptimeNav = view === 'uptime' || view === 'screen-detail'
  const onQuestionsNav = view === 'questions'

  function openDetailFromList() {
    setDetailNav({ tab: 'overview', anchor: null })
    setView('detail')
  }

  function backFromDetail() {
    setView('list')
  }

  function openScreenDetail(row) {
    setScreenDetailRef(row)
    setView('screen-detail')
  }

  function backFromScreenDetail() {
    setView('uptime')
  }

  function openBuilderFresh() {
    setBuilderNav({ step: 1, anchor: null })
    setView('builder')
  }

  function openAdvertiser(advertiser) {
    setAdvertiserDetail(advertiser)
    setView('advertiser-detail')
  }

  function backFromAdvertiserDetail() {
    setView('advertisers')
  }

  function upsertAdvertiser(next) {
    setAdvertisers((prev) => {
      const list = normalizeAdvertiserList(prev)
      const idx = list.findIndex((a) => a.id === next.id)
      if (idx >= 0) {
        const copy = [...list]
        copy[idx] = next
        return copy
      }
      const byName = list.findIndex(
        (a) => a.name.toLowerCase() === next.name.toLowerCase(),
      )
      if (byName >= 0) {
        const copy = [...list]
        copy[byName] = { ...copy[byName], ...next, id: copy[byName].id }
        return copy
      }
      return [...list, createAdvertiser(next.name, next)]
    })
    setAdvertiserDetail(next)
  }

  const openQuestion = useCallback((questionId) => {
    setQuestionsTab('client')
    setFocusQuestionId(questionId)
    setView('questions')
  }, [])

  const openReportedQuestion = useCallback((questionId) => {
    setQuestionsTab('reported')
    setFocusQuestionId(questionId)
    setView('questions')
  }, [])

  const openLinkedPage = useCallback((link) => {
    if (!link?.view) return
    if (link.view === 'builder') {
      setBuilderNav({
        step: link.step || 1,
        anchor: link.anchor || null,
      })
      setView('builder')
      return
    }
    if (link.view === 'detail') {
      setDetailNav({
        tab: link.tab || 'overview',
        anchor: link.anchor || null,
      })
      setView('detail')
      return
    }
    setView(link.view)
  }, [])

  const handleReportSubmitted = useCallback(
    (item, list) => {
      if (list) setReportedQuestions(list)
      openReportedQuestion(item.id)
    },
    [openReportedQuestion],
  )

  const handleDeleteReported = useCallback(async (id, password) => {
    const result = await deleteReportedQuestion(id, password)
    if (result.ok) setReportedQuestions(result.list || [])
    return result
  }, [])

  const clearQuestionFocus = useCallback(() => {
    setFocusQuestionId(null)
  }, [])

  const clearBuilderFocus = useCallback(() => {
    setBuilderNav((prev) =>
      prev.anchor ? { ...prev, anchor: null } : prev,
    )
  }, [])

  const clearDetailFocus = useCallback(() => {
    setDetailNav((prev) =>
      prev.anchor ? { ...prev, anchor: null } : prev,
    )
  }, [])

  return (
    <div className="app-shell">
      <aside className="app-sidebar" aria-label="Workspace navigation">
        <div className="brand">Ad Space</div>
        <nav>
          <p className="nav-section">Admin</p>
          <button
            type="button"
            className={`nav-item ${onCampaignsNav ? 'active' : ''}`}
            onClick={() => setView('list')}
          >
            Campaigns (Admin)
          </button>
          <button
            type="button"
            className={`nav-item ${onAdvertisersNav ? 'active' : ''}`}
            onClick={() => setView('advertisers')}
          >
            Advertisers (Admin)
          </button>
          {/* Finance (Admin) hidden for now — payables live on campaign detail. */}
          <button
            type="button"
            className={`nav-item ${onScreensNav ? 'active' : ''}`}
            onClick={() => setView('screens')}
          >
            Screens (Admin)
          </button>
          <button type="button" className="nav-item" disabled>
            Ad packs (Admin)
          </button>

          <p className="nav-section">Company</p>
          <button
            type="button"
            className={`nav-item ${onEarningsNav ? 'active' : ''}`}
            onClick={() => setView('earnings')}
          >
            Earnings (Company)
          </button>
          <button
            type="button"
            className={`nav-item ${onUptimeNav ? 'active' : ''}`}
            onClick={() => setView('uptime')}
          >
            Screens (Company)
          </button>

          <p className="nav-section">Delivery</p>
          <button
            type="button"
            className={`nav-item ${onQuestionsNav ? 'active' : ''}`}
            onClick={() => {
              setFocusQuestionId(null)
              setQuestionsTab('client')
              setView('questions')
            }}
          >
            Client questions
          </button>
        </nav>
      </aside>
      <main className="app-main">
        {view === 'builder' ? (
          <CampaignBuilder
            onBack={() => setView('list')}
            initialStep={builderNav.step}
            focusAnchor={builderNav.anchor}
            onFocusConsumed={clearBuilderFocus}
            onOpenQuestion={openQuestion}
            onPageContext={setPageContext}
            advertisers={advertisers}
            onChangeAdvertisers={setAdvertisers}
          />
        ) : view === 'detail' ? (
          <CampaignDetailPage
            onBack={backFromDetail}
            backLabel="← Campaigns"
            initialTab={detailNav.tab}
            focusAnchor={detailNav.anchor}
            onFocusConsumed={clearDetailFocus}
            onOpenQuestion={openQuestion}
            onPageContext={setPageContext}
            advertisers={advertisers}
            onChangeAdvertisers={setAdvertisers}
          />
        ) : view === 'advertisers' ? (
          <AdvertisersPage
            advertisers={advertisers}
            onChangeAdvertisers={setAdvertisers}
            onOpenAdvertiser={openAdvertiser}
          />
        ) : view === 'advertiser-detail' && advertiserDetail ? (
          <AdvertiserDetailPage
            advertiser={advertiserDetail}
            onBack={backFromAdvertiserDetail}
            onChangeAdvertiser={upsertAdvertiser}
            onOpenCampaign={openDetailFromList}
          />
        ) : view === 'screens' ? (
          <ScreensPage />
        ) : view === 'earnings' ? (
          <EarningsPage onOpenUptime={() => setView('uptime')} />
        ) : view === 'uptime' ? (
          <ScreenUptimePage onOpenScreen={openScreenDetail} />
        ) : view === 'screen-detail' ? (
          <ScreenDetailPage
            screenRef={screenDetailRef}
            onBack={backFromScreenDetail}
          />
        ) : view === 'questions' ? (
          <QuestionsPage
            activeTab={questionsTab}
            onTabChange={setQuestionsTab}
            focusQuestionId={focusQuestionId}
            onFocusConsumed={clearQuestionFocus}
            onOpenLinkedPage={openLinkedPage}
            reportedQuestions={reportedQuestions}
            onDeleteReported={handleDeleteReported}
          />
        ) : (
          <CampaignsPage
            onNewCampaign={openBuilderFresh}
            onOpenCampaign={openDetailFromList}
          />
        )}
      </main>
      <ReportQuestionFab
        pageContext={pageContext}
        onSubmitted={handleReportSubmitted}
        hidden={view === 'questions'}
      />
    </div>
  )
}
