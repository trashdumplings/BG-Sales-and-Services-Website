import './Product.css'
import { useRef, useState } from 'react'
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from 'motion/react'
import { Link } from 'react-router-dom'
import { FiArrowRight, FiArrowUpRight } from 'react-icons/fi'
import laptop from '../../../assets/products/laptop/pavillion.png'
import desktop from '../../../assets/products/desktop/dell_optiplex_3050_tiny.png'
import printer from '../../../assets/products/printer/hplaser1008a.png'

const collections = [
  {
    id: 'laptop',
    number: '01',
    eyebrow: 'Mobility',
    name: 'Laptops',
    title: 'Work moves. Your technology should too.',
    description:
      'Reliable mobile systems for executives, field teams, classrooms, and growing organizations.',
    image: laptop,
    href: '/products/laptop',
    features: ['Business-ready setup', 'Team deployment', 'Local support'],
  },
  {
    id: 'desktop',
    number: '02',
    eyebrow: 'Performance',
    name: 'Desktop systems',
    title: 'A dependable foundation for everyday work.',
    description:
      'Compact and full-size workstations selected for offices, laboratories, counters, and control rooms.',
    image: desktop,
    href: '/products/desktop',
    features: ['Space-efficient options', 'Scalable configurations', 'Installation support'],
  },
  {
    id: 'printer',
    number: '03',
    eyebrow: 'Workflow',
    name: 'Print & document',
    title: 'Keep information moving without friction.',
    description:
      'Practical printing and document systems for teams that depend on clear, consistent output.',
    image: printer,
    href: '/products/printer',
    features: ['Office-ready hardware', 'Volume-based sourcing', 'After-sales service'],
  },
]

const Product = () => {
  const [activeId, setActiveId] = useState(collections[0].id)
  const reduceMotion = useReducedMotion()
  const sectionRef = useRef(null)
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  })
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 90,
    damping: 24,
    mass: 0.35,
  })
  const visualY = useTransform(smoothProgress, [0, 0.5, 1], [reduceMotion ? 0 : 60, 0, reduceMotion ? 0 : -36])
  const copyY = useTransform(smoothProgress, [0, 0.5, 1], [reduceMotion ? 0 : 30, 0, reduceMotion ? 0 : -16])
  const ambientX = useTransform(smoothProgress, [0, 1], ['-8%', '8%'])
  const activeCollection =
    collections.find((collection) => collection.id === activeId) ?? collections[0]
  const handleCollectionKeyDown = (event, index) => {
    const keys = ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp', 'Home', 'End']

    if (!keys.includes(event.key)) return

    event.preventDefault()

    const lastIndex = collections.length - 1
    let nextIndex = index

    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      nextIndex = index === lastIndex ? 0 : index + 1
    }

    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      nextIndex = index === 0 ? lastIndex : index - 1
    }

    if (event.key === 'Home') nextIndex = 0
    if (event.key === 'End') nextIndex = lastIndex

    const nextCollection = collections[nextIndex]
    setActiveId(nextCollection.id)
    window.requestAnimationFrame(() => {
      document.getElementById(`product-tab-${nextCollection.id}`)?.focus()
    })
  }

  return (
    <section id="product" className="home-products" ref={sectionRef}>
      <motion.div
        className="home-products__ambient"
        style={{ x: ambientX }}
        aria-hidden="true"
      />

      <motion.div
        className="home-products__intro"
        initial={reduceMotion ? false : 'hidden'}
        whileInView="visible"
        viewport={{ once: true, amount: 0.35 }}
        variants={{
          hidden: {},
          visible: { transition: { staggerChildren: 0.1 } },
        }}
      >
        <motion.span
          className="home-products__eyebrow"
          variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}
        >
          Selected technology
        </motion.span>
        <motion.h2
          variants={{
            hidden: { opacity: 0, y: 42 },
            visible: { opacity: 1, y: 0, transition: { duration: 0.85, ease: [0.22, 1, 0.36, 1] } },
          }}
        >
          Built around the way your business works.
        </motion.h2>
        <motion.p
          variants={{
            hidden: { opacity: 0, y: 22 },
            visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
          }}
        >
          Explore a focused selection of business technology, with sourcing,
          configuration, and support from one local team.
        </motion.p>
        <motion.div
          className="home-products__intro-cta"
          variants={{
            hidden: { opacity: 0, y: 14 },
            visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
          }}
        >
          <Link to="/product" className="home-products__catalog-link">
            View the full catalog <FiArrowUpRight />
          </Link>
        </motion.div>
      </motion.div>

      <motion.div
        className="home-products__stage"
        initial={reduceMotion ? false : { opacity: 0, y: 50, clipPath: 'inset(10% 0 0 0)' }}
        whileInView={{ opacity: 1, y: 0, clipPath: 'inset(0% 0 0 0)' }}
        viewport={{ once: true, amount: 0.12 }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="home-products__selector" role="tablist" aria-label="Product collections">
          {collections.map((collection, index) => {
            const isActive = collection.id === activeCollection.id

            return (
              <button
                key={collection.id}
                type="button"
                role="tab"
                id={`product-tab-${collection.id}`}
                aria-selected={isActive}
                aria-controls={`product-panel-${collection.id}`}
                className={isActive ? 'is-active' : ''}
                onClick={() => setActiveId(collection.id)}
                onMouseEnter={() => setActiveId(collection.id)}
                onFocus={() => setActiveId(collection.id)}
                onKeyDown={(event) => handleCollectionKeyDown(event, index)}
              >
                <span>{collection.number}</span>
                <strong>{collection.name}</strong>
                <FiArrowRight />
                {isActive && (
                  <motion.i
                    className="home-products__active-line"
                    layoutId="product-active-line"
                    transition={{ type: 'spring', stiffness: 360, damping: 34 }}
                  />
                )}
              </button>
            )
          })}
        </div>

        <div
          className="home-products__panel"
          id={`product-panel-${activeCollection.id}`}
          role="tabpanel"
          aria-labelledby={`product-tab-${activeCollection.id}`}
          tabIndex={0}
        >
          <motion.div className="home-products__visual-track" style={{ y: visualY }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeCollection.id}
                className="home-products__visual"
                initial={{ opacity: 0, scale: reduceMotion ? 1 : 0.96, filter: reduceMotion ? 'none' : 'blur(10px)' }}
                animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                exit={{ opacity: 0, scale: reduceMotion ? 1 : 1.025, filter: reduceMotion ? 'none' : 'blur(8px)' }}
                transition={{ duration: reduceMotion ? 0.01 : 0.62, ease: [0.22, 1, 0.36, 1] }}
              >
                <motion.div
                  className="home-products__orb"
                  animate={reduceMotion ? undefined : { y: [0, -14, 0], scale: [1, 1.025, 1] }}
                  transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
                  aria-hidden="true"
                />
                <motion.img
                  src={activeCollection.image}
                  alt={activeCollection.name}
                  initial={{ y: reduceMotion ? 0 : 34, rotate: reduceMotion ? 0 : -2.5 }}
                  animate={{ y: 0, rotate: 0 }}
                  transition={{ duration: reduceMotion ? 0.01 : 0.78, ease: [0.16, 1, 0.3, 1] }}
                />
                <span className="home-products__watermark" aria-hidden="true">
                  {activeCollection.number}
                </span>
              </motion.div>
            </AnimatePresence>
          </motion.div>

          <motion.div className="home-products__copy-track" style={{ y: copyY }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeCollection.id}
                className="home-products__copy"
                initial={{ opacity: 0, y: reduceMotion ? 0 : 18 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: reduceMotion ? 0 : -12 }}
                transition={{ duration: reduceMotion ? 0.01 : 0.4, ease: [0.22, 1, 0.36, 1] }}
              >
              <span>{activeCollection.eyebrow}</span>
              <h3>{activeCollection.title}</h3>
              <p>{activeCollection.description}</p>
              <motion.ul
                initial="hidden"
                animate="visible"
                variants={{ visible: { transition: { staggerChildren: reduceMotion ? 0 : 0.07, delayChildren: 0.12 } } }}
              >
                {activeCollection.features.map((feature) => (
                  <motion.li
                    key={feature}
                    variants={{
                      hidden: { opacity: 0, x: reduceMotion ? 0 : -12 },
                      visible: { opacity: 1, x: 0 },
                    }}
                  >
                    {feature}
                  </motion.li>
                ))}
              </motion.ul>
              <Link to={activeCollection.href}>
                Explore {activeCollection.name.toLowerCase()} <FiArrowUpRight />
              </Link>
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </div>
      </motion.div>

      <motion.div
        className="home-products__footer"
        initial={{ opacity: 0, y: reduceMotion ? 0 : 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.7 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        <p>Need larger quantities, installation, or project-specific sourcing?</p>
        <a href="mailto:bgsales@outlook.com" className="home-products__cta">
          Request a quotation <FiArrowUpRight />
        </a>
      </motion.div>
    </section>
  )
}

export default Product
