// StoryWalk G2 — Phone companion UI.
// Minimal React app that lets the user set the backend URL, view current mode,
// and see the POI feed streaming in from storywalk-mobile.

import { useEffect, useState, useCallback } from 'react'
// (setInterval-based rerender removed — the POI feed already re-renders
//  reactively via state mutation; polling here was redundant.)
import type { EvenAppBridge } from '@evenrealities/even_hub_sdk'
import type { StoryWalkState } from './state'
import { modeLabel, categoryLabel } from './state'
import { renderScreen } from './glasses/renderer'

const STORAGE_KEY_BACKEND = 'storywalk_backend_url'
const STORAGE_KEY_LANG = 'storywalk_lang'

interface AppProps {
  bridge: EvenAppBridge
  state: StoryWalkState
}

export function App({ bridge, state }: AppProps) {
  const [backendUrl, setBackendUrl] = useState(state.backendUrl)
  const [lang, setLang] = useState<'en' | 'pt' | 'es'>(state.lang)

  useEffect(() => {
    ;(async () => {
      try {
        const saved = await bridge.getLocalStorage(STORAGE_KEY_BACKEND)
        if (saved) {
          setBackendUrl(saved)
          state.backendUrl = saved
        }
        const savedLang = await bridge.getLocalStorage(STORAGE_KEY_LANG)
        if (savedLang === 'en' || savedLang === 'pt' || savedLang === 'es') {
          setLang(savedLang)
          state.lang = savedLang
        }
      } catch {
        /* ignore */
      }
    })()
  }, [bridge, state])

  const saveBackend = useCallback(async () => {
    state.backendUrl = backendUrl.trim()
    try {
      await bridge.setLocalStorage(STORAGE_KEY_BACKEND, state.backendUrl)
    } catch {
      /* ignore */
    }
    renderScreen(bridge, state)
  }, [backendUrl, bridge, state])

  const setLanguage = useCallback(
    async (l: 'en' | 'pt' | 'es') => {
      setLang(l)
      state.lang = l
      try {
        await bridge.setLocalStorage(STORAGE_KEY_LANG, l)
      } catch {
        /* ignore */
      }
      renderScreen(bridge, state)
    },
    [bridge, state],
  )

  return (
    <div style={styles.root}>
      <div style={styles.container}>
        <h1 style={styles.title}>StoryWalk</h1>
        <p style={styles.subtitle}>Stories of the places around you</p>

        <div style={styles.card}>
          <div style={styles.cardHeader}>Current mode</div>
          <div style={styles.bigLabel}>{modeLabel(state.mode, state.lang)}</div>
          <div style={styles.muted}>
            Backend: {state.backendOk ? 'connected' : 'disconnected'}
          </div>
          <div style={styles.muted}>Nearby POIs: {state.pois.length}</div>
        </div>

        <div style={styles.card}>
          <div style={styles.cardHeader}>Backend URL</div>
          <input
            style={styles.input}
            value={backendUrl}
            onChange={(e) => setBackendUrl(e.target.value)}
            placeholder="https://your-backend/storywalk"
          />
          <button style={styles.btn} onClick={saveBackend}>
            Save
          </button>
        </div>

        <div style={styles.card}>
          <div style={styles.cardHeader}>Language</div>
          <div style={styles.row}>
            {(['en', 'pt', 'es'] as const).map((l) => (
              <button
                key={l}
                style={{
                  ...styles.optionBtn,
                  ...(lang === l ? styles.optionBtnActive : null),
                }}
                onClick={() => setLanguage(l)}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div style={styles.card}>
          <div style={styles.cardHeader}>Nearby</div>
          {state.pois.length === 0 ? (
            <div style={styles.muted}>No POIs yet.</div>
          ) : (
            state.pois.slice(0, 8).map((poi) => (
              <div key={poi.id} style={styles.poiRow}>
                <div style={styles.poiName}>{poi.name}</div>
                <div style={styles.poiMeta}>
                  {categoryLabel(poi.category, state.lang)} ·{' '}
                  {poi.distance < 1000
                    ? `${Math.round(poi.distance)} m`
                    : `${(poi.distance / 1000).toFixed(1)} km`}
                </div>
              </div>
            ))
          )}
        </div>

        <p style={styles.footer}>v0.1.0 — StoryWalk for Even Realities G2</p>
      </div>
    </div>
  )
}

const DARK_BG = '#0a0a0a'
const DARK_CARD = '#15161a'
const DARK_BORDER = '#2a2c33'
const TEXT = '#e6e6ea'
const MUTED = '#8a8f99'
const ACCENT = '#8adfa3'

const styles: Record<string, React.CSSProperties> = {
  root: {
    minHeight: '100vh',
    backgroundColor: DARK_BG,
    color: TEXT,
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },
  container: { maxWidth: 640, margin: '0 auto', padding: 20 },
  title: { fontSize: 28, margin: 0, fontWeight: 700 },
  subtitle: { color: MUTED, marginTop: 4, marginBottom: 20 },
  card: {
    backgroundColor: DARK_CARD,
    border: `1px solid ${DARK_BORDER}`,
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
  },
  cardHeader: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1.1,
    color: MUTED,
    marginBottom: 8,
  },
  bigLabel: { fontSize: 24, fontWeight: 700, color: ACCENT, marginBottom: 4 },
  muted: { color: MUTED, fontSize: 13, marginBottom: 4 },
  input: {
    width: '100%',
    boxSizing: 'border-box',
    backgroundColor: '#0f1013',
    border: `1px solid ${DARK_BORDER}`,
    color: TEXT,
    borderRadius: 8,
    padding: '10px 12px',
    fontSize: 14,
    marginBottom: 10,
  },
  btn: {
    backgroundColor: '#1f3a28',
    border: `1px solid ${ACCENT}`,
    color: ACCENT,
    borderRadius: 8,
    padding: '8px 14px',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
  },
  row: { display: 'flex', gap: 6 },
  optionBtn: {
    backgroundColor: '#0f1013',
    border: `1px solid ${DARK_BORDER}`,
    color: MUTED,
    borderRadius: 8,
    padding: '8px 14px',
    fontSize: 13,
    cursor: 'pointer',
  },
  optionBtnActive: {
    borderColor: ACCENT,
    color: ACCENT,
    backgroundColor: '#172219',
  },
  poiRow: { paddingTop: 8, paddingBottom: 8, borderTop: `1px solid ${DARK_BORDER}` },
  poiName: { fontSize: 14, fontWeight: 600 },
  poiMeta: { color: MUTED, fontSize: 12, marginTop: 2 },
  footer: { color: MUTED, fontSize: 11, textAlign: 'center', marginTop: 12 },
}
