/**
 * Mock media library for the creative slot editor wireframe.
 */

export const MEDIA_LIBRARY = [
  {
    id: 'med_wallet',
    name: 'wallet-hero',
    type: 'video',
    orientation: 'Portrait',
    duration: 10,
    durationLabel: '0:10',
    thumb: 'linear-gradient(145deg, #f5d76e 0%, #c4a35a 40%, #5c4033 100%)',
    accent: '#f5d76e',
  },
  {
    id: 'med_galalogo',
    name: 'galalogo',
    type: 'image',
    orientation: 'Portrait',
    duration: 10,
    durationLabel: '0:10',
    thumb: 'linear-gradient(160deg, #1a2744, #3d5a80)',
    accent: '#7dd3fc',
  },
  {
    id: 'med_ikea',
    name: 'IKEA V AR.mp4',
    type: 'video',
    orientation: 'Portrait',
    duration: 10.2,
    durationLabel: '0:10.2',
    thumb: 'linear-gradient(145deg, #ffda1a, #0051ba)',
    accent: '#ffda1a',
  },
  {
    id: 'med_kn7',
    name: 'kn7dwnpnz3…',
    type: 'video',
    orientation: 'Portrait',
    duration: 30.2,
    durationLabel: '0:30.2',
    cutLabel: '-1s cut',
    thumb: 'linear-gradient(145deg, #0f766e, #134e4a)',
    accent: '#5eead4',
  },
  {
    id: 'med_city',
    name: 'city-night.mp4',
    type: 'video',
    orientation: 'Landscape',
    duration: 15,
    durationLabel: '0:15',
    thumb: 'linear-gradient(120deg, #312e81, #7c3aed)',
    accent: '#c4b5fd',
  },
  {
    id: 'med_food',
    name: 'menu-board.jpg',
    type: 'image',
    orientation: 'Landscape',
    duration: 10,
    durationLabel: '0:10',
    thumb: 'linear-gradient(145deg, #9a3412, #fb923c)',
    accent: '#fdba74',
  },
  {
    id: 'med_fit',
    name: 'fitness-reel.mp4',
    type: 'video',
    orientation: 'Portrait',
    duration: 20,
    durationLabel: '0:20',
    thumb: 'linear-gradient(160deg, #14532d, #4ade80)',
    accent: '#86efac',
  },
  {
    id: 'med_square',
    name: 'brand-square.png',
    type: 'image',
    orientation: 'Square',
    duration: 10,
    durationLabel: '0:10',
    thumb: 'linear-gradient(135deg, #881337, #fb7185)',
    accent: '#fda4af',
  },
]

export function mediaToSlotItem(media) {
  if (!media) return null
  return {
    mediaId: media.id,
    name: media.name,
    type: media.type,
    duration: media.duration,
    durationLabel: media.durationLabel,
    orientation: media.orientation,
    thumb: media.thumb,
    cutLabel: media.cutLabel || null,
  }
}
