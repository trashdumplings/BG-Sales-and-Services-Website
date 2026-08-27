import './Hero.css'
import { lazy, Suspense, useLayoutEffect, useRef } from 'react'
import { createTimeline, stagger } from 'animejs'
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from 'motion/react'
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

  useLayoutEffect(() => {
    const hero = heroRef.current
    if (!hero || reduceMotion) return undefined

    hero.classList.add('is-anime-ready')
    const timeline = createTimeline({
      defaults: {
        ease: 'outExpo',
      },
    })

    timeline
      .add(hero.querySelectorAll('[data-hero-meta]'), {
        opacity: [0, 1],
        y: [12, 0],
        duration: 650,
        delay: stagger(70),
      })
      .add(hero.querySelectorAll('[data-hero-line]'), {
        opacity: [0, 1],
        y: [44, 0],
        duration: 980,
        delay: stagger(120),
      }, '-=420')
      .add(hero.querySelectorAll('[data-hero-support]'), {
        opacity: [0, 1],
        y: [20, 0],
        duration: 720,
        delay: stagger(90),
      }, '-=520')
      .add(hero.querySelectorAll('[data-signal-node]'), {
        opacity: [0, 1],
        scale: [0.2, 1],
        duration: 520,
        delay: stagger(100),
      }, '-=520')
      .add(hero.querySelectorAll('[data-signal-line]'), {
        opacity: [0, 1],
        scaleX: [0, 1],
        duration: 620,
        delay: stagger(90),
      }, '-=560')

    return () => {
      timeline.revert()
      hero.classList.remove('is-anime-ready')
    }
  }, [reduceMotion])

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
          <span data-hero-meta>BG Sales &amp; Supplies</span>
          <span data-hero-meta>Thimphu, Bhutan</span>
        </div>

        <h1 className='cinematic-hero__headline'>
          <div
            className='cinematic-hero__headline-primary'
            data-hero-line
          >
            <span>We build the systems</span>
            <span>behind</span>
          </div>

          <div
            className='cinematic-hero__headline-accent'
            data-hero-line
          >
            better business.
          </div>
        </h1>

        <div className='cinematic-hero__lower'>
          <p data-hero-support>
            Technology, infrastructure, and support designed as one dependable
            system—built for organizations across Bhutan.
          </p>

          <div
            className='cinematic-hero__actions'
            data-hero-support
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
          </div>
        </div>
      </motion.div>

      <div className='cinematic-hero__signal' aria-hidden='true' data-hero-support>
        <span data-signal-node />
        <i data-signal-line />
        <span data-signal-node />
        <i data-signal-line />
        <span data-signal-node />
      </div>

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
