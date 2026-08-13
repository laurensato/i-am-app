/** Find the nearest ritual insert slot for a pointer/finger position. */
export function resolveRitualDropIndex(
  clientX: number,
  container: HTMLElement | null,
): number | null {
  if (!container) return null

  const slots = container.querySelectorAll<HTMLElement>('[data-ritual-insert-slot]')
  if (slots.length === 0) return null

  let nearestIndex: number | null = null
  let nearestDistance = Infinity

  for (const slot of slots) {
    const rect = slot.getBoundingClientRect()
    const index = Number(slot.dataset.ritualInsertSlot)
    if (Number.isNaN(index)) continue

    if (clientX >= rect.left && clientX <= rect.right) {
      return index
    }

    const center = rect.left + rect.width / 2
    const distance = Math.abs(clientX - center)
    if (distance < nearestDistance) {
      nearestDistance = distance
      nearestIndex = index
    }
  }

  return nearestIndex
}

export const RITUAL_POINTER_DRAG_THRESHOLD_PX = 8

export function hasExceededDragThreshold(
  startX: number,
  startY: number,
  clientX: number,
  clientY: number,
  threshold = RITUAL_POINTER_DRAG_THRESHOLD_PX,
): boolean {
  return Math.hypot(clientX - startX, clientY - startY) > threshold
}
