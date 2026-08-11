'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Crosshair, ArrowLeft, ArrowRight } from '@phosphor-icons/react'
import { createClient } from '@/lib/supabase/client'
import { IdentityFactor, IkigaiResults } from '@/lib/types'
import SubmitButton from './SubmitButton'
import ResultCard from './ResultCard'
import IkigaiChart from './IkigaiChart'
import IkigaiReading from './IkigaiReading'

interface Props {
  factorRow: IdentityFactor
  profile: { first_name: string; age: number; gender: string } | null
  userId: string
  onComplete: () => void
}

const CIRCLES = [
  {
    id: 'love',
    key: 'What you LOVE',
    color: 'var(--chart-love)',
    bg: 'color-mix(in srgb, var(--chart-love) 8%, var(--warm-white))',
    questions: [
      { id: 'lost_time', prompt: 'Think of a time you completely lost track of time. What were you doing?', placeholder: 'e.g. Sketching characters for a story, fixing something with my hands, deep in conversation...' },
      { id: 'without_reward', prompt: 'What’s something you’d keep doing even if no one ever noticed or thanked you for it?', placeholder: 'e.g. Reorganizing spaces so they make sense, writing things down, checking on people...' },
      { id: 'before_conditioning', prompt: 'What did you gravitate toward as a kid, before anyone told you what you should like?', placeholder: 'e.g. Taking things apart, making up games, drawing maps of imaginary places...' },
      { id: 'endless_topic', prompt: 'What can you talk about for hours without getting tired?', placeholder: 'e.g. How systems work, other people’s stories, a hobby most people find niche...' },
      { id: 'most_yourself', prompt: 'When do you feel most like yourself?', placeholder: 'e.g. Alone in nature, mid-conversation with an old friend, in the middle of making something...' },
    ],
  },
  {
    id: 'good_at',
    key: 'What you’re GOOD AT',
    color: 'var(--chart-good-at)',
    bg: 'color-mix(in srgb, var(--chart-good-at) 8%, var(--warm-white))',
    questions: [
      { id: 'people_ask', prompt: 'What do people most often come to you for help with?', placeholder: 'e.g. Untangling a hard decision, fixing something broken, explaining something clearly...' },
      { id: 'learned_fast', prompt: 'What’s something you picked up faster than the people around you?', placeholder: 'e.g. A language, a software tool, reading a room...' },
      { id: 'friend_would_say', prompt: 'What would a close friend say you’re great at — something you’d never think to claim yourself?', placeholder: '“You always know what to say,” “You make hard things simple”...' },
      { id: 'repeated_compliment', prompt: 'What’s a compliment you’ve heard more than once, in different words, from different people?', placeholder: '“You’re so calm under pressure,” “You really listen”...' },
      { id: 'effortless_for_you', prompt: 'What feels almost effortless to you, even though it’s clearly hard for other people?', placeholder: 'e.g. Staying organized, holding space for someone upset, seeing the big picture...' },
    ],
  },
  {
    id: 'world_needs',
    key: 'What the WORLD NEEDS',
    color: 'var(--chart-world-needs)',
    bg: 'color-mix(in srgb, var(--chart-world-needs) 8%, var(--warm-white))',
    questions: [
      { id: 'overlooked_problem', prompt: 'What problem do you notice that most people seem to walk right past?', placeholder: 'e.g. How isolated new parents are, how confusing healthcare paperwork is...' },
      { id: 'wish_existed', prompt: 'What’s something you wish existed but doesn’t, at least not in the way it should?', placeholder: 'e.g. A simple way for neighbors to actually know each other, real mental health support at work...' },
      { id: 'pulled_to_help', prompt: 'Who do you feel most pulled to help, and with what?', placeholder: 'e.g. People starting over, kids who feel unseen, small business owners drowning in admin...' },
      { id: 'recurring_frustration', prompt: 'What frustrates you enough about how things currently work that you find yourself thinking about it often?', placeholder: 'e.g. How disposable most work feels, how disconnected people are from their food...' },
      { id: 'one_fix', prompt: 'If you could fix just one thing for the people around you, what would it be?', placeholder: 'e.g. Give them permission to slow down, make them feel truly heard...' },
    ],
  },
  {
    id: 'paid_for',
    key: 'What you can be PAID FOR',
    color: 'var(--chart-paid-for)',
    bg: 'color-mix(in srgb, var(--chart-paid-for) 8%, var(--warm-white))',
    questions: [
      { id: 'actually_paid', prompt: 'What have you actually been paid, hired, or meaningfully compensated for so far?', placeholder: 'e.g. Managing a team, designing a logo, tutoring, running events...' },
      { id: 'offered_payment', prompt: 'What has someone offered to pay you for, even if you turned it down or never followed through?', placeholder: 'e.g. Fixing their website, coaching them through a decision, writing their bio...' },
      { id: 'others_rely_on', prompt: 'What skill of yours do others rely on to actually get something done?', placeholder: 'e.g. Keeping a project on track, translating jargon into plain language...' },
      { id: 'freelance_tomorrow', prompt: 'If you had to earn money with one ability starting tomorrow, what would you use?', placeholder: 'e.g. Writing, organizing chaos into systems, teaching a skill I already have...' },
      { id: 'couldnt_without_you', prompt: 'Describe a time someone said, in some form, “I couldn’t have done this without you.” What had you done?', placeholder: 'e.g. Held the whole project together while everyone else focused on their piece...' },
    ],
  },
] as const

type CircleId = typeof CIRCLES[number]['id']
type Phase = 'intro' | 'quiz' | 'loading' | 'results'

export default function IkigaiFlow({ profile, userId, onComplete }: Props) {
  const [phase, setPhase] = useState<Phase>('intro')
  const [circleIndex, setCircleIndex] = useState(0)
  const [questionIndex, setQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<CircleId, Record<string, string>>>(
    Object.fromEntries(CIRCLES.map(c => [c.id, Object.fromEntries(c.questions.map(q => [q.id, '']))])) as Record<CircleId, Record<string, string>>
  )
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<IkigaiResults | null>(null)
  const supabase = createClient()

  const circle = CIRCLES[circleIndex]
  const question = circle.questions[questionIndex]
  const isLastQuestionInCircle = questionIndex === circle.questions.length - 1
  const isLastCircle = circleIndex === CIRCLES.length - 1

  function setAnswer(value: string) {
    setAnswers({ ...answers, [circle.id]: { ...answers[circle.id], [question.id]: value } })
  }

  function nextQuestion() {
    if (!isLastQuestionInCircle) {
      setQuestionIndex(questionIndex + 1)
    } else if (!isLastCircle) {
      setCircleIndex(circleIndex + 1)
      setQuestionIndex(0)
    } else {
      submitAnswers()
    }
  }

  function prevQuestion() {
    if (questionIndex > 0) {
      setQuestionIndex(questionIndex - 1)
    } else if (circleIndex > 0) {
      setCircleIndex(circleIndex - 1)
      setQuestionIndex(CIRCLES[circleIndex - 1].questions.length - 1)
    }
  }

  async function submitAnswers() {
    setLoading(true)
    setPhase('loading')
    const payload = Object.fromEntries(
      CIRCLES.map(c => [c.id, c.questions.map(q => ({ question: q.prompt, answer: answers[c.id][q.id] }))])
    )
    const res = await fetch('/api/discover', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ factor: 'ikigai', data: payload, profile }),
    })
    const data = await res.json()
    setResults(data.results)

    await supabase.from('identity_factors').update({
      discovery_completed: true,
      discovery_data: payload,
      results: data.results,
    }).eq('user_id', userId).eq('factor_type', 'ikigai')

    setLoading(false)
    setPhase('results')
  }

  if (phase === 'loading') {
    return (
      <div className="text-center py-20">
        <div className="mb-6 inline-block" style={{ color: 'var(--text-muted)' }}><Crosshair size={48} weight="thin" /></div>
        <p className="font-light" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-serif)' }}>
          Finding your center...
        </p>
      </div>
    )
  }

  if (phase === 'results' && results) {
    return (
      <ResultCard title="Your Ikigai" onContinue={onComplete}>
        <div className="text-center mb-8 p-6"
          style={{ backgroundColor: 'var(--selected-bg)', border: '1px solid var(--parchment)' }}>
          <p className="text-xs font-medium mb-3 tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>
            Your Reason for Being
          </p>
          <p className="text-lg font-normal leading-relaxed"
            style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-primary)' }}>
            &ldquo;{results.ikigai_statement}&rdquo;
          </p>
        </div>
        <IkigaiChart size={320} linkToReading />
        <IkigaiReading reading={results.reading ?? null} />
      </ResultCard>
    )
  }

  if (phase === 'intro') {
    return (
      <motion.div className="flex flex-col gap-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div>
          <h2 className="text-2xl font-normal mb-4" style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-primary)' }}>
            Finding Your Ikigai
          </h2>
          <p className="text-sm leading-relaxed font-light mb-4" style={{ color: 'var(--text-muted)' }}>
            Ikigai (生き甲斐) is a Japanese concept meaning &ldquo;reason for being.&rdquo; It lives at the intersection
            of four things: what you love, what you&apos;re good at, what the world needs, and what you can be paid for.
          </p>
          <div className="grid grid-cols-2 gap-3 mb-4">
            {CIRCLES.map(c => (
              <div key={c.id} className="p-3 text-center"
                style={{ backgroundColor: c.bg }}>
                <p className="text-xs font-medium" style={{ color: c.color }}>{c.key}</p>
              </div>
            ))}
          </div>
          <p className="text-sm font-light" style={{ color: 'var(--text-muted)' }}>
            Most people can&apos;t just name these four things off the top of their head — so instead of asking
            you to, we&apos;ll walk through a few grounded questions for each circle. Answer from memory and
            instinct, not from what you think you&apos;re supposed to say. A sentence or two is plenty.
          </p>
        </div>
        <motion.button
          onClick={() => setPhase('quiz')}
          className="w-full py-4 font-medium text-base"
          style={{ backgroundColor: 'var(--cta-bg)', color: 'var(--cta-text)' }}
          whileHover={{ opacity: 0.85 }} whileTap={{ scale: 0.98 }}>
          Begin
        </motion.button>
      </motion.div>
    )
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div key={`${circleIndex}-${questionIndex}`} className="flex flex-col gap-6"
        initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
        transition={{ duration: 0.25 }}>

        <div className="flex gap-1 mb-2">
          {CIRCLES.map((c, i) => {
            const filled = i < circleIndex ? 100 : i === circleIndex ? ((questionIndex + 1) / c.questions.length) * 100 : 0
            return (
              <div key={c.id} className="flex-1 h-1 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--parchment)' }}>
                <motion.div className="h-full rounded-full" style={{ backgroundColor: c.color }}
                  animate={{ width: `${filled}%` }} transition={{ duration: 0.25 }} />
              </div>
            )
          })}
        </div>

        <div className="p-4" style={{ backgroundColor: circle.bg }}>
          <div className="flex items-baseline justify-between mb-2">
            <p className="font-normal text-lg" style={{ color: circle.color, fontFamily: 'var(--font-serif)' }}>
              {circle.key}
            </p>
            <p className="text-xs font-medium shrink-0 ml-3" style={{ color: circle.color }}>
              {questionIndex + 1} of {circle.questions.length}
            </p>
          </div>
          <p className="text-sm font-light" style={{ color: 'var(--text-secondary)' }}>{question.prompt}</p>
        </div>

        <textarea
          rows={3}
          placeholder={question.placeholder}
          value={answers[circle.id][question.id]}
          onChange={e => setAnswer(e.target.value)}
          className="w-full px-4 py-3 border outline-none text-base resize-none"
          style={{ borderColor: 'var(--parchment)', backgroundColor: 'var(--warm-white)', color: 'var(--text-primary)' }}
        />
        <p className="text-xs -mt-4" style={{ color: 'var(--text-muted)' }}>
          Whatever comes to mind first is usually right — no need to polish it.
        </p>

        <SubmitButton
          onClick={nextQuestion}
          loading={loading}
          disabled={!answers[circle.id][question.id].trim()}>
          {isLastQuestionInCircle && isLastCircle
            ? 'Find My Ikigai'
            : isLastQuestionInCircle
              ? <span className="flex items-center justify-center gap-2">Next: {CIRCLES[circleIndex + 1].key} <ArrowRight size={16} weight="regular" /></span>
              : 'Next'}
        </SubmitButton>

        {(circleIndex > 0 || questionIndex > 0) && (
          <button onClick={prevQuestion}
            className="text-sm font-light text-center" style={{ color: 'var(--text-muted)' }}>
            <span className="flex items-center justify-center gap-1"><ArrowLeft size={14} weight="regular" /> Back</span>
          </button>
        )}
      </motion.div>
    </AnimatePresence>
  )
}
