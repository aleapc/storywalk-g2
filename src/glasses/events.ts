// StoryWalk G2 — event handler with SDK quirk workarounds:
// - sysEvent/textEvent/listEvent/jsonData fallback (real hw uses sysEvent)
// - eventType 0 (CLICK) normalized from undefined/null
// - 300ms scroll cooldown
// - lifecycle pause/resume callbacks

import type { EvenAppBridge, EvenHubEvent } from '@evenrealities/even_hub_sdk'
import type { StoryWalkState } from '../state'
import { nextMode } from '../state'
import { renderScreen } from './renderer'
import { totalDetailPages } from './screens'

const SCROLL_COOLDOWN = 300
let lastEventTime = 0

// OsEventTypeList enum values from SDK
const EVT_CLICK = 0
const EVT_SCROLL_TOP = 1
const EVT_SCROLL_BOTTOM = 2
const EVT_DOUBLE_CLICK = 3
const EVT_FOREGROUND_ENTER = 4
const EVT_FOREGROUND_EXIT = 5

type ParsedAction =
  | 'click'
  | 'doubleClick'
  | 'scrollUp'
  | 'scrollDown'
  | 'foregroundEnter'
  | 'foregroundExit'
  | 'unknown'

function normalizeEventType(raw: unknown): number {
  if (raw === undefined || raw === null) return 0
  if (typeof raw === 'number') return raw
  if (typeof raw === 'string') {
    const n = parseInt(raw, 10)
    if (!Number.isNaN(n)) return n
    if (raw === 'FOREGROUND_ENTER_EVENT' || raw === 'FOREGROUND_ENTER') return EVT_FOREGROUND_ENTER
    if (raw === 'FOREGROUND_EXIT_EVENT' || raw === 'FOREGROUND_EXIT') return EVT_FOREGROUND_EXIT
    return 0
  }
  return -1
}

function toAction(n: number): ParsedAction {
  if (n === EVT_DOUBLE_CLICK) return 'doubleClick'
  if (n === EVT_CLICK) return 'click'
  if (n === EVT_SCROLL_TOP) return 'scrollUp'
  if (n === EVT_SCROLL_BOTTOM) return 'scrollDown'
  if (n === EVT_FOREGROUND_ENTER) return 'foregroundEnter'
  if (n === EVT_FOREGROUND_EXIT) return 'foregroundExit'
  return 'unknown'
}

function parseEvent(event: EvenHubEvent): ParsedAction {
  const e = event as unknown as Record<string, unknown>
  for (const key of ['listEvent', 'sysEvent', 'textEvent', 'jsonData']) {
    const sub = e[key] as Record<string, unknown> | undefined
    if (!sub || typeof sub !== 'object') continue
    const n = normalizeEventType(sub.eventType)
    if (n < 0 || n > 5) continue
    const a = toAction(n)
    if (a !== 'unknown') return a
  }
  return 'unknown'
}

export interface EventCallbacks {
  onForegroundEnter?: () => void
  onForegroundExit?: () => void
  onTripleTap?: () => void
}

const TRIPLE_TAP_WINDOW = 800
let tapTimestamps: number[] = []

export function setupEventHandler(
  bridge: EvenAppBridge,
  state: StoryWalkState,
  cbs: EventCallbacks = {},
): void {
  bridge.onEvenHubEvent((event: EvenHubEvent) => {
    const action = parseEvent(event)
    if (action === 'unknown') return

    // Lifecycle events bypass the cooldown.
    if (action === 'foregroundEnter') {
      cbs.onForegroundEnter?.()
      return
    }
    if (action === 'foregroundExit') {
      cbs.onForegroundExit?.()
      return
    }

    const now = Date.now()
    if (now - lastEventTime < SCROLL_COOLDOWN) return
    lastEventTime = now

    if (action === 'click') {
      tapTimestamps.push(now)
      tapTimestamps = tapTimestamps.filter((t) => now - t <= TRIPLE_TAP_WINDOW)
      if (tapTimestamps.length >= 3) {
        tapTimestamps = []
        cbs.onTripleTap?.()
        return
      }
    } else {
      tapTimestamps = []
    }

    handleAction(bridge, state, action)
  })
}

function handleAction(
  bridge: EvenAppBridge,
  state: StoryWalkState,
  action: ParsedAction,
): void {
  // Double-tap cycles mode in all non-detail screens, returns from detail.
  if (action === 'doubleClick') {
    if (state.screen === 'detail') {
      state.screen = state.mode
      state.detailPage = 0
    } else {
      state.mode = nextMode(state.mode)
      state.screen = state.mode
      state.selectedPoiIndex = 0
      state.detailPage = 0
    }
    state.isFirstRender = false
    renderScreen(bridge, state)
    return
  }

  switch (state.screen) {
    case 'walk':
      if (action === 'click') {
        if (state.pois.length > 0) {
          state.selectedPoiIndex = 0
          state.detailPage = 0
          state.screen = 'detail'
        }
      }
      break

    case 'tour':
      if (action === 'click') {
        if (state.pois.length > 0) {
          state.detailPage = 0
          state.screen = 'detail'
        }
      } else if (action === 'scrollDown') {
        if (state.pois.length > 0) {
          state.selectedPoiIndex = (state.selectedPoiIndex + 1) % state.pois.length
        }
      } else if (action === 'scrollUp') {
        if (state.pois.length > 0) {
          state.selectedPoiIndex =
            (state.selectedPoiIndex - 1 + state.pois.length) % state.pois.length
        }
      }
      break

    case 'run':
    case 'silent':
      // No per-screen interactions besides mode cycle.
      break

    case 'detail': {
      const poi = state.pois[state.selectedPoiIndex]
      if (!poi) {
        state.screen = state.mode
        break
      }
      const pages = totalDetailPages(poi)
      if (action === 'click') {
        if (state.detailPage < pages - 1) {
          state.detailPage += 1
        } else {
          // Advance to the next POI if available, else back to mode screen.
          if (state.selectedPoiIndex < state.pois.length - 1) {
            state.selectedPoiIndex += 1
            state.detailPage = 0
          } else {
            state.screen = state.mode
            state.detailPage = 0
          }
        }
      } else if (action === 'scrollDown') {
        if (state.detailPage < pages - 1) state.detailPage += 1
        else if (state.selectedPoiIndex < state.pois.length - 1) {
          state.selectedPoiIndex += 1
          state.detailPage = 0
        }
      } else if (action === 'scrollUp') {
        if (state.detailPage > 0) state.detailPage -= 1
        else if (state.selectedPoiIndex > 0) {
          state.selectedPoiIndex -= 1
          state.detailPage = 0
        }
      }
      break
    }
  }

  state.isFirstRender = false
  renderScreen(bridge, state)
}
