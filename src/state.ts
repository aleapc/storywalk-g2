// StoryWalk G2 — App state

export type Mode = 'walk' | 'run' | 'tour' | 'silent'

export type PoiCategory =
  | 'monument' | 'church' | 'museum' | 'park' | 'statue'
  | 'bridge' | 'castle' | 'ruins' | 'memorial' | 'archaeological'
  | 'tomb' | 'tower' | 'fountain' | 'viewpoint' | 'artwork'
  | 'cafe' | 'attraction' | 'other'

export interface Poi {
  id: string
  name: string
  category: PoiCategory
  distance: number
  lat: number
  lng: number
  summary?: string
}

export interface RunMetrics {
  distanceMeters: number
  durationMs: number
  paceSecPerKm: number | null
}

export type Screen = 'mode' | 'walk' | 'run' | 'tour' | 'silent' | 'detail' | 'offline'

export interface StoryWalkState {
  screen: Screen
  mode: Mode
  backendUrl: string
  pois: Poi[]
  selectedPoiIndex: number // for detail / tour rotation
  detailPage: number
  run: RunMetrics
  lastSnapshotAt: number
  silentUntil: number | null
  backendOk: boolean
  batteryLevel: number | null
  isWearing: boolean | null
  isFirstRender: boolean
  lang: 'en' | 'pt' | 'es'
}

export const initialState: StoryWalkState = {
  screen: 'walk',
  mode: 'walk',
  backendUrl: '',
  pois: [],
  selectedPoiIndex: 0,
  detailPage: 0,
  run: { distanceMeters: 0, durationMs: 0, paceSecPerKm: null },
  lastSnapshotAt: 0,
  silentUntil: null,
  backendOk: false,
  batteryLevel: null,
  isWearing: null,
  isFirstRender: true,
  lang: 'en',
}

export const MODE_CYCLE: Mode[] = ['walk', 'run', 'tour', 'silent']

export function nextMode(current: Mode): Mode {
  const i = MODE_CYCLE.indexOf(current)
  return MODE_CYCLE[(i + 1) % MODE_CYCLE.length]
}

const CATEGORY_LABELS: Record<'en' | 'pt' | 'es', Record<PoiCategory, string>> = {
  en: {
    monument: 'Monument', church: 'Church', museum: 'Museum', park: 'Park',
    statue: 'Statue', bridge: 'Bridge', castle: 'Castle', ruins: 'Ruins',
    memorial: 'Memorial', archaeological: 'Archaeology', tomb: 'Tomb',
    tower: 'Tower', fountain: 'Fountain', viewpoint: 'Viewpoint',
    artwork: 'Artwork', cafe: 'Cafe', attraction: 'Attraction', other: 'Place',
  },
  pt: {
    monument: 'Monumento', church: 'Igreja', museum: 'Museu', park: 'Parque',
    statue: 'Estatua', bridge: 'Ponte', castle: 'Castelo', ruins: 'Ruinas',
    memorial: 'Memorial', archaeological: 'Arqueologia', tomb: 'Tumulo',
    tower: 'Torre', fountain: 'Fonte', viewpoint: 'Mirante',
    artwork: 'Arte', cafe: 'Cafe', attraction: 'Atracao', other: 'Local',
  },
  es: {
    monument: 'Monumento', church: 'Iglesia', museum: 'Museo', park: 'Parque',
    statue: 'Estatua', bridge: 'Puente', castle: 'Castillo', ruins: 'Ruinas',
    memorial: 'Memorial', archaeological: 'Arqueologia', tomb: 'Tumba',
    tower: 'Torre', fountain: 'Fuente', viewpoint: 'Mirador',
    artwork: 'Arte', cafe: 'Cafe', attraction: 'Atraccion', other: 'Lugar',
  },
}

export function categoryLabel(cat: PoiCategory, lang: 'en' | 'pt' | 'es'): string {
  return CATEGORY_LABELS[lang][cat] ?? cat
}

const MODE_LABELS: Record<'en' | 'pt' | 'es', Record<Mode, string>> = {
  en: { walk: 'Walk', run: 'Run', tour: 'Tour', silent: 'Silent' },
  pt: { walk: 'Andar', run: 'Correr', tour: 'Tour', silent: 'Silenc.' },
  es: { walk: 'Andar', run: 'Correr', tour: 'Tour', silent: 'Silenc.' },
}

export function modeLabel(mode: Mode, lang: 'en' | 'pt' | 'es'): string {
  return MODE_LABELS[lang][mode] ?? mode
}
