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
