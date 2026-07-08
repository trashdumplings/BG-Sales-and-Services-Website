import './About.css'
import { useRef } from 'react'
import {
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from 'framer-motion'
import { FiArrowUpRight } from 'react-icons/fi'
import aboutImage from '../../../assets/landing-bhutan/about-operations-bhutan.jpg'

const stats = [
  { value: '2008', label: 'Established in Bhutan' },
  { value: '18+', label: 'Years of practical delivery' },
  { value: '29', label: 'Technology partners' },
]

const About = () => {
  const sectionRef = useRef(null)
  const reduceMotion = useReducedMotion()
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  })
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 85,
    damping: 24,
    mass: 0.4,
  })
  const imageY = useTransform(
    smoothProgress,
    [0, 1],
    [reduceMotion ? '0%' : '-4%', reduceMotion ? '0%' : '4%'],
  )
  const statementY = useTransform(
    smoothProgress,
    [0, 1],
    [reduceMotion ? 0 : 50, reduceMotion ? 0 : -24],
  )

  return (
    <section className="home-about" id="about" ref={sectionRef}>
      <div className="home-about__header">
        <span>About BG</span>
        <p>Thimphu, Bhutan · Since 2008</p>
      </div>

      <motion.div
        className="home-about__statement"
        style={{ y: statementY }}
        initial={reduceMotion ? false : { opacity: 0, y: 44 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.35 }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      >
        <span>Built here.</span>
        <h2>Close to the work.<br />Committed for the long term.</h2>
      </motion.div>

      <div className="home-about__story">
        <motion.div
          className="home-about__media"
          initial={reduceMotion ? false : { opacity: 0, clipPath: 'inset(12% 0 0 0)' }}
          whileInView={{ opacity: 1, clipPath: 'inset(0% 0 0 0)' }}
          viewport={{ once: true, amount: 0.16 }}
          transition={{ duration: 1.05, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.img
            src={aboutImage}
            alt="Technology operations overlooking Thimphu's mountain valley"
            loading="lazy"
            style={{ y: imageY }}
          />
          <div className="home-about__media-shade" />
          <span className="home-about__location">27.4728° N · 89.6393° E</span>
        </motion.div>

        <motion.div
          className="home-about__copy"
          initial={reduceMotion ? false : 'hidden'}
          whileInView="visible"
          viewport={{ once: true, amount: 0.28 }}
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.1 } },
          }}
        >
          <motion.p
            className="home-about__lead"
            variants={{
              hidden: { opacity: 0, y: 25 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.7 } },
            }}
          >
            We help organizations turn complex technology requirements into systems
            that people can rely on every day.
          </motion.p>

          <motion.div
            className="home-about__body"
            variants={{
              hidden: { opacity: 0, y: 22 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.7 } },
            }}
          >
            <p>
              Our work spans products, ICT infrastructure, MEP systems, consulting,
              installation, and long-term maintenance—giving every client one
              accountable partner from planning through operation.
            </p>
            <p>
              International technology partnerships give us range. Local knowledge,
              practical engineering, and accessible support make that technology work
              here in Bhutan.
            </p>
          </motion.div>

          <motion.div
            className="home-about__stats"
            variants={{
              hidden: { opacity: 0 },
              visible: { opacity: 1, transition: { staggerChildren: 0.09 } },
            }}
          >
            {stats.map((stat) => (
              <motion.div
                key={stat.label}
                variants={{
                  hidden: { opacity: 0, x: reduceMotion ? 0 : -16 },
                  visible: { opacity: 1, x: 0 },
                }}
              >
                <strong>{stat.value}</strong>
                <span>{stat.label}</span>
              </motion.div>
            ))}
          </motion.div>

          <motion.a
            href="mailto:bgsales@outlook.com"
            className="home-about__link"
            variants={{
              hidden: { opacity: 0, y: 15 },
              visible: { opacity: 1, y: 0 },
            }}
          >
            Start a conversation <FiArrowUpRight />
          </motion.a>
        </motion.div>
      </div>
    </section>
  )
}

export default About
