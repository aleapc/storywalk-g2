// StoryWalk G2 — entry point.
// Wires up the Even Hub SDK bridge, polls the user-configured backend for
// StoryWalk snapshots, and renders the glasses screens.

import './telemetry'
import { waitForEvenAppBridge } from '@evenrealities/even_hub_sdk'
import { createRoot } from 'react-dom/client'
import { createElement } from 'react'
import { App } from './app'
import { initialState } from './state'
import type { StoryWalkState } from './state'
import { renderScreen } from './glasses/renderer'
import { setupEventHandler } from './glasses/events'
import { fetchSnapshot, applySnapshot, POLL_INTERVAL_MS } from './backend'

const state: StoryWalkState = { ...initialState, run: { ...initialState.run } }

let pollHandle: ReturnType<typeof setInterval> | null = null
let pollAbort: AbortController | null = null

function startPolling(bridge: ReturnType<typeof waitForEvenAppBridge> extends Promise<infer B> ? B : never) {
  stopPolling()
  const tick = async () => {
    if (!state.backendUrl) return
    pollAbort?.abort()
    pollAbort = new AbortController()
    const snap = await fetchSnapshot(state.backendUrl, pollAbort.signal)
    if (!snap) {
      state.backendOk = false
      renderScreen(bridge, state)
      return
    }
    const changed = applySnapshot(state, snap)
    // Keep screen in sync with mode reported from phone.
    if (state.mode !== state.screen && state.screen !== 'detail') {
      state.screen = state.mode
    }
    if (changed) {
      state.isFirstRender = false
      renderScreen(bridge, state)
    }
  }
  tick()
  pollHandle = setInterval(tick, POLL_INTERVAL_MS)
}

function stopPolling() {
  if (pollHandle) {
    clearInterval(pollHandle)
    pollHandle = null
  }
  pollAbort?.abort()
  pollAbort = null
}

async function init() {
  const bridge = await waitForEvenAppBridge()

  // Load saved backend URL
  try {
    const saved = await bridge.getLocalStorage('storywalk_backend_url')
    if (saved) state.backendUrl = saved
  } catch {
    /* ignore */
  }
  try {
    const savedLang = await bridge.getLocalStorage('storywalk_lang')
    if (savedLang === 'en' || savedLang === 'pt' || savedLang === 'es') {
      state.lang = savedLang
    }
  } catch {
    /* ignore */
  }

  // Device info
  try {
    const device = await bridge.getDeviceInfo()
    if (device?.status) {
      if (typeof device.status.batteryLevel === 'number') {
        state.batteryLevel = device.status.batteryLevel
      }
      if (typeof device.status.isWearing === 'boolean') {
        state.isWearing = device.status.isWearing
      }
    }
  } catch (err) {
    console.warn('getDeviceInfo failed:', err)
  }

  try {
    bridge.onDeviceStatusChanged((status) => {
      if (typeof status.batteryLevel === 'number') state.batteryLevel = status.batteryLevel
      if (typeof status.isWearing === 'boolean') state.isWearing = status.isWearing
    })
  } catch (err) {
    console.warn('onDeviceStatusChanged subscribe failed:', err)
  }

  setupEventHandler(bridge, state, {
    onForegroundEnter: () => {
      startPolling(bridge)
      renderScreen(bridge, state)
    },
    onForegroundExit: () => {
      stopPolling()
    },
    onTripleTap: () => {
      try {
        bridge.shutDownPageContainer(0)
      } catch (err) {
        console.warn('shutDownPageContainer failed:', err)
      }
    },
  })

  state.screen = state.mode
  renderScreen(bridge, state)
  state.isFirstRender = false

  startPolling(bridge)

  const appEl = document.getElementById('app')
  if (appEl) {
    const root = createRoot(appEl)
    root.render(createElement(App, { bridge, state }))
  }
}

init().catch(console.error)
