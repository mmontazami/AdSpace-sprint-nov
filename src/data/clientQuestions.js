/** Client open questions — mirrored from docs/requirements/client-questions.md (demo-short). */

export const QUESTION_SECTIONS = [
  {
    id: '03',
    code: '03',
    title: 'Earn with Ads, Hosts & Locations',
    accent: '#4fc3ff',
  },
  {
    id: '04',
    code: '04',
    title: 'Campaigns & Campaign Builder',
    accent: '#5fd39b',
  },
  {
    id: '05',
    code: '05',
    title: 'Earnings, Uptime & Admin Screens',
    accent: '#f2b544',
  },
]

export const CLIENT_QUESTIONS = [
  {
    id: 'Q03.1',
    sectionId: '03',
    title: 'Verified Hosts vs Ad-Supported screens',
    status: 'resolved',
    source: '03-earn-with-ads-hosts-locations.md; 04-campaigns-campaign-builder.md',
    summary:
      'Unverified companies stay out of campaign inventory entirely; admin company list flags Unverified.',
    link: {
      view: 'builder',
      step: 2,
      label: 'Campaign Builder · Choose screens',
    },
    body: [
      {
        type: 'ol',
        items: [
          'Must Campaign Builder inventory include only Verified Hosts?',
          'If yes: can unverified companies still have Ad-Supported screens (just blocked from new marketplace campaigns), or block Ad-Supported entirely until verified?',
        ],
      },
    ],
    decision: [
      {
        type: 'p',
        text: 'Until a company is Verified, do not show it in campaign inventory at all — Choose screens lists only Verified companies. Admin company / screens lists still show unverified companies, flagged as Unverified.',
      },
    ],
  },
  {
    id: 'Q03.2',
    sectionId: '03',
    title: 'Editing opening hours after campaigns are booked',
    status: 'resolved',
    source: '03 (Opening hours); 04 (inventory); related to Q04.1 / Q05.2',
    summary:
      'Hard block — opening hours cannot be edited while any campaign is set on the location; unlock when no campaigns remain. Soft cases → Q03.3.',
    body: [
      {
        type: 'p',
        text: 'Campaigns are booked against location opening hours. Can the company change those hours afterward?',
      },
      {
        type: 'ol',
        items: [
          'Expand only — can lengthen hours; cannot cut hours that overlap booked campaigns.',
          'Allow shorten + alert — can reduce hours; warn that cut hours won’t play and earnings drop.',
          'Hard block — no conflicting edit until bookings end (or admin override).',
          'Admin-only when booked — host proposes; admin applies narrowing.',
          'Other?',
        ],
      },
      {
        type: 'ul',
        items: [
          'Do expanded hours apply to already booked campaigns, or only new ones?',
          'If hours shrink, is shortfall handled like Q05.2?',
        ],
      },
    ],
    decision: [
      {
        type: 'p',
        text: 'Hard block — while any campaign is set on the location / screens, opening hours cannot be edited. Editing unlocks only when no campaigns remain.',
      },
      {
        type: 'p',
        text: 'Open follow-up on edits that would not hurt active campaigns: Q03.3.',
      },
    ],
  },
  {
    id: 'Q03.3',
    sectionId: '03',
    title: 'Allow opening-hours edits that still fully cover active campaigns',
    source:
      'Follow-up from Q03.2 (resolved); opening hours vs booked campaign hour windows; related to Q04.1',
    summary:
      'If a hours edit still fully covers every active campaign window, allow it — or keep the hard block?',
    body: [
      {
        type: 'p',
        text: 'Related to resolved Q03.2 (hard block while any campaign is set). Exception to consider: if the edit does not harm currently connected campaigns — e.g. new hours still fully cover every active campaign play window — should we allow it?',
      },
      {
        type: 'p',
        text: 'Example: campaign plays 13:00–16:00; location hours are 12:00–21:00; location wants to change to 13:00–18:00 (still covers the campaign). Allow, or still block?',
      },
      {
        type: 'ol',
        items: [
          'Still hard-block any opening-hours edit while any campaign is set (strict Q03.2).',
          'Allow when the new hours still fully cover every active campaign hour window; block only when an active campaign would lose coverage.',
          'Allow expand always; allow shorten only when coverage is preserved.',
          'Other?',
        ],
      },
    ],
  },
  {
    id: 'Q04.1',
    sectionId: '04',
    title: 'Partial overlap of opening hours vs campaign window',
    status: 'resolved',
    source: '04-campaigns-campaign-builder.md (schedule / screen selection)',
    summary:
      'Selectable only if available for the full campaign hour range; unavailable screens stay visible but not selectable.',
    link: {
      view: 'builder',
      step: 2,
      label: 'Campaign Builder · Choose screens',
    },
    body: [
      {
        type: 'p',
        text: 'Campaign wants 13:00–21:00; location is open 12:00–16:00 and has free slots. Is the screen selectable?',
      },
      {
        type: 'ol',
        items: [
          'Full cover required — entire campaign window must sit inside opening hours; otherwise hide / block.',
          'Partial OK — show the screen; book only overlapping hours.',
          'Other?',
        ],
      },
    ],
    decision: [
      {
        type: 'p',
        text: 'Full cover required for selection — a screen is selectable on Choose screens only if it is available across the entire campaign hour range. Screens that are not available for the full range are still shown, but not selectable.',
      },
    ],
  },
  {
    id: 'Q04.2',
    sectionId: '04',
    title: 'Proof of Play: photos vs automated',
    status: 'resolved',
    source: '04 (PoP); 05 (uptime); Campaign Detail → Delivery & PoP',
    summary:
      'No photo uploads — admin checks one tick per distinct media × screen in Delivery & PoP; Mark as Paid waits for that.',
    link: {
      view: 'detail',
      tab: 'delivery',
      label: 'Campaign Detail · Delivery & PoP',
    },
    body: [
      {
        type: 'p',
        text: 'Our concern (execution risk): Doc PoP = one photo per distinct ad per screen (e.g. 5 ads × 15 screens = 75 uploads). From our side this is likely to fail in practice, not just feel heavy:',
      },
      {
        type: 'ol',
        items: [
          'Volume — companies must capture many photos; gathering them at scale is hard.',
          'WhatsApp → admin — if owners send photos over WhatsApp for admin upload, matching each image to the right campaign / screen / ad is error-prone.',
          'Wrong uploads — both company and admin can attach the wrong photo to the wrong slot.',
          'Fixes compound errors — correcting a mis-upload can itself introduce another mismatch.',
          'Payout gate — Paid payout confirmation is blocked until all required PoPs exist, so this friction stalls payments and support.',
        ],
      },
      {
        type: 'p',
        text: 'We expect this workflow to break down operationally (missed proofs, mis-attribution, endless admin cleanup).',
      },
      {
        type: 'p',
        text: 'What do you recommend?',
      },
      {
        type: 'ol',
        items: [
          'Keep photo PoP as specified — one photo per distinct ad per screen; company upload + admin-on-behalf (e.g. WhatsApp). Ship knowing the ops risk above.',
          'Replace with automated proof — screen-on / playing detection + per-screen offline duration report; no photo uploads (or photos only as optional exception).',
          'Reduce photo burden — keep photos but shrink the set (e.g. one photo per screen per campaign, sample N screens, or spot-check only). Say the minimum.',
          'Hybrid — automated uptime as the gate; photos only when disputed / requested.',
          'Other?',
        ],
      },
      {
        type: 'ul',
        items: [
          'If (1) or (3): who is responsible when a photo is wrong or missing — company, admin, or both?',
          'Should payout still be hard-blocked until every required PoP is present, or allow admin override with a reason?',
        ],
      },
    ],
    decision: [
      {
        type: 'p',
        text: 'No photo PoP. In Delivery & PoP, admin ticks one checkbox per distinct media × screen; Mark as Paid stays blocked until that company’s PoP is complete.',
      },
    ],
  },
  {
    id: 'Q04.3',
    sectionId: '04',
    title: 'Slot count vs content/ad loop modes',
    status: 'resolved',
    source: '04 (slots 1–18; ~10 s/slot; 18 ≈ 3 min); current playlist / Ad Pack modes',
    summary:
      'Mode-locked by slot count — screens are filtered to the matching ad band in the next step.',
    link: {
      view: 'builder',
      step: 1,
      anchor: 'slots',
      label: 'Campaign Builder · Slots (1–18)',
    },
    body: [
      {
        type: 'p',
        text: 'Screens use one of three loop modes:',
      },
      {
        type: 'ul',
        items: [
          '1 min content — 2 min ad',
          '2 min content — 1 min ad',
          '3 min ad',
        ],
      },
      {
        type: 'p',
        text: 'Campaigns book 1–18 slots. How that maps to these modes is undefined.',
      },
      {
        type: 'ol',
        items: [
          'Flexible fill — campaign books a slot count (e.g. 7); play adapts per screen (e.g. 1 min ad window → spread over two loops; 2 min ad → one loop; 3 min ad → full loop).',
          'Mode-locked — campaign picks an ad duration up front (e.g. 2 min ad); inventory shows only matching screens.',
          'Other? (e.g. always book against full 3 min capacity.)',
        ],
      },
      {
        type: 'p',
        text: 'Editing the mode after booking → Q04.4.',
      },
    ],
    decision: [
      {
        type: 'p',
        text: 'Mode-locked by slot count — booked slot count sets the required ad band; in the next step, inventory shows only screens whose content/ad mode matches that band.',
      },
      {
        type: 'ul',
        items: [
          '1–6 slots → 2 min content — 1 min ad',
          '7–12 slots → 1 min content — 2 min ad',
          '13–18 slots → 3 min ad',
        ],
      },
    ],
  },
  {
    id: 'Q04.4',
    sectionId: '04',
    title: 'Host changes content/ad mode while screen is in a campaign',
    status: 'resolved',
    source: 'Related to Q04.3 (resolved); host playlist modes; 04 creatives',
    summary:
      'Hard block — a screen in any campaign cannot change content/ad mode until all its campaigns end. Exception cases → Q04.10.',
    body: [
      {
        type: 'p',
        text: 'Screen has host content and is in a campaign creative. Company wants to change content/ad minute mode (or content vs ad slot counts). What happens?',
      },
      {
        type: 'ol',
        items: [
          'Hard block until overlapping campaigns / Ad Packs end or leave the screen.',
          'Hard block + opt-out — same, plus mark screen so it stays out of new creatives until bookings end, then unlock edit.',
          'Allow + re-fit bookings into the new ad window.',
          'Allow + drop screen from affected creatives (notify).',
          'Other?',
        ],
      },
      {
        type: 'p',
        text: 'If (1) or (2): who sets the opt-out (host / admin / either)? Show “waiting to change mode” on Earnings / screen detail?',
      },
    ],
    decision: [
      {
        type: 'p',
        text: 'Hard block — while a screen is in any campaign, its content/ad mode cannot be edited to a different mode until all of its campaigns have ended. Example: 1 min content — 2 min ad cannot be changed to 2 min content — 1 min ad.',
      },
      {
        type: 'p',
        text: 'Open follow-up on whether edits that increase ad capacity should be allowed: Q04.10.',
      },
    ],
  },
  {
    id: 'Q04.5',
    sectionId: '04',
    title: 'Mixing legacy Ad Packs and Campaigns on one screen',
    status: 'resolved',
    source:
      '04 (campaigns instead of new Ad Packs; existing keep running); 03',
    summary:
      'Screens with any scheduled Ad Pack stay out of campaign inventory until those Ad Packs finish; Choose screens shows only screens with no scheduled Ad Packs.',
    link: {
      view: 'builder',
      step: 2,
      label: 'Campaign Builder · Choose screens',
    },
    body: [
      {
        type: 'p',
        text: 'New ads → Campaigns. Existing Ad Packs keep running and stay manageable; no migration required. Coexistence on one screen is undefined.',
      },
      {
        type: 'ol',
        items: [
          'Same-screen mix — e.g. morning Ad Pack, evening Campaign (no slot/hour conflict). Free-slot checks must treat Ad Pack hours as occupied.',
          'Screen exclusivity — a screen is either Ad Pack or Campaign path.',
          'Other?',
        ],
      },
      {
        type: 'p',
        text: 'If exclusivity: what switches it (first campaign booking / admin flag / last Ad Pack ends)?',
      },
    ],
    decision: [
      {
        type: 'p',
        text: 'Screen exclusivity by Ad Pack schedule — screens that have any active / scheduled Ad Packs are not selectable for campaigns until all of those scheduled Ad Packs have finished. In Campaign Builder → Choose screens, only screens with no scheduled Ad Packs are shown.',
      },
    ],
  },
  {
    id: 'Q04.7',
    sectionId: '04',
    title: 'Creative date schedule UI (Pattern) vs Notion Calendar',
    status: 'resolved',
    source:
      '04 Creative workspace (Notion Calendar reference); campaign-creative-content-model note; Builder → creative → Pattern',
    summary:
      'Pattern picker UI becomes Notion-like, while keeping the previous structure (form Pattern + separate Hours / Screens).',
    link: {
      view: 'builder',
      step: 3,
      anchor: 'creative-pattern',
      label: 'Campaign Builder · Creative Pattern (schedule)',
    },
    body: [
      {
        type: 'p',
        text: 'Doc cites Notion Calendar for the Pattern experience. Ask was whether to keep a form Pattern or move toward a full Notion Calendar canvas.',
      },
      {
        type: 'ol',
        items: [
          'Keep a form Pattern + separate Hours / Screens; Notion as inspiration only.',
          'Change toward full Notion Calendar — calendar canvas / recurrence-first.',
          'Other? (describe the target schedule UX)',
        ],
      },
    ],
    decision: [
      {
        type: 'p',
        text: 'Pattern selection UI should look like Notion, but keep the previous structure — form Pattern with separate Hours / Screens steps (not a full Notion Calendar canvas).',
      },
    ],
  },
  {
    id: 'Q04.8',
    sectionId: '04',
    title: 'Multi-resolution media under one asset vs per-resolution ad packages',
    status: 'resolved',
    source:
      '04 creatives; campaign-creative-content-model note; Builder → create/edit creative → Content step (format already chosen)',
    summary:
      'Creative create starts with Format; each creative is one format only — Any or one specific resolution. Multi-res media upload deferred to Q04.9.',
    link: {
      view: 'builder',
      step: 3,
      anchor: 'creative-format',
      label: 'Campaign Builder · Creative Format step',
    },
    body: [
      {
        type: 'p',
        text: 'Current wireframe: create/edit creative starts with Format (Any + resolutions from campaign screens), then Content sets media for the format’s ANY orientation package — Q04.8 still decides multi-res on the media vs per-resolution packages.',
      },
      {
        type: 'p',
        text: 'Proposal: on media upload, attach multiple resolutions under one media item; build the ad once in ANY; at playback pick the resolution that matches the screen.',
      },
      {
        type: 'ol',
        items: [
          'Adopt proposal — multi-res on the media asset; Content only needs ANY; drop or de-emphasize per-resolution packages.',
          'Keep current — separate content packages per resolution (ANY as fallback / override).',
          'Hybrid — ANY + multi-res media by default; per-resolution packages only as optional override.',
          'Other?',
        ],
      },
      {
        type: 'ul',
        items: [
          'Must every media in ANY cover every screen resolution on the creative, or is nearest-fit / scale allowed?',
          'Same rules for images and video?',
          'PoP / distinct ad (Q04.2): still one ad per media item, regardless of resolution variants?',
        ],
      },
    ],
    decision: [
      {
        type: 'p',
        text: 'When creating a creative, the first step is Format. Each creative has only one format: either Any, or one specific resolution (not multiple packages / orientations on the same creative).',
      },
      {
        type: 'p',
        text: 'The separate idea — upload multiple resolution variants under one media asset — is still open for Aziz to review (see Q04.9).',
      },
    ],
  },
  {
    id: 'Q04.9',
    sectionId: '04',
    title: 'Multi-resolution variants under one media asset',
    source:
      'Follow-up from Q04.8; media library / upload; Builder → create/edit creative → Content',
    summary:
      'Should one media item carry multiple resolution uploads, with playback picking the match? Aziz to review.',
    link: {
      view: 'builder',
      step: 3,
      anchor: 'creative-content',
      label: 'Campaign Builder · Creative Content step',
    },
    body: [
      {
        type: 'p',
        text: 'Related to resolved Q04.8 (creative Format = Any or one specific resolution). Open idea for Aziz to review: on media upload, attach multiple resolutions of the same asset under one media item; at playback pick the resolution that matches the screen.',
      },
      {
        type: 'ol',
        items: [
          'Yes — implement multi-res variants under one media item.',
          'No — keep one file / one resolution per media item.',
          'Other?',
        ],
      },
      {
        type: 'ul',
        items: [
          'If yes: must every variant cover every screen resolution on the creative, or is nearest-fit / scale allowed?',
          'Same rules for images and video?',
          'PoP / distinct ad (Q04.2): still one ad per media item, regardless of resolution variants?',
        ],
      },
    ],
  },
  {
    id: 'Q04.10',
    sectionId: '04',
    title: 'Allow content/ad mode edits that increase ad capacity while in a campaign',
    source:
      'Follow-up from Q04.4 (resolved); host playlist modes; overlapping campaign bookings',
    summary:
      'While Q04.4 hard-blocks mode changes, allow edits that grow ad minutes / free ad slots — or only when leftover capacity fits?',
    body: [
      {
        type: 'p',
        text: 'Related to resolved Q04.4 (hard block until all campaigns end). Exception to consider: if the edit increases the screen’s ad capacity (more ad minutes / slots), should we allow it?',
      },
      {
        type: 'p',
        text: 'Examples that increase ad capacity:',
      },
      {
        type: 'ul',
        items: [
          '2 min content — 1 min ad → 1 min content — 2 min ad (or → 3 min ad)',
          '2 min content — 1 min ad → fully 3 min ad',
        ],
      },
      {
        type: 'p',
        text: 'Edge case that shrinks ad capacity but might still fit: screen is 1 min content — 2 min ad; host wants 2 min content — 1 min ad. Campaign only books 3 ad slots (~30 s), and the remaining ad window has free space that can hold that 1 min ad — allow the change, or still hard-block?',
      },
      {
        type: 'ol',
        items: [
          'Never allow while any campaign is on the screen (strict Q04.4).',
          'Allow only when the new mode has more ad capacity than the old one (e.g. more ad minutes).',
          'Allow when every overlapping booking still fits in the new ad window (including free leftover slots), even if ad capacity shrinks.',
          'Other?',
        ],
      },
    ],
  },
  {
    id: 'Q05.1',
    sectionId: '05',
    title: 'Offline + ads scheduled warning',
    /** Deferred — not shown in Client questions UI for now. */
    hidden: true,
    source: '05 (Admin Screens warning); opening hours in 03',
    summary:
      'When does Offline + ads-scheduled warn — which window, which screens?',
    body: [
      {
        type: 'p',
        text: 'Doc: Offline during opening hours and ads scheduled → warn on Admin Screens (not only offline badge).',
      },
      {
        type: 'ol',
        items: [
          '“Ads scheduled” = current hour / anytime today / any future booked window?',
          'Warning only on Admin Screens, or also Earnings / screen detail / Host views?',
          'Outside opening hours, offline + ads later today → no warning until those hours start?',
        ],
      },
    ],
  },
  {
    id: 'Q05.2',
    sectionId: '05',
    title: 'Mark as Paid when online hours fall short',
    source:
      '04 (payables / PoP); 05 (uptime); Campaign Detail → Finance (edit screen payable)',
    summary:
      'At payout: ignore, reject, or reduce — and if reduced, how amount / destination / penalty work?',
    link: {
      view: 'detail',
      tab: 'finance',
      anchor: 'screen-payable',
      label: 'Campaign Detail · Finance (edit screen payable)',
    },
    body: [
      {
        type: 'p',
        text: 'At Mark as Paid, some screens were Online less than expected in the booked window. What do we do?',
      },
      {
        type: 'ol',
        items: [
          'No special handling — pay original amounts.',
          'Reject screens — exclude shortfall screens (they earn 0 for this campaign).',
          'Edit / reduce payout per screen — change the amount (answer Also below).',
          'Other?',
        ],
      },
      {
        type: 'p',
        text: 'Also (if (2) or (3), or any reduced / unpaid amount):',
      },
      {
        type: 'ol',
        items: [
          'How to set the amount — manual admin decrease, or auto cut by the same % under-delivered?',
          'Where the difference goes — stay with Ad Space, or refund / credit the advertiser?',
          'Extra company penalty beyond matching under-delivery? If yes: how calculated, and who gets it?',
        ],
      },
    ],
  },
  {
    id: 'Q05.3',
    sectionId: '05',
    title: 'Finance (full definition needed)',
    source:
      '04 (Finance / payables — Task 6 not finalized); 05 (Earnings); Campaign Detail → Finance',
    summary:
      'Finance is not finalized — define everything needed for this area so we can build it.',
    link: {
      view: 'detail',
      tab: 'finance',
      label: 'Campaign Detail · Finance',
    },
    body: [
      {
        type: 'p',
        text: 'Finance is not finalized. Please define everything we need for this area so we can build it correctly — including structure, invoices (how they are created and where they live), Mark as Paid, whether a separate finance/invoices surface is needed beyond the campaign Finance tab, any Odoo (or other) integration, and any other finance rules or flows that matter.',
      },
      {
        type: 'p',
        text: 'Surface (current sketch): Campaign Detail → Finance.',
      },
    ],
  },
]

/** Questions shown in the Client questions UI (excludes `hidden: true`). */
export const VISIBLE_CLIENT_QUESTIONS = CLIENT_QUESTIONS.filter((q) => !q.hidden)
