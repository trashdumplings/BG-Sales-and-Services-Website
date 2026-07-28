import { useState } from 'react'
import {
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
} from 'motion/react'

const chapters = [
  'Introduction',
  'Approach',
  'Services',
  'Products',
  'About',
  'Projects',
  'Partners',
  'Contact',
]

const LandingProgress = () => {
  const reduceMotion = useReducedMotion()
  const [activeChapter, setActiveChapter] = useState(0)
  const { scrollYProgress } = useScroll()
  const progress = useSpring(scrollYProgress, {
    stiffness: 110,
    damping: 28,
    mass: 0.35,
  })

  useMotionValueEvent(scrollYProgress, 'change', (latest) => {
    const next = Math.min(chapters.length - 1, Math.floor(latest * chapters.length))
    setActiveChapter(next)
  })

  if (reduceMotion) return null

  return (
    <aside className='landing-progress' aria-hidden='true'>
      <span>{String(activeChapter + 1).padStart(2, '0')}</span>
      <div className='landing-progress__track'>
        <motion.i style={{ scaleY: progress }} />
      </div>
      <p>{chapters[activeChapter]}</p>
    </aside>
  )
}

export default LandingProgress
