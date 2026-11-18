/**
 * Sample Screen Detail for the wireframe.
 * Mirrors the existing product Screen Detail layout, plus doc-driven
 * location opening hours (03) and operating uptime vs those hours (05).
 */

import { COMPANY_UPTIME_SCREENS, formatDurationMinutes } from './earnings'

export { formatDurationMinutes }

const BY_UPTIME_ID = Object.fromEntries(
  COMPANY_UPTIME_SCREENS.map((s) => [s.id, s]),
)

const OPENING_HOURS_DEFAULT = [
  { day: 'Mon', open: '08:00', close: '22:00', closed: false },
  { day: 'Tue', open: '08:00', close: '22:00', closed: false },
  { day: 'Wed', open: '08:00', close: '22:00', closed: false },
  { day: 'Thu', open: '08:00', close: '22:00', closed: false },
  { day: 'Fri', open: '08:00', close: '22:00', closed: false },
  { day: 'Sat', open: '08:00', close: '22:00', closed: false },
  { day: 'Sun', open: '10:00', close: '20:00', closed: false },
]

/**
 * Build a detail sample from a company uptime list row (or default lobby).
 */
export function getScreenDetailSample(uptimeRowOrId) {
  const uptime =
    typeof uptimeRowOrId === 'string'
      ? BY_UPTIME_ID[uptimeRowOrId]
      : uptimeRowOrId
  const base = uptime || COMPANY_UPTIME_SCREENS[0]

  const statusNow = base.statusNow || 'online'
  const isOffline = statusNow === 'offline'

  return {
    id: base.id,
    screenId: base.screenId,
    screenName: base.screenName,
    company: 'Inspire Media',
    location: base.location,
    locationAddress: `${base.location} · Kuwait`,
    timezone: base.timezone || 'Asia/Kuwait',
    orientation: 'Landscape',
    screenType: 'ad-supported',
    hasSchedule: true,
    platform: 'Android',
    statusNow,
    statusBlurb: isOffline
      ? "The screen hasn't checked in recently or is disconnected."
      : statusNow === 'wifi'
        ? 'Online via WiFi · last heartbeat looks healthy.'
        : 'Online · checking in normally.',
    deviceId: 'a7f3c2e1-9b44-4d8a-8c21-0e6f91ab44d2',
    pairingCode: 'None (paired)',
    createdAt: '8 Sep 2026',
    updatedAt: '11 Nov 2026',
    lastPing: isOffline ? '1d ago' : '2 min ago',
    sessionUptime: isOffline ? '—' : '4d 3h',
    display: {
      resolution: '1920 × 1080px',
      viewport: '1920 × 1080',
      reportedOrientation: 'Landscape',
      pixelRatio: '1',
      colorDepth: '24',
    },
    frontendVersion: '1.65.0',
    installSource: 'Direct',
    permissions: [
      { name: 'Device Owner', status: 'Granted' },
      { name: 'Install unknown apps', status: 'Granted' },
      { name: 'Kiosk lock', status: 'Granted' },
      { name: 'Home app', status: 'Granted' },
      { name: 'Display over apps', status: 'Not granted' },
    ],
    platformLanguage: 'android-tv · en-US',
    userAgent: 'Xiaomi / MiTV-AFMU0 · Android 14',
    rotation: '0° (No rotation)',
    playbackSafeMode: false,
    /** Location Advertising Info — opening hours (doc 03). */
    openingHoursSet: base.workingHours !== 'Not set',
    openingHours:
      base.workingHours === 'Not set'
        ? OPENING_HOURS_DEFAULT.map((h) => ({ ...h, closed: true, open: '', close: '' }))
        : OPENING_HOURS_DEFAULT,
    openingHoursSummary: base.workingHours || '08:00–22:00',
    /** Operating uptime vs opening hours (doc 05). */
    uptime: {
      periodFrom: '2026-10-01',
      periodTo: '2026-10-31',
      periodLabel: base.periodLabel || '1–31 Oct 2026',
      expectedMinutes: base.expectedMinutes,
      onlineMinutes: base.onlineMinutes,
      offlineMinutes: base.offlineMinutes,
      unknownMinutes: base.unknownMinutes,
      onlinePct: base.onlinePct,
      telemetry: base.telemetry,
      offlineDuringAds: base.offlineDuringAds,
      adsScheduled: base.adsScheduled,
      daily: base.daily || [],
    },
  }
}
