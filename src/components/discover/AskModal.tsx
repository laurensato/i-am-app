'use client'
import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CompassRose, X, PaperPlaneRight } from '@phosphor-icons/react'
import { FactorType, FACTOR_META } from '@/lib/types'

interface Message { role: 'user' | 'assistant'; content: string }

interface Props {
  factor: FactorType
  results: unknown
  profile: { first_name: string; age: number; gender: string } | null
}

export default function AskModal({ factor, results, profile }: Props) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const meta = FACTOR_META[factor]
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, loading])

  async function send() {
    const question = input.trim()
    if (!question || loading) return
    const nextMessages = [...messages, { role: 'user' as const, content: question }]
    setMessages(nextMessages)
    setInput('')
    setLoading(true)
    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ factor, results, profile, question, history: messages }),
      })
      const data = await res.json()
      setMessages([...nextMessages, { role: 'assistant', content: data.answer ?? "I'm not sure — could you try asking that a different way?" }])
    } catch {
      setMessages([...nextMessages, { role: 'assistant', content: 'Something went wrong. Try again in a moment.' }])
    }
    setLoading(false)
  }

  return (
    <>
      <motion.button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full flex items-center justify-center text-white z-40"
        style={{ background: 'linear-gradient(135deg, var(--terracotta), var(--rust))', boxShadow: '0 4px 16px rgba(0,0,0,0.25)' }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Ask a question about this reading"
      >
        <CompassRose size={24} weight="regular" />
      </motion.button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="fixed inset-0 z-40"
              style={{ backgroundColor: 'rgba(28,46,34,0.4)' }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />
            <motion.div
              className="fixed bottom-0 left-0 right-0 z-50 mx-auto max-w-lg rounded-t-3xl flex flex-col"
              style={{ backgroundColor: 'var(--warm-white)', height: 'min(80vh, 640px)' }}
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            >
              <div className="flex items-center justify-between px-6 py-4 border-b shrink-0" style={{ borderColor: 'var(--parchment)' }}>
                <p className="font-normal" style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-primary)' }}>
                  Ask about your {meta.label}
                </p>
                <button onClick={() => setOpen(false)} style={{ color: 'var(--text-muted)' }} aria-label="Close">
                  <X size={20} weight="regular" />
                </button>
              </div>

              <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-3">
                {messages.length === 0 && (
                  <p className="text-sm font-light text-center py-8" style={{ color: 'var(--text-muted)' }}>
                    Ask anything about this reading — what a detail means, why it fits, or how to live it.
                  </p>
                )}
                {messages.map((m, i) => (
                  <div key={i}
                    className="max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed"
                    style={{
                      alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                      backgroundColor: m.role === 'user' ? 'var(--gold)' : 'var(--parchment)',
                      color: m.role === 'user' ? 'white' : 'var(--text-primary)',
                    }}>
                    {m.content}
                  </div>
                ))}
                {loading && (
                  <div className="flex gap-1 px-4 py-3 rounded-2xl" style={{ alignSelf: 'flex-start', backgroundColor: 'var(--parchment)' }}>
                    {[0, 1, 2].map(i => (
                      <span key={i} className="w-1.5 h-1.5 rounded-full animate-pulse"
                        style={{ backgroundColor: 'var(--text-muted)', animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 px-6 py-4 border-t shrink-0" style={{ borderColor: 'var(--parchment)' }}>
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') send() }}
                  placeholder="Ask a question..."
                  className="flex-1 px-4 py-2.5 rounded-full border outline-none text-sm"
                  style={{ borderColor: 'var(--parchment)', backgroundColor: 'var(--cream)', color: 'var(--text-primary)' }}
                />
                <button onClick={send} disabled={!input.trim() || loading}
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white shrink-0 disabled:opacity-40"
                  style={{ background: 'linear-gradient(135deg, var(--terracotta), var(--rust))' }}
                  aria-label="Send">
                  <PaperPlaneRight size={16} weight="fill" />
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
