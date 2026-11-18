/**
 * Mock marketplace inventory for Campaign Builder step 2.
 * Hierarchy: Company → Location → Screen
 */

export const LOCATION_TYPES = [
  'Gyms & Fitness Centers',
  'Cafés & Coffee Shops',
  'Restaurants',
  'Shopping Malls',
  'Offices & Coworking Spaces',
  'Clinics & Medical Centers',
]

export const AUDIENCES = ['Male', 'Female', 'Mixed']

export const COUNTRIES = ['Kuwait', 'Saudi Arabia', 'UAE', 'Qatar', 'Bahrain', 'Oman']

export const HOST_STATUSES = ['Verified', 'Pending', 'Not applied']

export const SCREEN_TAGS = [
  'Brand:Samsung',
  'Brand:LG',
  'Browser:Fully Kiosk',
  'Player:Raspberry Pi',
  'Player:Android APK',
]

export const SCREEN_ORIENTATIONS = ['Landscape', 'Portrait', 'Square']

export const SCREEN_RESOLUTIONS = [
  '1920×1080',
  '1080×1920',
  '3840×2160',
  '2160×3840',
  '1080×1080',
  '1280×720',
  '720×1280',
  '2560×1440',
]

/** Opening hours as 24h start/end; null day = closed. */
const WEEKDAY_HOURS = { open: 8, close: 22 }
const WEEKEND_HOURS = { open: 10, close: 23 }

function dailyHours(weekdays = WEEKDAY_HOURS, weekend = WEEKEND_HOURS) {
  return {
    mon: weekdays,
    tue: weekdays,
    wed: weekdays,
    thu: weekdays,
    fri: weekdays,
    sat: weekend,
    sun: weekend,
  }
}

export const COMPANIES = [
  {
    id: 'co_inspire',
    name: 'Inspire Media',
    hostStatus: 'Verified',
    revenueSharePercent: 70,
  },
  {
    id: 'co_avenues',
    name: 'Avenues Ops',
    hostStatus: 'Verified',
    revenueSharePercent: 65,
  },
  {
    id: 'co_metro',
    name: 'Metro Display',
    hostStatus: 'Verified',
    revenueSharePercent: 68,
  },
  {
    id: 'co_beacon',
    name: 'Beacon Hosts',
    hostStatus: 'Verified',
    revenueSharePercent: 62,
  },
  {
    id: 'co_coastal',
    name: 'Coastal Screens',
    hostStatus: 'Verified',
    revenueSharePercent: 64,
  },
  {
    id: 'co_gulf',
    name: 'Gulf Screens Co.',
    hostStatus: 'Pending',
    revenueSharePercent: 60,
  },
  {
    id: 'co_oasis',
    name: 'Oasis Digital',
    hostStatus: 'Not applied',
    revenueSharePercent: 55,
  },
]

export const INVENTORY = [
  {
    locationId: 'loc_01',
    locationName: 'Fitness First — Sharq',
    companyId: 'co_inspire',
    company: 'Inspire Media',
    type: 'Gyms & Fitness Centers',
    audience: 'Mixed',
    country: 'Kuwait',
    governorate: 'Capital',
    advertisingComplete: true,
    marketplaceEligible: true,
    shareOverridePercent: 75,
    openingHours: dailyHours(),
    screens: [
      {
        id: 'SCR-1042',
        name: 'Lobby LED',
        loopMode: 'c2a1',
        freeSlots: 12,
        eligible: true,
        orientation: 'Landscape',
        resolution: '1920×1080',
        tags: ['Brand:Samsung', 'Player:Android APK'],
      },
      {
        id: 'SCR-1043',
        name: 'Cardio Wall',
        loopMode: 'c2a1',
        freeSlots: 6,
        eligible: true,
        orientation: 'Landscape',
        resolution: '3840×2160',
        tags: ['Brand:LG', 'Browser:Fully Kiosk'],
      },
      {
        id: 'SCR-1044',
        name: 'Cafe Corner',
        loopMode: 'c1a2',
        freeSlots: 2,
        eligible: true,
        orientation: 'Portrait',
        resolution: '1080×1920',
        tags: ['Brand:Samsung', 'Player:Raspberry Pi'],
      },
      {
        id: 'SCR-1045',
        name: 'Pool Deck',
        loopMode: 'c2a1',
        freeSlots: 10,
        eligible: true,
        orientation: 'Landscape',
        resolution: '1920×1080',
        tags: ['Brand:LG', 'Browser:Fully Kiosk'],
      },
      {
        id: 'SCR-1046',
        name: 'Members Desk',
        loopMode: 'c2a1',
        freeSlots: 9,
        eligible: true,
        orientation: 'Portrait',
        resolution: '1080×1920',
        tags: ['Brand:Samsung', 'Player:Android APK'],
      },
    ],
  },
  {
    locationId: 'loc_02',
    locationName: 'Cafe Mantou',
    companyId: 'co_inspire',
    company: 'Inspire Media',
    type: 'Cafés & Coffee Shops',
    audience: 'Mixed',
    country: 'Kuwait',
    governorate: 'Hawalli',
    advertisingComplete: true,
    marketplaceEligible: true,
    openingHours: dailyHours({ open: 7, close: 24 }, { open: 8, close: 24 }),
    screens: [
      {
        id: 'SCR-2101',
        name: 'Counter Screen',
        loopMode: 'c1a2',
        freeSlots: 18,
        eligible: true,
        orientation: 'Portrait',
        resolution: '1080×1920',
        tags: ['Brand:Samsung', 'Browser:Fully Kiosk'],
      },
      {
        id: 'SCR-2102',
        name: 'Window Portrait',
        loopMode: 'c2a1',
        freeSlots: 9,
        eligible: true,
        orientation: 'Portrait',
        // 3:4 — distinct from 9:16 so aspect-ratio picker shows multiple “from screens”
        resolution: '1080×1440',
        tags: ['Brand:LG', 'Player:Android APK'],
      },
      {
        id: 'SCR-2103',
        name: 'Back Patio',
        loopMode: 'c2a1',
        freeSlots: 11,
        eligible: true,
        orientation: 'Landscape',
        resolution: '1920×1080',
        tags: ['Brand:Samsung', 'Browser:Fully Kiosk'],
      },
      {
        id: 'SCR-2104',
        name: 'Pastry Case',
        loopMode: 'c2a1',
        freeSlots: 12,
        eligible: true,
        orientation: 'Square',
        resolution: '1080×1080',
        tags: ['Brand:LG', 'Player:Raspberry Pi'],
      },
    ],
  },
  {
    locationId: 'loc_03',
    locationName: 'The Avenues — Zone A',
    companyId: 'co_avenues',
    company: 'Avenues Ops',
    type: 'Shopping Malls',
    audience: 'Mixed',
    country: 'Kuwait',
    governorate: 'Farwaniya',
    advertisingComplete: true,
    marketplaceEligible: true,
    openingHours: dailyHours({ open: 10, close: 22 }, { open: 10, close: 23 }),
    screens: [
      {
        id: 'SCR-3301',
        name: 'Main Concourse',
        loopMode: 'c2a1',
        freeSlots: 4,
        eligible: true,
        orientation: 'Landscape',
        // 43:18 ultrawide — second landscape ratio in “From your screens”
        resolution: '3440×1440',
        tags: ['Brand:Samsung', 'Player:Android APK'],
      },
      {
        id: 'SCR-3302',
        name: 'Food Court L1',
        loopMode: 'a3',
        freeSlots: 15,
        eligible: true,
        orientation: 'Square',
        resolution: '1080×1080',
        tags: ['Brand:LG', 'Browser:Fully Kiosk'],
      },
      {
        id: 'SCR-3303',
        name: 'Parking Exit',
        loopMode: 'c2a1',
        freeSlots: 10,
        eligible: false,
        orientation: 'Landscape',
        resolution: '1920×1080',
        tags: ['Brand:Samsung', 'Player:Raspberry Pi'],
      },
      {
        id: 'SCR-3304',
        name: 'Zone B Bridge',
        loopMode: 'c2a1',
        freeSlots: 9,
        eligible: true,
        orientation: 'Landscape',
        resolution: '1920×1080',
        tags: ['Brand:LG', 'Browser:Fully Kiosk'],
      },
      {
        id: 'SCR-3305',
        name: 'Luxury Court',
        loopMode: 'c2a1',
        freeSlots: 8,
        eligible: true,
        orientation: 'Portrait',
        resolution: '1080×1920',
        tags: ['Brand:Samsung', 'Player:Android APK'],
      },
    ],
  },
  {
    locationId: 'loc_04',
    locationName: 'NBK Branch — Salmiya',
    companyId: 'co_gulf',
    company: 'Gulf Screens Co.',
    type: 'Offices & Coworking Spaces',
    audience: 'Mixed',
    country: 'Kuwait',
    governorate: 'Hawalli',
    advertisingComplete: false,
    marketplaceEligible: false,
    openingHours: dailyHours({ open: 8, close: 15 }, { open: null, close: null }),
    screens: [
      {
        id: 'SCR-4401',
        name: 'Teller Wall',
        loopMode: 'c1a2',
        freeSlots: 14,
        eligible: false,
        orientation: 'Landscape',
        resolution: '2560×1440',
        tags: ['Brand:LG', 'Browser:Fully Kiosk'],
      },
    ],
  },
  {
    locationId: 'loc_05',
    locationName: 'Glow Clinic',
    companyId: 'co_metro',
    company: 'Metro Display',
    type: 'Clinics & Medical Centers',
    audience: 'Female',
    country: 'Kuwait',
    governorate: 'Capital',
    advertisingComplete: true,
    marketplaceEligible: true,
    openingHours: dailyHours({ open: 9, close: 21 }, { open: 10, close: 18 }),
    screens: [
      {
        id: 'SCR-5501',
        name: 'Reception',
        loopMode: 'c2a1',
        freeSlots: 11,
        eligible: true,
        orientation: 'Portrait',
        resolution: '1080×1920',
        tags: ['Brand:Samsung', 'Player:Android APK'],
      },
      {
        id: 'SCR-5502',
        name: 'Waiting Room',
        loopMode: 'c2a1',
        freeSlots: 8,
        eligible: true,
        orientation: 'Landscape',
        resolution: '1920×1080',
        tags: ['Brand:Samsung', 'Browser:Fully Kiosk'],
      },
      {
        id: 'SCR-5503',
        name: 'Treatment Hall',
        loopMode: 'c2a1',
        freeSlots: 10,
        eligible: true,
        orientation: 'Landscape',
        resolution: '2560×1440',
        tags: ['Brand:LG', 'Player:Android APK'],
      },
      {
        id: 'SCR-5504',
        name: 'Pharmacy Wall',
        loopMode: 'c2a1',
        freeSlots: 7,
        eligible: true,
        orientation: 'Portrait',
        resolution: '1080×1920',
        tags: ['Brand:Samsung', 'Browser:Fully Kiosk'],
      },
    ],
  },
  {
    locationId: 'loc_06',
    locationName: 'Burger Lab — Marina',
    companyId: 'co_inspire',
    company: 'Inspire Media',
    type: 'Restaurants',
    audience: 'Male',
    country: 'Kuwait',
    governorate: 'Capital',
    advertisingComplete: true,
    marketplaceEligible: true,
    openingHours: dailyHours({ open: 11, close: 24 }, { open: 11, close: 24 }),
    screens: [
      {
        id: 'SCR-6601',
        name: 'Menu Board',
        loopMode: 'a3',
        freeSlots: 3,
        eligible: true,
        orientation: 'Portrait',
        resolution: '1080×1920',
        tags: ['Brand:LG', 'Player:Android APK'],
      },
      {
        id: 'SCR-6602',
        name: 'Entrance',
        loopMode: 'c1a2',
        freeSlots: 16,
        eligible: true,
        orientation: 'Landscape',
        resolution: '1280×720',
        tags: ['Brand:Samsung', 'Browser:Fully Kiosk'],
      },
    ],
  },
  {
    locationId: 'loc_07',
    locationName: 'Oasis Cafe — Riyadh',
    companyId: 'co_oasis',
    company: 'Oasis Digital',
    type: 'Cafés & Coffee Shops',
    audience: 'Mixed',
    country: 'Saudi Arabia',
    governorate: 'Riyadh',
    advertisingComplete: false,
    marketplaceEligible: false,
    openingHours: dailyHours({ open: 8, close: 23 }, { open: 9, close: 24 }),
    screens: [
      {
        id: 'SCR-7701',
        name: 'Bar Screen',
        loopMode: 'c2a1',
        freeSlots: 12,
        eligible: true,
        orientation: 'Square',
        resolution: '1080×1080',
        tags: ['Brand:Samsung', 'Player:Android APK'],
      },
    ],
  },
  {
    locationId: 'loc_08',
    locationName: 'Dubai Marina Gym',
    companyId: 'co_avenues',
    company: 'Avenues Ops',
    type: 'Gyms & Fitness Centers',
    audience: 'Mixed',
    country: 'UAE',
    governorate: 'Dubai',
    advertisingComplete: true,
    marketplaceEligible: true,
    openingHours: dailyHours({ open: 6, close: 23 }, { open: 7, close: 23 }),
    screens: [
      {
        id: 'SCR-8801',
        name: 'Entrance Wall',
        loopMode: 'c1a2',
        freeSlots: 10,
        eligible: true,
        orientation: 'Landscape',
        resolution: '1920×1080',
        tags: ['Brand:LG', 'Player:Raspberry Pi'],
      },
      {
        id: 'SCR-8802',
        name: 'Locker Hall',
        loopMode: 'c2a1',
        freeSlots: 5,
        eligible: true,
        orientation: 'Portrait',
        resolution: '2160×3840',
        tags: ['Brand:Samsung', 'Browser:Fully Kiosk'],
      },
      {
        id: 'SCR-8803',
        name: 'Cardio Mezzanine',
        loopMode: 'c2a1',
        freeSlots: 10,
        eligible: true,
        orientation: 'Landscape',
        resolution: '1920×1080',
        tags: ['Brand:LG', 'Player:Android APK'],
      },
      {
        id: 'SCR-8804',
        name: 'Smoothie Bar',
        loopMode: 'c2a1',
        freeSlots: 11,
        eligible: true,
        orientation: 'Portrait',
        resolution: '1080×1920',
        tags: ['Brand:Samsung', 'Browser:Fully Kiosk'],
      },
    ],
  },
  {
    // Morning-only location — outside default campaign / creative window (10–22)
    locationId: 'loc_09',
    locationName: 'Sunrise Bakery — Sharq',
    companyId: 'co_inspire',
    company: 'Inspire Media',
    type: 'Cafés & Coffee Shops',
    audience: 'Mixed',
    country: 'Kuwait',
    governorate: 'Capital',
    advertisingComplete: true,
    marketplaceEligible: true,
    openingHours: dailyHours({ open: 5, close: 9 }, { open: 5, close: 9 }),
    screens: [
      {
        id: 'SCR-9901',
        name: 'Counter Display',
        loopMode: 'a3',
        freeSlots: 20,
        eligible: true,
        orientation: 'Portrait',
        resolution: '1080×1920',
        tags: ['Brand:Samsung', 'Player:Android APK'],
      },
      {
        id: 'SCR-9902',
        name: 'Window Board',
        loopMode: 'c2a1',
        freeSlots: 14,
        eligible: true,
        orientation: 'Landscape',
        resolution: '1920×1080',
        tags: ['Brand:LG', 'Browser:Fully Kiosk'],
      },
    ],
  },
  {
    locationId: 'loc_10',
    locationName: '360 Mall — Court',
    companyId: 'co_avenues',
    company: 'Avenues Ops',
    type: 'Shopping Malls',
    audience: 'Mixed',
    country: 'Kuwait',
    governorate: 'Farwaniya',
    advertisingComplete: true,
    marketplaceEligible: true,
    openingHours: dailyHours({ open: 10, close: 22 }, { open: 10, close: 23 }),
    screens: [
      {
        id: 'SCR-A101',
        name: 'Center Court LED',
        loopMode: 'c2a1',
        freeSlots: 9,
        eligible: true,
        orientation: 'Landscape',
        resolution: '3840×2160',
        tags: ['Brand:Samsung', 'Player:Android APK'],
      },
      {
        id: 'SCR-A102',
        name: 'Fashion Wing',
        loopMode: 'c2a1',
        freeSlots: 12,
        eligible: true,
        orientation: 'Portrait',
        resolution: '1080×1920',
        tags: ['Brand:LG', 'Browser:Fully Kiosk'],
      },
      {
        id: 'SCR-A103',
        name: 'Kids Zone Cube',
        loopMode: 'c2a1',
        freeSlots: 14,
        eligible: true,
        orientation: 'Square',
        resolution: '1080×1080',
        tags: ['Brand:Samsung', 'Player:Raspberry Pi'],
      },
      {
        id: 'SCR-A104',
        name: 'Valet Desk',
        loopMode: 'c2a1',
        freeSlots: 8,
        eligible: true,
        orientation: 'Landscape',
        resolution: '1920×1080',
        tags: ['Brand:LG', 'Player:Android APK'],
      },
    ],
  },
  {
    locationId: 'loc_11',
    locationName: 'Metro Hub — Salmiya',
    companyId: 'co_metro',
    company: 'Metro Display',
    type: 'Offices & Coworking Spaces',
    audience: 'Mixed',
    country: 'Kuwait',
    governorate: 'Hawalli',
    advertisingComplete: true,
    marketplaceEligible: true,
    openingHours: dailyHours({ open: 8, close: 22 }, { open: 10, close: 22 }),
    screens: [
      {
        id: 'SCR-B201',
        name: 'Lobby Dual',
        loopMode: 'c2a1',
        freeSlots: 11,
        eligible: true,
        orientation: 'Landscape',
        resolution: '1920×1080',
        tags: ['Brand:Samsung', 'Browser:Fully Kiosk'],
      },
      {
        id: 'SCR-B202',
        name: 'Elevator Bank',
        loopMode: 'c2a1',
        freeSlots: 10,
        eligible: true,
        orientation: 'Portrait',
        resolution: '1080×1920',
        tags: ['Brand:LG', 'Player:Android APK'],
      },
      {
        id: 'SCR-B203',
        name: 'Cafe Kiosk',
        loopMode: 'c2a1',
        freeSlots: 13,
        eligible: true,
        orientation: 'Portrait',
        resolution: '1080×1440',
        tags: ['Brand:Samsung', 'Player:Raspberry Pi'],
      },
      {
        id: 'SCR-B204',
        name: 'Meeting Floor',
        loopMode: 'c1a2',
        freeSlots: 16,
        eligible: true,
        orientation: 'Landscape',
        resolution: '2560×1440',
        tags: ['Brand:LG', 'Browser:Fully Kiosk'],
      },
    ],
  },
  {
    locationId: 'loc_12',
    locationName: 'Beacon Gym — Jabriya',
    companyId: 'co_beacon',
    company: 'Beacon Hosts',
    type: 'Gyms & Fitness Centers',
    audience: 'Mixed',
    country: 'Kuwait',
    governorate: 'Hawalli',
    advertisingComplete: true,
    marketplaceEligible: true,
    openingHours: dailyHours({ open: 6, close: 23 }, { open: 7, close: 23 }),
    screens: [
      {
        id: 'SCR-C301',
        name: 'Spin Studio',
        loopMode: 'c2a1',
        freeSlots: 9,
        eligible: true,
        orientation: 'Landscape',
        resolution: '1920×1080',
        tags: ['Brand:Samsung', 'Player:Android APK'],
      },
      {
        id: 'SCR-C302',
        name: 'Weights Floor',
        loopMode: 'c2a1',
        freeSlots: 8,
        eligible: true,
        orientation: 'Landscape',
        resolution: '3840×2160',
        tags: ['Brand:LG', 'Browser:Fully Kiosk'],
      },
      {
        id: 'SCR-C303',
        name: 'Juice Bar',
        loopMode: 'c2a1',
        freeSlots: 12,
        eligible: true,
        orientation: 'Portrait',
        resolution: '1080×1920',
        tags: ['Brand:Samsung', 'Player:Raspberry Pi'],
      },
      {
        id: 'SCR-C304',
        name: 'Sauna Lobby',
        loopMode: 'c2a1',
        freeSlots: 7,
        eligible: true,
        orientation: 'Square',
        resolution: '1080×1080',
        tags: ['Brand:LG', 'Player:Android APK'],
      },
    ],
  },
  {
    locationId: 'loc_13',
    locationName: 'Beacon Cafe — Abdullah Al-Mubarak',
    companyId: 'co_beacon',
    company: 'Beacon Hosts',
    type: 'Cafés & Coffee Shops',
    audience: 'Mixed',
    country: 'Kuwait',
    governorate: 'Farwaniya',
    advertisingComplete: true,
    marketplaceEligible: true,
    openingHours: dailyHours({ open: 7, close: 24 }, { open: 8, close: 24 }),
    screens: [
      {
        id: 'SCR-C401',
        name: 'Order Counter',
        loopMode: 'c2a1',
        freeSlots: 14,
        eligible: true,
        orientation: 'Portrait',
        resolution: '1080×1920',
        tags: ['Brand:Samsung', 'Browser:Fully Kiosk'],
      },
      {
        id: 'SCR-C402',
        name: 'Patio Wall',
        loopMode: 'c2a1',
        freeSlots: 10,
        eligible: true,
        orientation: 'Landscape',
        resolution: '1920×1080',
        tags: ['Brand:LG', 'Player:Android APK'],
      },
      {
        id: 'SCR-C403',
        name: 'Drive-thru',
        loopMode: 'c2a1',
        freeSlots: 11,
        eligible: true,
        orientation: 'Landscape',
        resolution: '1280×720',
        tags: ['Brand:Samsung', 'Player:Raspberry Pi'],
      },
    ],
  },
  {
    locationId: 'loc_14',
    locationName: 'Coastal Plaza — Fahaheel',
    companyId: 'co_coastal',
    company: 'Coastal Screens',
    type: 'Shopping Malls',
    audience: 'Mixed',
    country: 'Kuwait',
    governorate: 'Ahmadi',
    advertisingComplete: true,
    marketplaceEligible: true,
    openingHours: dailyHours({ open: 10, close: 22 }, { open: 10, close: 23 }),
    screens: [
      {
        id: 'SCR-D501',
        name: 'Sea View Concourse',
        loopMode: 'c2a1',
        freeSlots: 9,
        eligible: true,
        orientation: 'Landscape',
        resolution: '3440×1440',
        tags: ['Brand:Samsung', 'Player:Android APK'],
      },
      {
        id: 'SCR-D502',
        name: 'Cinema Corridor',
        loopMode: 'c2a1',
        freeSlots: 12,
        eligible: true,
        orientation: 'Portrait',
        resolution: '1080×1920',
        tags: ['Brand:LG', 'Browser:Fully Kiosk'],
      },
      {
        id: 'SCR-D503',
        name: 'Food Hall A',
        loopMode: 'c2a1',
        freeSlots: 8,
        eligible: true,
        orientation: 'Landscape',
        resolution: '1920×1080',
        tags: ['Brand:Samsung', 'Player:Raspberry Pi'],
      },
      {
        id: 'SCR-D504',
        name: 'Food Hall B',
        loopMode: 'c2a1',
        freeSlots: 8,
        eligible: true,
        orientation: 'Landscape',
        resolution: '1920×1080',
        tags: ['Brand:LG', 'Player:Android APK'],
      },
      {
        id: 'SCR-D505',
        name: 'Info Totem',
        loopMode: 'c2a1',
        freeSlots: 15,
        eligible: true,
        orientation: 'Portrait',
        resolution: '720×1280',
        tags: ['Brand:Samsung', 'Browser:Fully Kiosk'],
      },
    ],
  },
  {
    locationId: 'loc_15',
    locationName: 'Coastal Bistro — Mahboula',
    companyId: 'co_coastal',
    company: 'Coastal Screens',
    type: 'Restaurants',
    audience: 'Mixed',
    country: 'Kuwait',
    governorate: 'Ahmadi',
    advertisingComplete: true,
    marketplaceEligible: true,
    openingHours: dailyHours({ open: 11, close: 24 }, { open: 11, close: 24 }),
    screens: [
      {
        id: 'SCR-D601',
        name: 'Entrance LED',
        loopMode: 'c2a1',
        freeSlots: 10,
        eligible: true,
        orientation: 'Landscape',
        resolution: '1920×1080',
        tags: ['Brand:Samsung', 'Player:Android APK'],
      },
      {
        id: 'SCR-D602',
        name: 'Bar Mirror',
        loopMode: 'c2a1',
        freeSlots: 9,
        eligible: true,
        orientation: 'Portrait',
        resolution: '1080×1920',
        tags: ['Brand:LG', 'Browser:Fully Kiosk'],
      },
      {
        id: 'SCR-D603',
        name: 'Private Room',
        loopMode: 'c2a1',
        freeSlots: 14,
        eligible: true,
        orientation: 'Square',
        resolution: '1080×1080',
        tags: ['Brand:Samsung', 'Player:Raspberry Pi'],
      },
    ],
  },
  {
    locationId: 'loc_16',
    locationName: 'Inspire Tower — Capital',
    companyId: 'co_inspire',
    company: 'Inspire Media',
    type: 'Offices & Coworking Spaces',
    audience: 'Mixed',
    country: 'Kuwait',
    governorate: 'Capital',
    advertisingComplete: true,
    marketplaceEligible: true,
    openingHours: dailyHours({ open: 8, close: 20 }, { open: 9, close: 18 }),
    screens: [
      {
        id: 'SCR-E701',
        name: 'Ground Reception',
        loopMode: 'c2a1',
        freeSlots: 11,
        eligible: true,
        orientation: 'Landscape',
        resolution: '1920×1080',
        tags: ['Brand:Samsung', 'Player:Android APK'],
      },
      {
        id: 'SCR-E702',
        name: 'Sky Lobby',
        loopMode: 'c2a1',
        freeSlots: 10,
        eligible: true,
        orientation: 'Landscape',
        resolution: '3840×2160',
        tags: ['Brand:LG', 'Browser:Fully Kiosk'],
      },
      {
        id: 'SCR-E703',
        name: 'Parking L2',
        loopMode: 'c2a1',
        freeSlots: 13,
        eligible: true,
        orientation: 'Portrait',
        resolution: '1080×1920',
        tags: ['Brand:Samsung', 'Player:Raspberry Pi'],
      },
    ],
  },
  {
    locationId: 'loc_17',
    locationName: 'Metro Clinic — Qurain',
    companyId: 'co_metro',
    company: 'Metro Display',
    type: 'Clinics & Medical Centers',
    audience: 'Mixed',
    country: 'Kuwait',
    governorate: 'Mubarak Al-Kabeer',
    advertisingComplete: true,
    marketplaceEligible: true,
    openingHours: dailyHours({ open: 9, close: 21 }, { open: 10, close: 18 }),
    screens: [
      {
        id: 'SCR-B301',
        name: 'Check-in Wall',
        loopMode: 'c2a1',
        freeSlots: 12,
        eligible: true,
        orientation: 'Landscape',
        resolution: '1920×1080',
        tags: ['Brand:Samsung', 'Browser:Fully Kiosk'],
      },
      {
        id: 'SCR-B302',
        name: 'Pediatrics',
        loopMode: 'c2a1',
        freeSlots: 9,
        eligible: true,
        orientation: 'Portrait',
        resolution: '1080×1920',
        tags: ['Brand:LG', 'Player:Android APK'],
      },
      {
        id: 'SCR-B303',
        name: 'Lab Corridor',
        loopMode: 'c2a1',
        freeSlots: 11,
        eligible: true,
        orientation: 'Landscape',
        resolution: '2560×1440',
        tags: ['Brand:Samsung', 'Player:Raspberry Pi'],
      },
    ],
  },
]

export function getCompany(companyId) {
  return COMPANIES.find((c) => c.id === companyId)
}

/**
 * Availability breakdown for inventory UI.
 *
 * marketplace mode (campaign Choose screens) — priority order:
 * 1. not_eligible — host / marketplace / screen gate
 * 2. outside_hours — selected time window does not fit location opening hours
 * 3. booked_elsewhere — same screen already used by another overlapping creative
 * 4. insufficient_slots — not enough free slots for campaign slot count
 *
 * creative mode (assign from campaign pool) — priority order:
 * 1. format_mismatch — orientation / resolution ≠ Format step
 * 2. booked_elsewhere — overlapping schedule with another creative on this screen
 *
 * @param {object} ctx
 * @param {number} ctx.slots
 * @param {number} ctx.hourStart
 * @param {number} ctx.hourEnd
 * @param {'marketplace'|'creative'} [ctx.mode='marketplace']
 * @param {string} [ctx.requiredOrientation]
 * @param {string} [ctx.requiredAspectRatio] any | resolution (e.g. 1920×1080) | legacy ratio
 * @param {Map<string, string>|Record<string, string>} [ctx.bookedScreens]
 *        screenId → other creative name
 */
export function getScreenAvailability(
  location,
  screen,
  {
    slots,
    hourStart,
    hourEnd,
    bookedScreens,
    mode = 'marketplace',
    requiredOrientation = null,
    requiredAspectRatio = null,
  },
) {
  const bookedBy =
    bookedScreens instanceof Map
      ? bookedScreens.get(screen.id)
      : bookedScreens?.[screen.id]

  if (mode === 'creative') {
    if (requiredOrientation) {
      const orientationOk = screen.orientation === requiredOrientation
      const wantAny =
        requiredOrientation === 'Square' ||
        !requiredAspectRatio ||
        requiredAspectRatio === 'any'
      let formatOk = true
      if (orientationOk && !wantAny) {
        const parsed = String(screen.resolution || '').match(
          /(\d+)\s*[×xX]\s*(\d+)/,
        )
        const targetParsed = String(requiredAspectRatio || '').match(
          /(\d+)\s*[×xX]\s*(\d+)/,
        )
        if (targetParsed) {
          // Concrete resolution from Format step
          formatOk =
            Boolean(parsed) &&
            Number(parsed[1]) === Number(targetParsed[1]) &&
            Number(parsed[2]) === Number(targetParsed[2])
        } else if (!parsed) {
          formatOk = false
        } else {
          // Legacy aspect-ratio token (e.g. 16:9)
          let w = Number(parsed[1])
          let h = Number(parsed[2])
          let a = w
          let b = h
          while (b) {
            const t = b
            b = a % b
            a = t
          }
          const g = a || 1
          formatOk = `${w / g}:${h / g}` === requiredAspectRatio
        }
      }
      if (!orientationOk || !formatOk) {
        return {
          selectable: false,
          reason: 'format_mismatch',
          label: 'Wrong format',
          detail: orientationOk
            ? `Needs ${requiredAspectRatio}`
            : `Needs ${requiredOrientation}`,
        }
      }
    }
    if (bookedBy) {
      return {
        selectable: false,
        reason: 'booked_elsewhere',
        label: 'In another creative',
        detail: bookedBy,
      }
    }
    return { selectable: true, reason: null, label: null }
  }

  const inHours = hoursOverlapOpening(location.openingHours, hourStart, hourEnd)
  const enoughSlots = screen.freeSlots >= slots
  // Host Verified is enforced by omitting unverified companies from Choose screens (Q03.1).
  const eligibleBase =
    location.marketplaceEligible &&
    location.advertisingComplete &&
    screen.eligible

  if (!eligibleBase) {
    return {
      selectable: false,
      reason: 'not_eligible',
      label: 'Not eligible',
    }
  }
  if (!inHours) {
    return {
      selectable: false,
      reason: 'outside_hours',
      label: 'Outside hours',
    }
  }
  if (bookedBy) {
    return {
      selectable: false,
      reason: 'booked_elsewhere',
      label: 'In another creative',
      detail: bookedBy,
    }
  }
  if (!enoughSlots) {
    return {
      selectable: false,
      reason: 'insufficient_slots',
      label: 'Not enough slots',
    }
  }
  return { selectable: true, reason: null, label: null }
}

export function isScreenSelectable(location, screen, ctx) {
  return getScreenAvailability(location, screen, ctx).selectable
}

function hoursOverlapOpening(openingHours, hourStart, hourEnd) {
  if (hourStart == null || hourEnd == null || hourStart >= hourEnd) return false
  return Object.values(openingHours).some((day) => {
    if (day.open == null || day.close == null) return false
    return hourStart < day.close && hourEnd > day.open
  })
}
