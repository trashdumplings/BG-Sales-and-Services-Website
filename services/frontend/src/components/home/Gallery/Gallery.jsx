import './Gallery.css'
import { useMemo, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { FiArrowDown, FiArrowUpRight } from 'react-icons/fi'
import { projectsData } from '../../../stores/Data'
import worldBankImage from '../../../assets/landing-bhutan/project-world-bank.jpg'
import bitdeerImage from '../../../assets/landing-bhutan/project-bitdeer-bhutan-hvac.jpg'
import dgpcImage from '../../../assets/landing-bhutan/project-dgpc.jpg'
import bnbImage from '../../../assets/landing-bhutan/project-bnb.jpg'
import healthImage from '../../../assets/landing-bhutan/project-health.jpg'
import tajParoImage from '../../../assets/landing-bhutan/project-taj-paro.jpg'

const projectPresentation = {
  4: {
    image: worldBankImage,
    shortName: 'World Bank',
    systems: ['ICT project management', 'Data centre & electrical works', '11 years of annual service support'],
  },
  5: {
    image: bitdeerImage,
    shortName: 'Bitdeer',
    systems: ['Air-conditioning equipment supply', 'Professional on-site installation', 'Facility cooling delivery'],
  },
  3: {
    image: dgpcImage,
    shortName: 'DGPC',
    systems: ['ICT network & data centre', 'Firefighting systems', 'Integrated HVAC delivery'],
  },
  6: {
    image: bnbImage,
    shortName: 'Bhutan National Bank',
    systems: ['Enterprise servers & storage', 'NAS data redundancy', 'CCTV security systems'],
  },
  7: {
    image: healthImage,
    shortName: 'Ministry of Health',
    systems: ['IP digital EPABX', 'Network switching', 'Critical power backup'],
  },
  11: {
    image: tajParoImage,
    shortName: 'Taj Paro',
    systems: ['Complete ICT setup', 'Integrated audiovisual systems', 'Testing & commissioning'],
  },
}

const featuredIds = [4, 5, 3, 6, 7, 11]

const Gallery = () => {
  const reduceMotion = useReducedMotion()
  const [activeId, setActiveId] = useState(featuredIds[0])
  const [showArchive, setShowArchive] = useState(false)

  const featuredProjects = useMemo(
    () =>
      featuredIds.map((id) => ({
        ...projectsData.find((project) => project.id === id),
        ...projectPresentation[id],
      })),
    [],
  )
  const archiveProjects = useMemo(
    () => projectsData.filter((project) => !featuredIds.includes(project.id)),
    [],
  )
  const activeProject =
    featuredProjects.find((project) => project.id === activeId) ?? featuredProjects[0]

  return (
    <section className="home-work">
      <motion.div
        className="home-work__intro"
        initial={reduceMotion ? false : 'hidden'}
        whileInView="visible"
        viewport={{ once: true, amount: 0.35 }}
        variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.1 } } }}
      >
        <motion.span
          variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}
        >
          Selected projects
        </motion.span>
        <motion.h2
          variants={{
            hidden: { opacity: 0, y: 38 },
            visible: {
              opacity: 1,
              y: 0,
              transition: { duration: 0.85, ease: [0.22, 1, 0.36, 1] },
            },
          }}
        >
          Trusted where the work matters.
        </motion.h2>
        <motion.p
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0, transition: { duration: 0.7 } },
          }}
        >
          Long-term partnerships and technically demanding delivery across Bhutan’s
          financial, public, energy, healthcare, and hospitality sectors.
        </motion.p>
      </motion.div>

      <div className="home-work__experience">
        <motion.div
          className="home-work__list"
          initial={reduceMotion ? false : 'hidden'}
          whileInView="visible"
          viewport={{ once: true, amount: 0.12 }}
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: reduceMotion ? 0 : 0.07 } },
          }}
        >
          {featuredProjects.map((project, index) => {
            const isActive = project.id === activeProject.id

            return (
              <motion.button
                type="button"
                key={project.id}
                className={`home-work-row ${isActive ? 'is-active' : ''}`}
                onClick={() => setActiveId(project.id)}
                onMouseEnter={() => setActiveId(project.id)}
                onFocus={() => setActiveId(project.id)}
                aria-pressed={isActive}
                variants={{
                  hidden: { opacity: 0, x: reduceMotion ? 0 : -22 },
                  visible: { opacity: 1, x: 0 },
                }}
                transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              >
                <span className="home-work-row__number">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className="home-work-row__logo">
                  <img src={project.logo} alt="" loading="lazy" />
                </span>
                <span className="home-work-row__name">
                  <strong>{project.shortName}</strong>
                  <small>{project.serviceType}</small>
                </span>
                <FiArrowUpRight />
                {isActive && (
                  <motion.i
                    layoutId="project-active-line"
                    className="home-work-row__active-line"
                    transition={{ type: 'spring', stiffness: 360, damping: 34 }}
                  />
                )}
              </motion.button>
            )
          })}
        </motion.div>

        <div className="home-work__sticky">
          <AnimatePresence mode="wait">
            <motion.article
              key={activeProject.id}
              className="home-work__panel"
              initial={{ opacity: 0, y: reduceMotion ? 0 : 22 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: reduceMotion ? 0 : -14 }}
              transition={{ duration: reduceMotion ? 0.01 : 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="home-work__image">
                <motion.img
                  src={activeProject.image}
                  alt={`Representative ${activeProject.serviceType.toLowerCase()} environment`}
                  initial={{ scale: reduceMotion ? 1 : 1.05 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: reduceMotion ? 0.01 : 0.9, ease: [0.22, 1, 0.36, 1] }}
                />
                <div className="home-work__image-shade" />
                <span>{activeProject.status}</span>
              </div>

              <div className="home-work__detail">
                <div className="home-work__detail-heading">
                  <span>{activeProject.serviceType}</span>
                  <strong>{activeProject.shortName}</strong>
                </div>
                <p>{activeProject.scope}</p>
                <div className="home-work__systems">
                  <span>Systems delivered</span>
                  <ul>
                    {activeProject.systems.map((system) => (
                      <li key={system}>{system}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.article>
          </AnimatePresence>
        </div>
      </div>

      <div className="home-work__archive">
        <button
          type="button"
          onClick={() => setShowArchive((current) => !current)}
          aria-expanded={showArchive}
          aria-controls="project-archive"
        >
          {showArchive ? 'Close project archive' : 'View all 11 engagements'}
          <FiArrowDown className={showArchive ? 'is-open' : ''} />
        </button>

        <AnimatePresence>
          {showArchive && (
            <motion.div
              className="home-work__archive-list"
              id="project-archive"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: reduceMotion ? 0.01 : 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              {archiveProjects.map((project) => (
                <div key={project.id}>
                  <span>{project.clientName}</span>
                  <small>{project.serviceType}</small>
                  <em>{project.status}</em>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="home-work__transition">
        <span>Eleven engagements. One accountable local partner.</span>
        <p>Planning, sourcing, implementation, commissioning, and support.</p>
      </div>
    </section>
  )
}

export default Gallery
