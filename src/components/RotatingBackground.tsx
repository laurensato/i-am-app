'use client'
import { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

const VIDEOS = [
  { src: '/backgrounds/zen-garden.mp4', label: 'A zen garden being raked' },
  { src: '/backgrounds/koi-pond.mp4', label: 'Koi swimming in a pond' },
  { src: '/backgrounds/forest-sunrise.mp4', label: 'Sunrise through a forest' },
]

const ROTATE_MS = 25000

export default function RotatingBackground() {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setIndex(i => (i + 1) % VIDEOS.length), ROTATE_MS)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="absolute inset-0 overflow-hidden rounded-3xl" aria-hidden="true">
      <AnimatePresence>
        <motion.video
          key={VIDEOS[index].src}
          className="absolute inset-0 w-full h-full object-cover"
          src={VIDEOS[index].src}
          autoPlay
          muted
          loop
          playsInline
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 2 }}
        />
      </AnimatePresence>
      <div className="absolute inset-0" style={{ backgroundColor: 'var(--cream)', opacity: 0.82 }} />
    </div>
  )
}
