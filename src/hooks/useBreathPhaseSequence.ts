'use client'

import { useEffect, useState } from 'react'

export type BreathPhaseStep = { label: string; durationMs: number }

export function useBreathPhaseSequence(
  active: boolean,
  sessionKey: number,
  phases: readonly BreathPhaseStep[],
  cycles: number
) {
  const [phaseLabel, setPhaseLabel] = useState(phases[0]?.label ?? '')
  const [cycle, setCycle] = useState(1)
  const [stepIndex, setStepIndex] = useState(0)

  useEffect(() => {
    if (!active) return

    let cancelled = false
    const timeouts: ReturnType<typeof setTimeout>[] = []

    const run = (step: number) => {
      if (cancelled) return
      const totalSteps = cycles * phases.length
      if (step >= totalSteps) return

      const phaseIndex = step % phases.length
      setStepIndex(step)
      setPhaseLabel(phases[phaseIndex].label)
      setCycle(Math.floor(step / phases.length) + 1)

      const t = setTimeout(() => run(step + 1), phases[phaseIndex].durationMs)
      timeouts.push(t)
    }

    run(0)
    return () => {
      cancelled = true
      timeouts.forEach(clearTimeout)
    }
  }, [active, sessionKey, phases, cycles])

  return { phaseLabel, cycle, stepIndex }
}
