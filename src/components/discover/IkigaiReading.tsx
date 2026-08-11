'use client'

import {
  IkigaiReading as IkigaiReadingSections,
  IKIGAI_OVERLAP_READING_KEYS,
  IKIGAI_CIRCLE_GRID_KEYS,
  IKIGAI_READING_TITLES,
  ikigaiReadingSectionId,
  ikigaiReadingBackground,
  type IkigaiReadingKey,
} from '@/lib/ikigaiReading'

interface Props {
  reading: IkigaiReadingSections | null
  loading?: boolean
}

function sectionStyle(key: IkigaiReadingKey) {
  return {
    backgroundColor: ikigaiReadingBackground(key),
    border: '1px solid var(--parchment)',
    scrollMarginTop: '1.5rem',
  } as const
}

function ReadingCard({ sectionKey, text }: { sectionKey: IkigaiReadingKey; text?: string }) {
  return (
    <div id={ikigaiReadingSectionId(sectionKey)} className="p-5 h-full" style={sectionStyle(sectionKey)}>
      <p
        className="text-xs font-medium mb-3 tracking-widest uppercase"
        style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-serif)' }}
      >
        {IKIGAI_READING_TITLES[sectionKey]}
      </p>
      {text && (
        <p className="text-sm font-light leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          {text}
        </p>
      )}
    </div>
  )
}

function SkeletonCard({ sectionKey }: { sectionKey: IkigaiReadingKey }) {
  return (
    <div id={ikigaiReadingSectionId(sectionKey)} className="p-5 h-full" style={sectionStyle(sectionKey)}>
      <div className="h-3 w-20 rounded-full animate-pulse mb-3" style={{ backgroundColor: 'var(--parchment)' }} />
      <div className="h-3 w-full rounded-full animate-pulse mb-2" style={{ backgroundColor: 'var(--parchment)' }} />
      <div className="h-3 w-5/6 rounded-full animate-pulse" style={{ backgroundColor: 'var(--parchment)' }} />
    </div>
  )
}

export default function IkigaiReading({ reading, loading }: Props) {
  if (loading) {
    return (
      <div className="flex flex-col gap-5">
        {IKIGAI_OVERLAP_READING_KEYS.map(key => (
          <SkeletonCard key={key} sectionKey={key} />
        ))}
        <div className="grid grid-cols-2 gap-4">
          {IKIGAI_CIRCLE_GRID_KEYS.map(key => (
            <SkeletonCard key={key} sectionKey={key} />
          ))}
        </div>
      </div>
    )
  }

  if (!reading) return null

  return (
    <div className="flex flex-col gap-5">
      {IKIGAI_OVERLAP_READING_KEYS.map(key => (
        <ReadingCard key={key} sectionKey={key} text={reading[key]} />
      ))}
      <div className="grid grid-cols-2 gap-4">
        {IKIGAI_CIRCLE_GRID_KEYS.map(key => (
          <ReadingCard key={key} sectionKey={key} text={reading[key]} />
        ))}
      </div>
    </div>
  )
}
