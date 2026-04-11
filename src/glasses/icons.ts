// StoryWalk G2 — pixel art POI icons, rendered via upng-js 4-bit indexed PNG.
// Adapted from hunter-g2/src/glasses/icons.ts (same proven pipeline).
//
// Stay well under the 200x100 image-size quirk: 12x12 scaled 6x = 72x72.

import UPNG from 'upng-js'
import type { PoiCategory } from '../state'

// 12x12 sprite palette:
//   '.' transparent
//   'o' outline
//   'w' white fill
//   'g' mid grey
//   'l' light highlight
const ICONS: Record<string, string[]> = {
  // Column with capital — generic monument
  monument: [
    '...oooooo...',
    '..owwwwwwo..',
    '..oooooooo..',
    '...owwwwo...',
    '...owwwwo...',
    '...owggwo...',
    '...owggwo...',
    '...owwwwo...',
    '...owwwwo...',
    '..oooooooo..',
    '.oooooooooo.',
    '............',
  ],
  // Church with cross
  church: [
    '.....oo.....',
    '....owwo....',
    '...owwwwo...',
    '...ooooooo..',
    '..oowwwwwo..',
    '..owwowwwo..',
    '.oowowowwoo.',
    '.owwoowwowo.',
    '.owooooowwo.',
    '.owowwwowwo.',
    '.ooooooooooo',
    '............',
  ],
  // Museum: columns with roof (copy of hunter-g2)
  museum: [
    '.....oo.....',
    '....oooo....',
    '...oooooo...',
    '..oooooooo..',
    '.oooooooooo.',
    'oooooooooooo',
    '.ooowoowooo.',
    '.owowowowoo.',
    '.owowowowoo.',
    '.ooooooooo..',
    'oooooooooooo',
    '............',
  ],
  // Park: tree (copy of hunter-g2)
  park: [
    '....oooo....',
    '...owwwwo...',
    '..owwwwwwo..',
    '.owwggwwwwo.',
    'owwwwwwwwwwo',
    'owwwwgwwwwwo',
    '.owwwwwwwo..',
    '..oooooooo..',
    '.....oo.....',
    '.....oo.....',
    '....oooo....',
    '............',
  ],
  // Statue: figure on pedestal
  statue: [
    '....oooo....',
    '....owwo....',
    '....owwo....',
    '...owwwwo...',
    '..owwwwwwo..',
    '..owwwwwwo..',
    '...owwwwo...',
    '....owwo....',
    '....owwo....',
    '..oooooooo..',
    '.oooooooooo.',
    '............',
  ],
  // Bridge: arch
  bridge: [
    '............',
    '............',
    '....oooo....',
    '..oowwwwoo..',
    '.owwwwwwwwo.',
    'owwwwwwwwwwo',
    'owoowwwwoowo',
    'owoowwwwoowo',
    'owoowwwwoowo',
    'oooooooooooo',
    '.oooooooooo.',
    '............',
  ],
  // Castle: crenellated walls
  castle: [
    'oo.oo.oo.oo.',
    'oooooooooooo',
    'owwwwwwwwwwo',
    'owwowwwwowwo',
    'owwowwwwowwo',
    'owwwwwwwwwwo',
    'owwowwowwowo',
    'owwwwwwwwwwo',
    'oooooooooooo',
    'owwwwwwwwwwo',
    'oooooooooooo',
    '............',
  ],
  // Ruins: broken columns
  ruins: [
    '............',
    '.o.......oo.',
    '.o.oo....ooo',
    '.o.oo..oooo.',
    '.o.oo..oooo.',
    '.o.oo..oooo.',
    '.o.oo..oooo.',
    'oooooooooooo',
    '.oooooooooo.',
    '............',
    '............',
    '............',
  ],
  // Memorial: stele with wreath
  memorial: [
    '....oooo....',
    '...owwwwo...',
    '..oooooooo..',
    '..owwwwwwo..',
    '..ow....wo..',
    '..ow.oo.wo..',
    '..ow.oo.wo..',
    '..ow....wo..',
    '..owwwwwwo..',
    '..oooooooo..',
    '.oooooooooo.',
    '............',
  ],
  // Archaeological: dig
  archaeological: [
    '......oo....',
    '.....owwo...',
    '.oo.owwwo...',
    'oooowwwwo...',
    '.owwwwwwo...',
    '..oooooo....',
    '............',
    '..oo..oo....',
    '.owo.owo....',
    '.oo..oo.....',
    '............',
    '............',
  ],
  // Tomb
  tomb: [
    '............',
    '..oooooooo..',
    '.owwwwwwwwo.',
    '.owoooooowo.',
    '.owowwwwowo.',
    '.owowwwwowo.',
    '.owowwwwowo.',
    '.owoooooowo.',
    '.owwwwwwwwo.',
    '.oooooooooo.',
    '............',
    '............',
  ],
  // Tower
  tower: [
    '.....oo.....',
    '....oooo....',
    '...owwwwo...',
    '..oooooooo..',
    '..owowowoo..',
    '..owowowoo..',
    '..owwwwwwo..',
    '..owoowowo..',
    '..owwwwwwo..',
    '..oooooooo..',
    '.oooooooooo.',
    '............',
  ],
  // Fountain
  fountain: [
    '.....oo.....',
    '....owwo....',
    '....owwo....',
    '..oo.wo.oo..',
    '.owooowooowo',
    '.owwwwwwwwwo',
    '..oooooooo..',
    '.oooooooooo.',
    'owoooooooowo',
    'owoooooooowo',
    'oooooooooooo',
    '............',
  ],
  // Viewpoint: eye
  viewpoint: [
    '............',
    '.oooooooooo.',
    'owwwwwwwwwwo',
    'owwooooowwwo',
    'owwowwwowwwo',
    'owwowowowwwo',
    'owwowwwowwwo',
    'owwooooowwwo',
    'owwwwwwwwwwo',
    '.oooooooooo.',
    '............',
    '............',
  ],
  // Artwork: frame
  artwork: [
    'oooooooooooo',
    'owwwwwwwwwwo',
    'owooowoooowo',
    'owowwwwwoowo',
    'owowowowwowo',
    'owowowowwowo',
    'owoowwwwwowo',
    'owwowowowowo',
    'owwwwwwwwwwo',
    'oooooooooooo',
    '............',
    '............',
  ],
  // Cafe: coffee cup (from hunter-g2)
  cafe: [
    '..o..o..o...',
    '...o..o..o..',
    '..o..o..o...',
    '............',
    '.oooooooo...',
    '.owwwwwwoooo',
    '.owggggwo.ow',
    '.owggggwo.ow',
    '.owggggwoooo',
    '.owwwwwwo...',
    '..oooooo....',
    '.oooooooooo.',
  ],
  // Attraction: star
  attraction: [
    '.....oo.....',
    '....owwo....',
    '....owwo....',
    'oooowwwwoooo',
    'owwwwwwwwwwo',
    '.oowwwwwwoo.',
    '..owwwwwwo..',
    '..owwwwwwo..',
    '.oowoowoowo.',
    '.owo.oo.owo.',
    'ooo..oo..ooo',
    '............',
  ],
  // Generic pin marker (from hunter-g2)
  other: [
    '....oooo....',
    '...owwwwo...',
    '..owwwwwwo..',
    '..owwooowo..',
    '..owooowwo..',
    '..owwwwwwo..',
    '...owwwwo...',
    '....owwo....',
    '....owwo....',
    '.....oo.....',
    '.....oo.....',
    '............',
  ],
}

const COLORS: Record<string, number> = {
  '.': 0,
  'o': 34,
  'w': 255,
  'l': 238,
  'g': 136,
  'd': 85,
}

const SPRITE_W = 12
const SPRITE_H = 12
const SCALE = 6
export const ICON_IMG_W = SPRITE_W * SCALE // 72
export const ICON_IMG_H = SPRITE_H * SCALE // 72

function quantize(grey: number): number {
  const idx = Math.min(15, Math.round(grey / 17))
  return idx * 17
}

export function hasIcon(cat: PoiCategory): boolean {
  return cat in ICONS
}

export function generateIconPNG(cat: PoiCategory): number[] | null {
  try {
    const rows = ICONS[cat] ?? ICONS.other
    const rgba = new Uint8Array(ICON_IMG_W * ICON_IMG_H * 4)
    for (let row = 0; row < SPRITE_H; row++) {
      const line = rows[row] ?? ''
      for (let col = 0; col < SPRITE_W; col++) {
        const ch = line[col] ?? '.'
        const grey = quantize(COLORS[ch] ?? 0)
        for (let dy = 0; dy < SCALE; dy++) {
          for (let dx = 0; dx < SCALE; dx++) {
            const px = col * SCALE + dx
            const py = row * SCALE + dy
            const idx = (py * ICON_IMG_W + px) * 4
            rgba[idx] = grey
            rgba[idx + 1] = grey
            rgba[idx + 2] = grey
            rgba[idx + 3] = 255
          }
        }
      }
    }
    const pngBuffer = UPNG.encode([rgba.buffer], ICON_IMG_W, ICON_IMG_H, 16)
    const pngBytes = new Uint8Array(pngBuffer)
    const result: number[] = new Array(pngBytes.length)
    for (let i = 0; i < pngBytes.length; i++) result[i] = pngBytes[i]
    return result
  } catch (e) {
    console.error('generateIconPNG failed:', e)
    return null
  }
}
