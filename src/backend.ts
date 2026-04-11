// StoryWalk G2 — Backend client.
// Polls a user-provided URL for StoryWalk snapshots posted by the mobile app.

import type { StoryWalkState, Poi, Mode } from './state'

interface SnapshotPayload {
  v: number
  mode: Mode
  now: number
  location: { lat: number; lng: number } | null
  run: {
    distanceMeters: number
    durationMs: number
    paceSecPerKm: number | null
  }
  pois: Array<{
    id: string
    name: string
    category: string
    distance: number
    summary?: string
    lat: number
    lng: number
  }>
  silentUntil: number | null
}

export async function fetchSnapshot(
  url: string,
  signal?: AbortSignal,
): Promise<SnapshotPayload | null> {
  try {
    const resp = await fetch(url, { method: 'GET', signal })
    if (!resp.ok) return null
    const contentType = resp.headers.get('content-type') ?? ''
    if (!contentType.includes('json')) return null
    const data = (await resp.json()) as SnapshotPayload
    if (!data || data.v !== 1) return null
    return data
  } catch {
    return null
  }
}

/**
 * Merge a snapshot into app state. Returns true if nearby POIs or pace changed
 * enough that the current screen should be re-rendered.
 */
export function applySnapshot(
  state: StoryWalkState,
  snap: SnapshotPayload,
): boolean {
  let changed = false

  if (snap.mode !== state.mode) {
    state.mode = snap.mode
    changed = true
  }
  if (snap.silentUntil !== state.silentUntil) {
    state.silentUntil = snap.silentUntil
    changed = true
  }

  // Run metrics — only flag change if a meaningful delta exists.
  const prev = state.run
  const nextRun = snap.run
  const paceChanged =
    Math.abs((prev.paceSecPerKm ?? 0) - (nextRun.paceSecPerKm ?? 0)) > 2
  const distChanged = Math.abs(prev.distanceMeters - nextRun.distanceMeters) > 5
  const durChanged = Math.abs(prev.durationMs - nextRun.durationMs) > 1000
  if (paceChanged || distChanged || durChanged) {
    state.run = { ...nextRun }
    changed = true
  }

  const nextPois: Poi[] = snap.pois.map((p) => ({
    id: p.id,
    name: p.name,
    category: (p.category as Poi['category']) ?? 'other',
    distance: p.distance,
    lat: p.lat,
    lng: p.lng,
    summary: p.summary,
  }))

  // Diff by id + distance threshold
  if (nextPois.length !== state.pois.length) {
    changed = true
  } else {
    for (let i = 0; i < nextPois.length; i++) {
      if (
        nextPois[i].id !== state.pois[i].id ||
        Math.abs(nextPois[i].distance - state.pois[i].distance) > 10
      ) {
        changed = true
        break
      }
    }
  }
  state.pois = nextPois
  state.backendOk = true
  state.lastSnapshotAt = Date.now()
  return changed
}

export const POLL_INTERVAL_MS = 10_000
