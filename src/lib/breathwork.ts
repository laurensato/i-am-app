export const BREATH_PHASE_MS = 4000

export const SQUARE_BREATH_PHASES = ['inhale', 'hold', 'exhale', 'hold'] as const

export type SquareBreathPhase = (typeof SQUARE_BREATH_PHASES)[number]

/** One full 4-4-4-4 square breath cycle */
export const SQUARE_BREATH_CYCLE_MS = BREATH_PHASE_MS * SQUARE_BREATH_PHASES.length

/** Minimum breath before revealing Today's Insight: inhale + hold + exhale */
export const MIN_BREATH_MS = BREATH_PHASE_MS * 3

export const GROUNDING_ROUNDS = 5

export const GROUNDING_SESSION_MS = SQUARE_BREATH_CYCLE_MS * GROUNDING_ROUNDS

export const CALMING_PHASES = [
  { label: 'inhale', durationMs: 4000 },
  { label: 'hold', durationMs: 7000 },
  { label: 'exhale', durationMs: 8000 },
] as const

export type CalmingBreathPhase = (typeof CALMING_PHASES)[number]['label']

export const CALMING_CYCLE_MS = CALMING_PHASES.reduce((sum, p) => sum + p.durationMs, 0)

export const CALMING_CYCLES = 4

export const CALMING_SESSION_MS = CALMING_CYCLE_MS * CALMING_CYCLES

export type BreathOrbPattern = 'square' | 'fourSevenEight' | 'sixTwo' | 'wellness'

export const WELLNESS_STEP_MS = 6000

export const WELLNESS_INSTRUCTIONS = [
  'Place one hand on your upper chest and one hand below your rib cage, allowing you to feel the movement of your diaphragm.',
  'Slowly inhale through your nose, feeling your stomach pressing into your hand.',
  'Keep your other hand as still as possible.',
  'Exhale using pursed lips as you tighten your abdominal muscles, keeping your upper hand completely still.',
] as const

/** 6s inhale + 6s exhale orb cycle */
export const WELLNESS_BREATH_CYCLE_MS = WELLNESS_STEP_MS * 2

export const WELLNESS_CYCLING_MS = 5 * 60 * 1000

export const WELLNESS_SESSION_MS =
  WELLNESS_INSTRUCTIONS.length * WELLNESS_STEP_MS + WELLNESS_CYCLING_MS

export const DESTRESS_INSTRUCTIONS = [
  'Lift your right hand toward your nose, pressing your first and middle finger down toward your palm and leaving your other fingers extended.',
  'After an exhale, use your right thumb to gently close your right nostril.',
  'Inhale through your left nostril and then close your left nostril with your right pinky and ring fingers.',
  'Release your thumb and exhale out through your right nostril.',
  'Inhale through your right nostril and then close this nostril.',
  'Release your fingers to open your left nostril and exhale through this side.',
  'This is one cycle. Continue this breathing pattern for up to five minutes.',
  'Finish your session with an exhale on the left side.',
] as const

export const DESTRESS_SESSION_MS =
  DESTRESS_INSTRUCTIONS.length * WELLNESS_STEP_MS + WELLNESS_CYCLING_MS

export const PEACE_INSTRUCTIONS = [
  'Choose a comfortable seated position.',
  'Close your eyes and relax your face.',
  'Place your first fingers on the tragus cartilage that partially covers your ear canal.',
  'Inhale and gently press your fingers into the cartilage as you exhale.',
  'Keeping your mouth closed, make a loud humming sound.',
] as const

export const PEACE_SESSION_MS =
  PEACE_INSTRUCTIONS.length * WELLNESS_STEP_MS + WELLNESS_CYCLING_MS

export const ENERGY_BOOST_PHASES = [
  { label: 'inhale', durationMs: 6000 },
  { label: 'exhale', durationMs: 2000 },
] as const

export const ENERGY_BOOST_CYCLE_MS = ENERGY_BOOST_PHASES.reduce((sum, p) => sum + p.durationMs, 0)

export const ENERGY_BOOST_ROUNDS = 6

export const ENERGY_BOOST_SESSION_MS = ENERGY_BOOST_CYCLE_MS * ENERGY_BOOST_ROUNDS

export function formatBreathworkDuration(ms: number): string {
  const totalSeconds = Math.round(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  if (minutes === 0) return `${seconds} sec`
  if (seconds === 0) return `${minutes} min`
  return `${minutes} min ${seconds} sec`
}
