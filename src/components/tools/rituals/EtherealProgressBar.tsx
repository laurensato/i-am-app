type Props = {
  completed: number
  total: number
}

export default function EtherealProgressBar({ completed, total }: Props) {
  const pct = total > 0 ? Math.min(100, (completed / total) * 100) : 0

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-medium tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>
          Today&apos;s progress
        </p>
        <p className="text-[11px] font-light tabular-nums" style={{ color: 'var(--text-muted)' }}>
          {completed} of {total}
        </p>
      </div>
      <div
        className="ritual-progress-track relative h-2.5 overflow-hidden rounded-full"
        role="progressbar"
        aria-valuenow={completed}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-label={`${completed} of ${total} ritual steps complete`}
      >
        <div
          className="ritual-progress-fill relative h-full rounded-full transition-[width] duration-700 ease-out"
          style={{ width: `${pct}%` }}
        >
          <div className="ritual-progress-shimmer absolute inset-y-0 left-0 w-1/2 rounded-full" />
        </div>
      </div>
    </div>
  )
}
