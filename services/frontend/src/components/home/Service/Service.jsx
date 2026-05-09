import './Service.css'
import { useState, useEffect, useRef, useMemo } from 'react'
import network from '../../../assets/service-section/network.png'
import repair from '../../../assets/service-section/repair.png'
import datacenter from '../../../assets/service-section/datacenter.png'
import hvac from '../../../assets/service-section/hvac.jpg'

const Service = () => {
  const services = useMemo(
    () => [
      {
        id: 'consultancy',
        title: 'Consultancy & Socio-Economic Services',
        desc: 'Strategic analysis and institutional guidance across multiple sectors.',
        icon: '!', // used in overlay
        image: network,
        details: [
          'Education, Agronomic Industry, and Marketing assessments',
          'IT roadmaps, network architecture design, and engineering feasibility studies',
          'Operational audits and credit process optimization for financial institutions',
          'Customer surveys and impact assessments',
          'Management consultancy and organizational restructuring',
          'Corporate/NGO fund management advisory',
          'Comprehensive accounting services for SMEs and enterprises',
        ],
      },
      {
        id: 'financial',
        title: 'Specialised Financial & Legal Support',
        desc: 'Audit, tax, and insolvency assistance with regulatory compliance.',
        icon: '₮',
        image: repair,
        details: [
          'Statutory audits and intricate tax filing & planning',
          'Insolvency proceedings and legal compliance',
          'Strategic cooperation with government agencies',
          'Royal Audit Authority coordination',
          'Regulatory alignment and fiscal responsibility',
          'Donor compliance framework adherence',
        ],
      },
      {
        id: 'ict',
        title: 'ICT & Networking Solutions',
        desc: 'End-to-end design and build services for integrated infrastructure.',
        icon: '⌘',
        image: datacenter,
        details: [
          'Data Centres, Wireless backbones, and VOIP telephony',
          'IP Bandwidth provisioning and Linux installations',
          'Passive Structured Cabling and LAN/WAN architectures',
          'Unified Threat Management and Endpoint Security Solutions',
          'IP PBX, Voice data networks, and Biometric access systems',
          'CCTV IP Surveillance and Under Vehicle Scanning Systems',
          'RFID solutions for Access Control and Asset Tracking',
          'SCADA/PLC Fieldbus Slave Couplers for industrial automation',
          'Turnkey Data Centre construction with NOC setup',
          'ISP bandwidth with Leased lines, MPLS VPN, and VoIP solutions',
          'Hand Held Billing solutions and Automatic Meter Reading (AMR)',
          'Enterprise-grade Servers, Desktops, and Thin Clients',
          'Comprehensive maintenance, repair, and OS installation services',
        ],
      },
      {
        id: 'building',
        title: 'Building Automation & MEP Systems',
        desc: 'Integrated facility infrastructure for life safety and efficiency.',
        icon: '▢',
        image: hvac,
        details: [
          'Network Backbone infrastructure for Data, Voice, and Video',
          'Networked surveillance cameras and access control systems',
          'Automated Boom Barriers with parking management',
          'Advanced Fire Detection and Gas-based Fire Suppression',
          'Public Address (PA) Systems for announcements',
          'Turnkey HVAC Solutions for climate control',
          'Integrated BMS (Building Management Systems)',
          'High-security bollards and perimeter protection',
        ],
      },
      {
        id: 'support',
        title: 'Managed Support & Maintenance',
        desc: 'On-site and remote support plans to keep systems healthy.',
        icon: '∞',
        image: network,
        details: [
          'SLAs and on-site engineers for rapid response',
          'Remote helpdesk and ticketing systems',
          'Proactive maintenance and security patching',
          'Computer equipment repair and troubleshooting',
          'Printer and office automation maintenance',
          'Disaster Management Equipment and Accessories',
          'Continuous monitoring and system optimization',
        ],
      },
      {
        id: 'integration',
        title: 'Integrated ICT & MEP Solutions',
        desc: 'Harmonised digital and physical systems for modern facilities.',
        icon: '◎',
        image: datacenter,
        details: [
          'End-to-end design and build services',
          'Digital and physical system integration',
          'Scalable infrastructure for future growth',
          'Vendor-agnostic solutions',
          'Expert installation and commissioning',
          'Training and knowledge transfer',
          'Long-term support and optimization',
        ],
      },
    ],
    [],
  )

  const [modalOpen, setModalOpen] = useState(false)
  const [modalContent, setModalContent] = useState(null)

  function openModal(service) {
    setModalContent(service)
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setModalContent(null)
  }

  return (
    <section id='service' className='section section--tight'>
      <div className='services-wrapper'>
        <div className='services-header'>
          <h2 className='section-title'>Our Core Services</h2>
          <p className='section-sub'>
            Practical, scalable solutions tailored to your business needs.
          </p>
        </div>

        <div className='services-grid'>
          {services.map((s, index) => (
            <article
              key={s.id}
              className='service-card'
              data-delay={index * 80}
            >
              <div className='service-image'>
                <img src={s.image} alt={s.title} />
                <div className='service-overlay'>
                  <span className='service-overlay-icon'>{s.icon}</span>
                </div>
              </div>
              <div className='service-body'>
                <h4>{s.title}</h4>
                <p>{s.desc}</p>
                <button
                  className='learn'
                  onClick={() => openModal(s)}
                  aria-haspopup='dialog'
                >
                  View more →
                </button>
              </div>
            </article>
          ))}
        </div>

        {modalOpen && modalContent && (
          <ServiceModal content={modalContent} onClose={closeModal} />
        )}
      </div>
    </section>
  )
}

function ServiceModal({ content, onClose }) {
  const modalRef = useRef(null)

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const previousActive = document.activeElement
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    if (modalRef.current) modalRef.current.focus()

    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previousOverflow
      if (previousActive instanceof HTMLElement) {
        previousActive.focus()
      }
    }
  }, [onClose])

  return (
    <div
      className='modal-overlay'
      role='presentation'
      onClick={onClose}
    >
      <div
        className='modal'
        role='dialog'
        aria-modal='true'
        aria-label={content.title}
        onClick={(e) => e.stopPropagation()}
        tabIndex={-1}
        ref={modalRef}
      >
        <header className='modal-header'>
          <h4>{content.title}</h4>
          <button
            className='modal-close'
            onClick={onClose}
            aria-label='Close'
          >
            ×
          </button>
        </header>
        <div className='modal-body'>
          <p className='modal-lead'>{content.desc}</p>
          <ul>
            {content.details?.map((d, i) => (
              <li key={i}>{d}</li>
            ))}
          </ul>
        </div>
        <footer className='modal-actions'>
          <button className='btn primary' onClick={onClose}>
            Close
          </button>
        </footer>
      </div>
    </div>
  )
}

export default Service
