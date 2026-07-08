import './Challenge.css'
import { useRef } from 'react'
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from 'framer-motion'
import officeImage from '../../../assets/landing-bhutan/philosophy-workplace-no-people.jpg'
import connectImage from '../../../assets/landing-bhutan/philosophy-connect-no-people.jpg'
import securityImage from '../../../assets/landing-bhutan/philosophy-security-no-people.jpg'

const statement = [
  'Technology',
  'should',
  'feel',
  'less',
  'like',
  'a collection',
  'of systems',
  'and more',
  'like one',
  'quietly',
  'working whole.',
]

const Challenge = () => {
  const sectionRef = useRef(null)
  const reduceMotion = useReducedMotion()
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end end'],
  })

  const statementY = useTransform(scrollYProgress, [0, 0.52], [reduceMotion ? 0 : 90, 0])
  const statementOpacity = useTransform(scrollYProgress, [0, 0.16], [0.28, 1])
  const mainImageY = useTransform(scrollYProgress, [0, 1], [reduceMotion ? '0%' : '12%', reduceMotion ? '0%' : '-12%'])
  const smallImageY = useTransform(scrollYProgress, [0, 1], [reduceMotion ? 0 : 100, reduceMotion ? 0 : -70])
  const detailImageY = useTransform(scrollYProgress, [0, 1], [reduceMotion ? 0 : -45, reduceMotion ? 0 : 90])
  const imageScale = useTransform(scrollYProgress, [0, 0.7], [1.12, 1])
  const lineScale = useTransform(scrollYProgress, [0.06, 0.7], [0, 1])
  const orbitRotate = useTransform(scrollYProgress, [0, 1], [0, reduceMotion ? 0 : 46])

  return (
    <section className='philosophy-section' id='challenge' ref={sectionRef}>
      <div className='philosophy-sticky'>
        <div className='philosophy-section__wash' aria-hidden='true' />
        <motion.div
          className='philosophy-section__orbit'
          style={{ rotate: orbitRotate }}
          aria-hidden='true'
        />

        <div className='philosophy-section__topline'>
          <span>Our approach</span>
          <span>01 / Philosophy</span>
        </div>

        <motion.figure
          className='philosophy-image philosophy-image--main'
          style={{ y: mainImageY }}
        >
          <motion.img
            src={connectImage}
            alt='Telecommunications infrastructure overlooking Thimphu'
            style={{ scale: imageScale }}
          />
          <figcaption>
            <span>Connected Bhutan</span>
            <span>27.47° N / 89.64° E</span>
          </figcaption>
        </motion.figure>

        <motion.figure
          className='philosophy-image philosophy-image--small'
          style={{ y: smallImageY }}
        >
          <img src={officeImage} alt='Integrated technology in a Bhutanese workplace' />
          <figcaption>Designed around people</figcaption>
        </motion.figure>

        <motion.figure
          className='philosophy-image philosophy-image--detail'
          style={{ y: detailImageY }}
        >
          <img src={securityImage} alt='Security infrastructure on Bhutanese architecture' />
          <figcaption>Built into place</figcaption>
        </motion.figure>

        <motion.div
          className='philosophy-section__body'
          style={{ y: statementY, opacity: statementOpacity }}
        >
          <span className='philosophy-section__number' aria-hidden='true'>01</span>
          <p className='philosophy-section__statement'>
            {statement.map((word, index) => {
              const start = 0.08 + (index / statement.length) * 0.48
              const end = Math.min(0.72, start + 0.16)

              return (
                <Word
                  key={`${word}-${index}`}
                  progress={scrollYProgress}
                  range={[start, end]}
                >
                  {word}
                </Word>
              )
            })}
          </p>
        </motion.div>

        <div className='philosophy-section__footer'>
          <motion.i style={{ scaleX: lineScale }} />
          <p>
            We connect products, infrastructure, engineering, and support so each
            part strengthens the next.
          </p>
          <span>Built around your organization</span>
        </div>
      </div>
    </section>
  )
}

const Word = ({ children, progress, range }) => {
  const opacity = useTransform(progress, range, [0.14, 1])
  const y = useTransform(progress, range, [14, 0])

  return (
    <motion.span className='philosophy-word' style={{ opacity, y }}>
      {children}
    </motion.span>
  )
}

export default Challenge
