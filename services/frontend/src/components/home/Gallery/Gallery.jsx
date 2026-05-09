import { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react'
import './Gallery.css'
import { motion } from 'framer-motion'
import { projectsData } from '../../../stores/Data'

const Gallery = () => {
  const [modalOpen, setModalOpen] = useState(false)
  const [modalContent, setModalContent] = useState(null)

  // Memoize animation variants to prevent recreation on each render
  const containerVariants = useMemo(() => ({
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.1 }
    }
  }), [])

  const itemVariants = useMemo(() => ({
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.34, 1.56, 0.64, 1] } }
  }), [])

  // Memoize callback functions to prevent child re-renders
  const openModal = useCallback((project) => {
    setModalContent(project)
    setModalOpen(true)
  }, [])

  const closeModal = useCallback(() => {
    setModalOpen(false)
    setModalContent(null)
  }, [])

  return (
    <section className='section section--tight'>
      <div className='gallery-wrapper'>
        <div className='gallery-header'>
          <h2 className='h2'>Our Projects</h2>
          <p className='text-secondary'>Showcase of completed and ongoing projects across various sectors</p>
        </div>

        <motion.div 
          className="gallery-grid"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: false, amount: 0.2 }}
        >
          {projectsData.map((project) => (
            <motion.div 
              key={project.id} 
              className='project-card'
              variants={itemVariants}
              whileHover={{ y: -8 }}
            >
              <div className='project-card-header'>
                <div className='project-logo'>
                  <img src={project.logo} alt={project.clientName} className='logo-image' />
                </div>
                <div className='project-status'>
                  <span className={`status-badge ${project.status.includes('Ongoing') ? 'status-ongoing' : 'status-completed'}`}>
                    {project.status}
                  </span>
                </div>
              </div>
              
              <div className='project-card-body'>
                <h3 className='project-name'>{project.clientName}</h3>
                <p className='project-type'>{project.serviceType}</p>
              </div>

              <div className='project-card-footer'>
                <button 
                  className='project-btn'
                  onClick={() => openModal(project)}
                >
                  View More →
                </button>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Modal */}
      {modalOpen && modalContent && (
        <MemoizedProjectModal content={modalContent} onClose={closeModal} />
      )}
    </section>
  )
}

function ProjectModal({ content, onClose }) {
  const modalRef = useRef(null)

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    const prev = document.activeElement
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    if (modalRef.current) modalRef.current.focus()
    return () => { 
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
      if (prev) prev.focus()
    }
  }, [onClose])

  return (
    <div className="modal-overlay" role="presentation" onClick={onClose}>
      <div 
        className="project-modal" 
        role="dialog" 
        aria-modal="true" 
        aria-label={content.clientName} 
        onClick={e=>e.stopPropagation()} 
        tabIndex={-1} 
        ref={modalRef}
      >
        <header className="modal-header">
          <div className="modal-header-logo">
            <img src={content.logo} alt={content.clientName} className="modal-logo-image" />
          </div>
          <div className="modal-header-content">
            <h2>{content.clientName}</h2>
            <span className={`status-badge ${content.status.includes('Ongoing') ? 'status-ongoing' : 'status-completed'}`}>
              {content.status}
            </span>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close">×</button>
        </header>

        <div className="modal-body">
          <div className="detail-section">
            <h3>Service Type</h3>
            <p>{content.serviceType}</p>
          </div>

          <div className="detail-section">
            <h3>Project Scope</h3>
            <p>{content.scope}</p>
          </div>
        </div>

        <footer className="modal-actions">
          <button className="btn btn-secondary" onClick={onClose}>Close</button>
        </footer>
      </div>
    </div>
  )
}

// Memoize ProjectModal to prevent unnecessary re-renders when parent updates
const MemoizedProjectModal = memo(ProjectModal)

export default Gallery
