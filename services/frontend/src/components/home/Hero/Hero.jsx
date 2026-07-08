import './Hero.css'
import { lazy, Suspense, useRef } from 'react'
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from 'framer-motion'
import { FiArrowDownRight, FiArrowUpRight } from 'react-icons/fi'
import heroImage from '../../../assets/landing-bhutan/hero-thimphu-v2.jpg'

const HeroGeometry = lazy(() => import('./HeroGeometry'))

const Hero = () => {
  const heroRef = useRef(null)
  const reduceMotion = useReducedMotion()
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  })

  const imageY = useTransform(scrollYProgress, [0, 1], ['0%', reduceMotion ? '0%' : '10%'])
  const copyY = useTransform(scrollYProgress, [0, 1], [0, reduceMotion ? 0 : 72])
  const copyOpacity = useTransform(scrollYProgress, [0, 0.74], [1, 0])
  const lineScale = useTransform(scrollYProgress, [0, 0.55], [0, 1])

  return (
    <section className='cinematic-hero' id='hero' ref={heroRef}>
      <motion.div className='cinematic-hero__image' style={{ y: imageY }}>
        <img
          src={heroImage}
          alt='Thimphu city surrounded by the mountains of Bhutan at blue hour'
          fetchPriority='high'
        />
      </motion.div>

      <div className='cinematic-hero__wash' aria-hidden='true' />
      <div className='cinematic-hero__grain' aria-hidden='true' />
      <Suspense fallback={null}>
        <HeroGeometry scrollProgress={scrollYProgress} />
      </Suspense>

      <motion.div
        className='cinematic-hero__content'
        style={{ y: copyY, opacity: copyOpacity }}
      >
        <div className='cinematic-hero__meta'>
          <span>BG Sales &amp; Supplies</span>
          <span>Thimphu, Bhutan</span>
        </div>

        <h1 className='cinematic-hero__headline'>
          <motion.div
            className='cinematic-hero__headline-primary'
            initial={{ opacity: 0, y: reduceMotion ? 0 : 36 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.05, ease: [0.22, 1, 0.36, 1] }}
          >
            <span>We build the systems</span>
            <span>behind</span>
          </motion.div>

          <motion.div
            className='cinematic-hero__headline-accent'
            initial={{ opacity: 0, y: reduceMotion ? 0 : 42 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.05, delay: 0.16, ease: [0.22, 1, 0.36, 1] }}
          >
            better business.
          </motion.div>
        </h1>

        <div className='cinematic-hero__lower'>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.9, delay: 0.45 }}
          >
            Technology, infrastructure, and support designed as one dependable
            system—built for organizations across Bhutan.
          </motion.p>

          <motion.div
            className='cinematic-hero__actions'
            initial={{ opacity: 0, y: reduceMotion ? 0 : 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, delay: 0.55 }}
          >
            <a
              href='#service'
              className='cinematic-link cinematic-link--primary'
            >
              Explore services <FiArrowDownRight />
            </a>
            <a
              href='mailto:bgsales@outlook.com?subject=Request%20for%20quotation'
              className='cinematic-link cinematic-link--secondary'
            >
              Request a quotation <FiArrowUpRight />
            </a>
          </motion.div>
        </div>
      </motion.div>

      <div className='cinematic-hero__footer'>
        <span>ICT / MEP / Consulting</span>
        <a href='#challenge'>
          Scroll to discover
          <motion.i style={{ scaleX: lineScale }} />
        </a>
        <span>Est. 2008</span>
      </div>
    </section>
  )
}

export default Hero
