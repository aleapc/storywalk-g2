// StoryWalk G2 — glasses rendering. One function per screen.

import type { EvenAppBridge } from '@evenrealities/even_hub_sdk'
import {
  TextContainerProperty,
  ImageContainerProperty,
  ImageRawDataUpdate,
  CreateStartUpPageContainer,
  RebuildPageContainer,
} from '@evenrealities/even_hub_sdk'
import type { StoryWalkState, Poi } from '../state'
import { categoryLabel, modeLabel } from '../state'
import * as L from './layout'
import { generateIconPNG, hasIcon, ICON_IMG_W, ICON_IMG_H } from './icons'

// ---- Helpers --------------------------------------------------------------

function sendPage(
  bridge: EvenAppBridge,
  isFirst: boolean,
  opts: {
    textObject?: TextContainerProperty[]
    imageObject?: ImageContainerProperty[]
  },
): void {
  const totalNum = (opts.textObject?.length ?? 0) + (opts.imageObject?.length ?? 0)
  if (isFirst) {
    bridge.createStartUpPageContainer(
      new CreateStartUpPageContainer({
        containerTotalNum: totalNum,
        textObject: opts.textObject,
        imageObject: opts.imageObject,
      }),
    )
  } else {
    bridge.rebuildPageContainer(
      new RebuildPageContainer({
        containerTotalNum: totalNum,
        textObject: opts.textObject,
        imageObject: opts.imageObject,
      }),
    )
  }
}

function fullText(content: string, name: string): TextContainerProperty {
  return new TextContainerProperty({
    xPosition: L.PADDING,
    yPosition: 0,
    width: L.DISPLAY_WIDTH - L.PADDING * 2,
    height: L.DISPLAY_HEIGHT,
    borderWidth: 1,
    borderColor: 8,
    borderRadius: 4,
    paddingLength: 8,
    containerID: 0,
    containerName: name,
    content,
    isEventCapture: 1,
  })
}

function formatDistance(m: number): string {
  if (m < 1000) return `${Math.round(m)}m`
  return `${(m / 1000).toFixed(1)}km`
}

function formatPace(secPerKm: number | null): string {
  if (secPerKm == null || secPerKm <= 0) return '--:--'
  const mins = Math.floor(secPerKm / 60)
  const secs = Math.round(secPerKm % 60)
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`)
  return `${pad(mins)}:${pad(secs)}`
}

function formatDuration(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`)
  if (h > 0) return `${h}:${pad(m)}:${pad(s)}`
  return `${pad(m)}:${pad(s)}`
}

// ---- Screens --------------------------------------------------------------

let detailImageBusy = false

/**
 * Walk mode — nearest POI card with icon.
 * Uses the proven 3-step image flow: dummy first page, rebuild with container,
 * delay, then push image bytes.
 */
export async function renderWalk(
  bridge: EvenAppBridge,
  state: StoryWalkState,
): Promise<void> {
  if (state.pois.length === 0) {
    sendPage(bridge, state.isFirstRender, {
      textObject: [
        fullText(
          `\n  StoryWalk\n\n  ${modeLabel('walk', state.lang)}\n\n  No nearby places yet`,
          'walk-empty',
        ),
      ],
    })
    return
  }

  const poi = state.pois[0]
  const label = categoryLabel(poi.category, state.lang)
  const battery =
    state.batteryLevel != null
      ? state.batteryLevel < 15
        ? `  [!${state.batteryLevel}%]`
        : `  [${state.batteryLevel}%]`
      : ''

  const lines = [
    `STORYWALK  ${modeLabel(state.mode, state.lang)}${battery}`,
    '',
    poi.name.length > 22 ? poi.name.slice(0, 21) + '.' : poi.name,
    `${label}  ${formatDistance(poi.distance)}`,
    '',
    `Next ${state.pois.length - 1} nearby`,
    '',
    'Tap = read  2x = mode',
  ]

  const iconBytes = hasIcon(poi.category) ? generateIconPNG(poi.category) : null

  if (iconBytes && iconBytes.length > 0 && !detailImageBusy) {
    detailImageBusy = true
    try {
      if (state.isFirstRender) {
        sendPage(bridge, true, {
          textObject: [fullText('  StoryWalk', 'dummy')],
        })
        await new Promise((r) => setTimeout(r, 100))
      }
      const imgX = L.PADDING + 8
      const imgY = Math.floor((L.DISPLAY_HEIGHT - ICON_IMG_H) / 2)
      const textX = imgX + ICON_IMG_W + 16
      const textW = L.DISPLAY_WIDTH - textX - L.PADDING

      const text = new TextContainerProperty({
        xPosition: textX,
        yPosition: L.PADDING,
        width: textW,
        height: L.DISPLAY_HEIGHT - L.PADDING * 2,
        borderWidth: 1,
        borderColor: 8,
        borderRadius: 4,
        paddingLength: 6,
        containerID: 0,
        containerName: 'walk',
        content: lines.join('\n'),
        isEventCapture: 1,
      })

      const image = new ImageContainerProperty({
        xPosition: imgX,
        yPosition: imgY,
        width: ICON_IMG_W,
        height: ICON_IMG_H,
        containerID: 1,
        containerName: 'icon',
      })

      sendPage(bridge, false, { textObject: [text], imageObject: [image] })
      await new Promise((r) => setTimeout(r, 100))

      try {
        await bridge.updateImageRawData(
          new ImageRawDataUpdate({
            containerID: 1,
            containerName: 'icon',
            imageData: iconBytes,
          }),
        )
      } catch (e) {
        console.error('updateImageRawData failed:', e)
        sendPage(bridge, false, { textObject: [fullText(lines.join('\n'), 'walk')] })
      }
    } finally {
      detailImageBusy = false
    }
    return
  }

  sendPage(bridge, state.isFirstRender, {
    textObject: [fullText(lines.join('\n'), 'walk')],
  })
}

/**
 * Run mode — big pace/distance/duration overlay.
 * Rebuild-only on change (no image).
 */
export function renderRun(bridge: EvenAppBridge, state: StoryWalkState): void {
  const run = state.run
  const lines = [
    `STORYWALK  ${modeLabel('run', state.lang)}`,
    '',
    `  ${formatPace(run.paceSecPerKm)} / km`,
    '',
    `  ${formatDistance(run.distanceMeters)}`,
    `  ${formatDuration(run.durationMs)}`,
    '',
    '2x = mode',
  ]
  sendPage(bridge, state.isFirstRender, {
    textObject: [fullText(lines.join('\n'), 'run')],
  })
}

/**
 * Tour mode — rotating card showing the POI at state.selectedPoiIndex.
 */
export function renderTour(bridge: EvenAppBridge, state: StoryWalkState): void {
  if (state.pois.length === 0) {
    sendPage(bridge, state.isFirstRender, {
      textObject: [fullText('\n  Tour\n\n  No POIs in range', 'tour')],
    })
    return
  }
  const idx = state.selectedPoiIndex % state.pois.length
  const poi = state.pois[idx]
  const label = categoryLabel(poi.category, state.lang)
  const lines = [
    `TOUR  ${idx + 1}/${state.pois.length}`,
    '',
    poi.name.length > 28 ? poi.name.slice(0, 27) + '.' : poi.name,
    `${label}  ${formatDistance(poi.distance)}`,
    '',
    poi.summary ? (poi.summary.slice(0, 90) + (poi.summary.length > 90 ? '...' : '')) : '(no summary yet)',
    '',
    'Tap = read',
  ]
  sendPage(bridge, state.isFirstRender, {
    textObject: [fullText(lines.join('\n'), 'tour')],
  })
}

export function renderSilent(bridge: EvenAppBridge, state: StoryWalkState): void {
  const remaining =
    state.silentUntil != null
      ? Math.max(0, Math.round((state.silentUntil - Date.now()) / 60000))
      : null
  const msg = remaining != null ? `Silent for ${remaining} min` : 'Silent mode'
  const lines = ['STORYWALK', '', '', `  ${msg}`, '', '', '2x = mode']
  sendPage(bridge, state.isFirstRender, {
    textObject: [fullText(lines.join('\n'), 'silent')],
  })
}

export function renderOffline(bridge: EvenAppBridge, state: StoryWalkState): void {
  const lines = [
    'STORYWALK',
    '',
    '  Waiting for phone...',
    '',
    state.backendUrl ? `  ${state.backendUrl}` : '  Set backend URL on phone',
    '',
    '2x = mode',
  ]
  sendPage(bridge, state.isFirstRender, {
    textObject: [fullText(lines.join('\n'), 'offline')],
  })
}

// ---- Detail (paginated) ----------------------------------------------------

const LINES_PER_PAGE = 5
const CHARS_PER_LINE = 48

function paginateSummary(text: string): string[][] {
  // Word-wrap then group into pages of LINES_PER_PAGE lines.
  const words = text.split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let current = ''
  for (const w of words) {
    if (!current) {
      current = w
    } else if ((current + ' ' + w).length <= CHARS_PER_LINE) {
      current += ' ' + w
    } else {
      lines.push(current)
      current = w
    }
  }
  if (current) lines.push(current)
  const pages: string[][] = []
  for (let i = 0; i < lines.length; i += LINES_PER_PAGE) {
    pages.push(lines.slice(i, i + LINES_PER_PAGE))
  }
  if (pages.length === 0) pages.push(['(no summary)'])
  return pages
}

export function totalDetailPages(poi: Poi): number {
  return paginateSummary(poi.summary ?? '').length
}

export function renderDetail(bridge: EvenAppBridge, state: StoryWalkState): void {
  const poi = state.pois[state.selectedPoiIndex]
  if (!poi) {
    sendPage(bridge, state.isFirstRender, {
      textObject: [fullText('\n  (no POI)', 'detail')],
    })
    return
  }
  const pages = paginateSummary(poi.summary ?? '(no summary)')
  const pageIdx = Math.min(state.detailPage, pages.length - 1)
  const label = categoryLabel(poi.category, state.lang)
  const header = `${poi.name.length > 30 ? poi.name.slice(0, 29) + '.' : poi.name}`
  const meta = `${label}  ${formatDistance(poi.distance)}  p${pageIdx + 1}/${pages.length}`
  const body = pages[pageIdx].join('\n')
  const lines = [header, meta, '', body, '', 'Tap=next  2x=back']
  sendPage(bridge, state.isFirstRender, {
    textObject: [fullText(lines.join('\n'), 'detail')],
  })
}
