import { Origin, Horoscope } from 'circular-natal-horoscope-js'

export interface ChartPlanet {
  key: string
  label: string
  sign: string
  degree: number
  retrograde: boolean
  house: number
}

export interface ChartHouse {
  id: number
  sign: string
  degree: number
}

export interface ChartAspect {
  point1: string
  point2: string
  type: string
  orb: number
}

export interface NatalChart {
  sunSign: string
  moonSign: string
  risingSign: string
  ascendant: { sign: string; degree: number }
  midheaven: { sign: string; degree: number }
  planets: ChartPlanet[]
  houses: ChartHouse[]
  aspects: ChartAspect[]
  houseSystem: string
  timeUnknown: boolean
}

const PLANET_KEYS = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto']

export async function geocodeBirthPlace(place: string): Promise<{ lat: number; lon: number } | null> {
  if (!place?.trim()) return null
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(place)}&format=json&limit=1`
  const res = await fetch(url, {
    headers: { 'User-Agent': 'IAmApp/1.0 (self-discovery app)' },
  })
  if (!res.ok) return null
  const results = await res.json()
  const first = Array.isArray(results) ? results[0] : null
  if (!first) return null
  return { lat: parseFloat(first.lat), lon: parseFloat(first.lon) }
}

export function computeNatalChart(params: {
  birthDate: string
  birthTime?: string
  lat: number
  lon: number
}): NatalChart {
  const [year, month, date] = params.birthDate.split('-').map(Number)
  const timeUnknown = !params.birthTime
  const [hour, minute] = timeUnknown ? [12, 0] : params.birthTime!.split(':').map(Number)

  const origin = new Origin({
    year,
    month: month - 1, // library is 0-indexed (0 = January)
    date,
    hour,
    minute,
    latitude: params.lat,
    longitude: params.lon,
  })

  const horoscope = new Horoscope({
    origin,
    houseSystem: 'placidus',
    zodiac: 'tropical',
    aspectPoints: ['bodies', 'angles'],
    aspectWithPoints: ['bodies', 'angles'],
    aspectTypes: ['major'],
    language: 'en',
  })

  const planets: ChartPlanet[] = PLANET_KEYS.map(key => {
    const body = horoscope.CelestialBodies[key]
    return {
      key,
      label: body.label,
      sign: body.Sign.label,
      degree: body.ChartPosition.Ecliptic.DecimalDegrees,
      retrograde: body.isRetrograde,
      house: body.House.id,
    }
  })

  const houses: ChartHouse[] = horoscope.Houses.map((h: { id: number; Sign: { label: string }; ChartPosition: { StartPosition: { Ecliptic: { DecimalDegrees: number } } } }) => ({
    id: h.id,
    sign: h.Sign.label,
    degree: h.ChartPosition.StartPosition.Ecliptic.DecimalDegrees,
  }))

  const aspects: ChartAspect[] = horoscope.Aspects.all
    .filter((a: { point1Key: string; point2Key: string }) => PLANET_KEYS.includes(a.point1Key) && PLANET_KEYS.includes(a.point2Key))
    .map((a: { point1Key: string; point2Key: string; aspectKey: string; orb: number }) => ({
      point1: a.point1Key,
      point2: a.point2Key,
      type: a.aspectKey,
      orb: Math.round(a.orb * 100) / 100,
    }))

  const sun = planets.find(p => p.key === 'sun')!
  const moon = planets.find(p => p.key === 'moon')!

  return {
    sunSign: sun.sign,
    moonSign: moon.sign,
    risingSign: horoscope.Ascendant.Sign.label,
    ascendant: { sign: horoscope.Ascendant.Sign.label, degree: horoscope.Ascendant.ChartPosition.Ecliptic.DecimalDegrees },
    midheaven: { sign: horoscope.Midheaven.Sign.label, degree: horoscope.Midheaven.ChartPosition.Ecliptic.DecimalDegrees },
    planets,
    houses,
    aspects,
    houseSystem: 'placidus',
    timeUnknown,
  }
}

// Where the sky actually is right now — planet-in-sign position doesn't depend on the
// observer's location, so any fixed lat/lon works for computing today's transiting planets.
export function computeTransitingPlanets(date: Date = new Date()): ChartPlanet[] {
  const iso = date.toISOString().split('T')[0]
  return computeNatalChart({ birthDate: iso, birthTime: '12:00', lat: 0, lon: 0 }).planets
}

export interface TransitAspect {
  transitPlanet: string
  natalPlanet: string
  aspect: string
  orb: number
}

const ASPECT_ANGLES: { name: string; angle: number; orb: number }[] = [
  { name: 'conjunct', angle: 0, orb: 6 },
  { name: 'sextile', angle: 60, orb: 4 },
  { name: 'square', angle: 90, orb: 6 },
  { name: 'trine', angle: 120, orb: 6 },
  { name: 'opposite', angle: 180, orb: 6 },
]

function angleDiff(a: number, b: number): number {
  const diff = Math.abs(a - b) % 360
  return diff > 180 ? 360 - diff : diff
}

// Fast-moving bodies only (Sun through Mars) — these are what actually change day to day.
// Outer-planet transits last months to years and don't belong in a "today" reading.
const FAST_TRANSIT_KEYS = ['sun', 'moon', 'mercury', 'venus', 'mars']

export function computeTransitAspects(transiting: ChartPlanet[], natal: ChartPlanet[]): TransitAspect[] {
  const hits: TransitAspect[] = []
  for (const t of transiting) {
    if (!FAST_TRANSIT_KEYS.includes(t.key)) continue
    for (const n of natal) {
      const diff = angleDiff(t.degree, n.degree)
      for (const a of ASPECT_ANGLES) {
        const orb = Math.abs(diff - a.angle)
        if (orb <= a.orb) {
          hits.push({ transitPlanet: t.label, natalPlanet: n.label, aspect: a.name, orb: Math.round(orb * 100) / 100 })
        }
      }
    }
  }
  return hits.sort((a, b) => a.orb - b.orb)
}

const ZODIAC_ORDER = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces']
const WHOLE_SIGN_ASPECT_NAMES: Record<number, string> = { 0: 'conjunct', 2: 'sextile', 3: 'square', 4: 'trine', 6: 'opposite' }

// Whole-sign approximation for people without a full natal chart (no birth time/location on
// file) — coarser than real degree-based aspects, but still grounded in a real sign relationship
// rather than an invented one.
export function wholeSignAspect(signA: string, signB: string): string | null {
  const a = ZODIAC_ORDER.findIndex(s => s.toLowerCase() === signA?.toLowerCase())
  const b = ZODIAC_ORDER.findIndex(s => s.toLowerCase() === signB?.toLowerCase())
  if (a === -1 || b === -1) return null
  const dist = Math.min(Math.abs(a - b), 12 - Math.abs(a - b))
  return WHOLE_SIGN_ASPECT_NAMES[dist] ?? null
}
