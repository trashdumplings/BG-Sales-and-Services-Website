import './SolutionsStory.css'
import { useRef, useState } from 'react'
import {
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
} from 'framer-motion'
import { FiArrowUpRight } from 'react-icons/fi'
import connectImage from '../../../assets/landing-bhutan/philosophy-connect-no-people.jpg'
import protectImage from '../../../assets/landing-bhutan/philosophy-security-no-people.jpg'
import sustainImage from '../../../assets/landing-bhutan/service-sustain-no-people.jpg'

const services = [
  {
    number: '01',
    title: 'Connect',
    kicker: 'Networks and communication',
    heading: 'Infrastructure that lets information move without friction.',
    description:
      'We design and deliver structured cabling, switching, wireless networks, voice systems, data centres, and secure connectivity as one coordinated foundation. Every layer is planned for the people using it today and the growth expected tomorrow.',
    services: ['LAN / WAN architecture', 'Data centres & NOC', 'Wireless & voice'],
    image: connectImage,
    imageAlt: 'Wireless telecommunications infrastructure overlooking Thimphu',
    color: '#001845',
  },
  {
    number: '02',
    title: 'Protect',
    kicker: 'Security and life safety',
    heading: 'Protection designed around the whole environment.',
    description:
      'Physical and digital security work best when they share a clear strategy. We bring together IP surveillance, access control, threat management, fire detection, and secure network infrastructure to help organizations see risk and respond sooner.',
    services: ['IP surveillance', 'Access & threat control', 'Fire detection systems'],
    image: protectImage,
    imageAlt: 'Integrated security systems on a Bhutanese building',
    color: '#023e7d',
  },
  {
    number: '03',
    title: 'Sustain',
    kicker: 'Power, MEP and support',
    heading: 'Systems that remain dependable long after commissioning.',
    description:
      'Reliable operations depend on stable power, controlled environments, and support that stays available. Our UPS, HVAC, building systems, maintenance, and lifecycle services protect the investment and keep critical infrastructure useful.',
    services: ['UPS & power continuity', 'HVAC & building systems', 'Managed maintenance'],
    image: sustainImage,
    imageAlt: 'Critical power and building systems in a Bhutanese facility',
    color: '#0353a4',
  },
]

const SolutionsStory = () => {
  const sectionRef = useRef(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const reduceMotion = useReducedMotion()
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end end'],
  })

  useMotionValueEvent(scrollYProgress, 'change', (latest) => {
    const nextIndex = Math.min(services.length - 1, Math.floor(latest * services.length))
    setActiveIndex(nextIndex)
  })

  const progressScale = useTransform(scrollYProgress, [0, 1], [0, 1])
  const imageScale = useTransform(scrollYProgress, [0, 1], [1.06, reduceMotion ? 1.06 : 1])
  const active = services[activeIndex]

  return (
    <section className='services-journey' id='service' ref={sectionRef}>
      <div className='services-journey__sticky'>
        <header className='services-journey__header'>
          <span>What we build</span>
          <div className='services-journey__progress' aria-hidden='true'>
            <motion.i style={{ scaleX: progressScale }} />
          </div>
          <span>02 / Services</span>
        </header>

        <div
          className='services-journey__stage'
          style={{ '--chapter-color': active.color }}
        >
          <div className='services-journey__numbers' aria-hidden='true'>
            {services.map((service, index) => (
              <span key={service.number} className={index === activeIndex ? 'is-active' : ''}>
                {service.number}
              </span>
            ))}
          </div>

          <motion.div
            className='services-journey__copy'
            key={`copy-${active.number}`}
            initial={reduceMotion ? false : { opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.62, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className='services-journey__eyebrow'>
              <span>{active.number}</span>
              <span>{active.kicker}</span>
            </div>

            <h2>{active.title}</h2>
            <h3>{active.heading}</h3>
            <p>{active.description}</p>

            <ul>
              {active.services.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </motion.div>

          <figure className='services-journey__visual'>
            <motion.img
              key={active.image}
              src={active.image}
              alt={active.imageAlt}
              style={{ scale: imageScale }}
              initial={reduceMotion ? false : { opacity: 0, filter: 'blur(8px)' }}
              animate={{ opacity: 1, filter: 'blur(0px)' }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            />
            <figcaption>
              <span>BG / {active.title.toUpperCase()}</span>
              <span>Bhutan</span>
            </figcaption>
          </figure>

          <nav className='services-journey__rail' aria-label='Service chapters'>
            {services.map((service, index) => (
              <button
                type='button'
                key={service.number}
                className={index === activeIndex ? 'is-active' : ''}
                onClick={() => setActiveIndex(index)}
              >
                <span>{service.number}</span>
                {service.title}
              </button>
            ))}
          </nav>

          <a
            className='services-journey__cta'
            href='mailto:bgsales@outlook.com?subject=Service%20inquiry'
          >
            Discuss your infrastructure <FiArrowUpRight />
          </a>
        </div>
      </div>
    </section>
  )
}

export default SolutionsStory
