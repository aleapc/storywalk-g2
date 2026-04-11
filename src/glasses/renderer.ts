// StoryWalk G2 — screen dispatcher.

import type { EvenAppBridge } from '@evenrealities/even_hub_sdk'
import type { StoryWalkState } from '../state'
import {
  renderWalk,
  renderRun,
  renderTour,
  renderSilent,
  renderDetail,
  renderOffline,
} from './screens'

export function renderScreen(bridge: EvenAppBridge, state: StoryWalkState): void {
  // If we've never heard from the phone, show the offline/setup screen.
  if (!state.backendOk && state.screen !== 'detail') {
    renderOffline(bridge, state)
    return
  }

  switch (state.screen) {
    case 'walk':
      renderWalk(bridge, state)
      break
    case 'run':
      renderRun(bridge, state)
      break
    case 'tour':
      renderTour(bridge, state)
      break
    case 'silent':
      renderSilent(bridge, state)
      break
    case 'detail':
      renderDetail(bridge, state)
      break
    case 'mode':
    case 'offline':
    default:
      renderOffline(bridge, state)
      break
  }
}
