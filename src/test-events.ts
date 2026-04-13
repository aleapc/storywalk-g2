/**
 * StoryWalk G2 — state and logic tests
 * Run: npx tsx src/test-events.ts
 */

import {
  initialState,
  nextMode,
  MODE_CYCLE,
  categoryLabel,
  modeLabel,
} from './state'
import type { StoryWalkState, Mode, PoiCategory, Screen, Poi } from './state'
import { hasIcon } from './glasses/icons'

let passed = 0
let failed = 0

function assert(condition: boolean, msg: string): void {
  if (condition) {
    passed++
    console.log(`  PASS: ${msg}`)
  } else {
    failed++
    console.error(`  FAIL: ${msg}`)
  }
}

function group(name: string, fn: () => void): void {
  console.log(`\n[${name}]`)
  fn()
}

function makeState(): StoryWalkState {
  return {
    ...initialState,
    pois: [],
    run: { ...initialState.run },
  }
}

// ─── Helpers (replicated from glasses/screens.ts for testing) ──

function formatDistance(m: number): string {
  if (m < 1000) return `${Math.round(m)}m`
  return `${(m / 1000).toFixed(1)}km`
}

function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text
  return text.slice(0, maxLen - 1) + '.'
}

// ─── State defaults ────────────────────────────────────────

group('State defaults', () => {
  const s = makeState()
  assert(s.screen === 'walk', 'Initial screen is walk')
  assert(s.mode === 'walk', 'Initial mode is walk')
  assert(s.pois.length === 0, 'POIs empty initially')
  assert(s.selectedPoiIndex === 0, 'selectedPoiIndex = 0')
  assert(s.detailPage === 0, 'detailPage = 0')
  assert(s.run.distanceMeters === 0, 'Run distance = 0')
  assert(s.run.durationMs === 0, 'Run duration = 0')
  assert(s.run.paceSecPerKm === null, 'Run pace = null')
  assert(s.lastSnapshotAt === 0, 'lastSnapshotAt = 0')
  assert(s.silentUntil === null, 'silentUntil = null')
  assert(s.backendOk === false, 'backendOk = false')
  assert(s.batteryLevel === null, 'batteryLevel = null')
  assert(s.isWearing === null, 'isWearing = null')
  assert(s.isFirstRender === true, 'isFirstRender = true')
  assert(s.lang === 'en', 'Default lang = en')
  assert(s.backendUrl === '', 'backendUrl empty')
})

// ─── Mode cycling ─────────────────────────────────────────

group('Mode cycling', () => {
  assert(nextMode('walk') === 'run', 'walk -> run')
  assert(nextMode('run') === 'tour', 'run -> tour')
  assert(nextMode('tour') === 'silent', 'tour -> silent')
  assert(nextMode('silent') === 'walk', 'silent -> walk')

  // Full cycle
  let mode: Mode = 'walk'
  const visited: Mode[] = [mode]
  for (let i = 0; i < 4; i++) {
    mode = nextMode(mode)
    visited.push(mode)
  }
  assert(visited[0] === visited[4], 'Full cycle returns to start')
  assert(MODE_CYCLE.length === 4, 'MODE_CYCLE has 4 entries')
})

// ─── Screen types ─────────────────────────────────────────

group('Screen type coverage', () => {
  const allScreens: Screen[] = ['mode', 'walk', 'run', 'tour', 'silent', 'detail', 'offline']
  const s = makeState()
  for (const screen of allScreens) {
    s.screen = screen
    assert(s.screen === screen, `Can set screen to ${screen}`)
  }
})

// ─── POI deduplication logic ──────────────────────────────

group('POI deduplication', () => {
  const pois: Poi[] = [
    { id: 'a', name: 'Place A', category: 'monument', distance: 100, lat: 0, lng: 0 },
    { id: 'b', name: 'Place B', category: 'church', distance: 200, lat: 0, lng: 0 },
    { id: 'a', name: 'Place A dup', category: 'monument', distance: 100, lat: 0, lng: 0 },
  ]

  // Deduplicate by id
  const seen = new Set<string>()
  const unique: Poi[] = []
  for (const p of pois) {
    if (!seen.has(p.id)) {
      seen.add(p.id)
      unique.push(p)
    }
  }
  assert(unique.length === 2, 'Dedup removes duplicate id')
  assert(unique[0].name === 'Place A', 'First instance kept')
})

// ─── Icon category coverage ───────────────────────────────

group('Icon category coverage', () => {
  const allCategories: PoiCategory[] = [
    'monument', 'church', 'museum', 'park', 'statue',
    'bridge', 'castle', 'ruins', 'memorial', 'archaeological',
    'tomb', 'tower', 'fountain', 'viewpoint', 'artwork',
    'cafe', 'attraction', 'other',
  ]

  for (const cat of allCategories) {
    assert(hasIcon(cat), `Icon exists for ${cat}`)
  }
  assert(allCategories.length === 18, '18 POI categories')
})

// ─── Category labels (i18n) ───────────────────────────────

group('Category labels', () => {
  const langs: Array<'en' | 'pt' | 'es'> = ['en', 'pt', 'es']
  const cats: PoiCategory[] = [
    'monument', 'church', 'museum', 'park', 'statue',
    'bridge', 'castle', 'ruins', 'memorial', 'archaeological',
    'tomb', 'tower', 'fountain', 'viewpoint', 'artwork',
    'cafe', 'attraction', 'other',
  ]

  for (const lang of langs) {
    let missing = 0
    for (const cat of cats) {
      const label = categoryLabel(cat, lang)
      if (!label || label === cat) missing++
    }
    assert(missing === 0, `${lang}: all category labels present`)
  }
})

// ─── Mode labels (i18n) ───────────────────────────────────

group('Mode labels', () => {
  const langs: Array<'en' | 'pt' | 'es'> = ['en', 'pt', 'es']
  const modes: Mode[] = ['walk', 'run', 'tour', 'silent']

  for (const lang of langs) {
    let missing = 0
    for (const mode of modes) {
      const label = modeLabel(mode, lang)
      if (!label || label === mode) missing++
    }
    assert(missing === 0, `${lang}: all mode labels present`)
  }
})

// ─── Distance formatting ─────────────────────────────────

group('formatDistance', () => {
  assert(formatDistance(0) === '0m', '0m')
  assert(formatDistance(500) === '500m', '500m')
  assert(formatDistance(999) === '999m', '999m')
  assert(formatDistance(1000) === '1.0km', '1000m = 1.0km')
  assert(formatDistance(2500) === '2.5km', '2500m = 2.5km')
  assert(formatDistance(150) === '150m', '150m')
})

// ─── Truncate helper ──────────────────────────────────────

group('Truncate helper', () => {
  assert(truncate('hello', 10) === 'hello', 'Short text unchanged')
  assert(truncate('hello world!', 6) === 'hello.', '12 chars -> 6 with .')
  assert(truncate('ab', 2) === 'ab', 'Exact length unchanged')
  assert(truncate('a very long place name', 10) === 'a very lo.', 'Truncated to 10')
})

// ─── Run metrics ──────────────────────────────────────────

group('Run metrics defaults', () => {
  const s = makeState()
  assert(s.run.distanceMeters === 0, 'Distance starts at 0')
  assert(s.run.durationMs === 0, 'Duration starts at 0')
  assert(s.run.paceSecPerKm === null, 'Pace starts null')

  // Update metrics
  s.run.distanceMeters = 5000
  s.run.durationMs = 1800000
  s.run.paceSecPerKm = 360
  assert(s.run.distanceMeters === 5000, 'Distance updated')
  assert(s.run.paceSecPerKm === 360, 'Pace updated (6 min/km)')
})

// ─── Silent mode ──────────────────────────────────────────

group('Silent mode', () => {
  const s = makeState()
  assert(s.silentUntil === null, 'Not silent initially')
  const future = Date.now() + 60000
  s.silentUntil = future
  assert(s.silentUntil === future, 'Silent until set')
  assert(s.silentUntil > Date.now(), 'Silent is in the future')
})

// ─── Summary ──────────────────────────────────────────────

console.log(`\n${'='.repeat(40)}`)
console.log(`Results: ${passed} passed, ${failed} failed`)
console.log(`${'='.repeat(40)}\n`)

process.exit(failed > 0 ? 1 : 0)
