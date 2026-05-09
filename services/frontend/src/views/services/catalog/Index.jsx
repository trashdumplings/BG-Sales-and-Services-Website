import './Services.css'
import Navigation from "../../../components/layout/Navigation/NaviGeneral"
import service_banner from '../../../assets/services/service_banner.png'
import LeftServices from '../../../components/services/LeftServices/LeftServices'
import MiddleService from '../../../components/services/MiddleService/MiddleService'
import RightServices from '../../../components/services/RightServices/RightServices'
import Interactive from '../../../components/services/Interactive/Interactive'
import Tele from '../../../components/services/Tele/Tele'
import Power from '../power/Index'
import FacebookMsg from '../../../components/home/FacebookMsg'
import useScrollReveal from '../../../composables/useScrollReveal'
import { useState, useEffect, useRef } from 'react'

const Services = () => {
  useScrollReveal();
  const [showDetails, setShowDetails] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalContent, setModalContent] = useState(null)

  const services = [
    {
      id: 'consultancy',
      title: 'Consultancy & Socio-Economic Services',
      desc: 'Strategic analysis and institutional guidance across multiple sectors.',
      details: [
        'Education, Agronomic Industry, and Marketing assessments',
        'IT roadmaps, network architecture design, and engineering feasibility studies',
        'Operational audits and credit process optimization for financial institutions',
        'Customer surveys and impact assessments',
        'Management consultancy and organizational restructuring',
        'Corporate/NGO fund management advisory',
        'Comprehensive accounting services for SMEs and enterprises'
      ],
    },
    {
      id: 'financial',
      title: 'Specialised Financial & Legal Support',
      desc: 'Audit, tax, and insolvency assistance with regulatory compliance.',
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
  ]

  function openModal(srv) {
    setModalContent(srv)
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setModalContent(null)
  }

  return (
    <div>
      <Navigation title="Our Services"/>

      <div className='services-banner-container'>
        <div className="service-text-content reveal">
            <h2>Your Ultimate Business Solution Destination</h2>
            <p>
                <b>BG Sales & Supplies:</b> Your Trusted IT Partner Since 2008. 
                Elevate Your Business with Tailored Solutions for the Digital Era. 
                Experience Excellence, Achieve Success.
            </p>
            <div className="service-actions">
              <button className='btn primary'>Get Started</button>
              <button className='btn warning' onClick={()=> setShowDetails(s => !s)}>{showDetails ? 'Hide Details' : 'Explore All Services'}</button>
            </div>
        </div>
        <div className="service-banner-image reveal">
          <img src={service_banner} alt="Services banner" />
        </div>
      </div>

      <div className="container">
        <section className="services-overview reveal">
          <h3 className="section-title">Our Core Services</h3>
          <p className="section-sub">Practical, scalable solutions tailored to your business needs.</p>

          <div className="services-grid">
            {services.map((s, i) => (
              <article key={s.id} className="service-card reveal" data-delay={i * 80}>
                <div className="icon" aria-hidden>
                  {getIcon(s.id)}
                </div>
                <h4>{s.title}</h4>
                <p>{s.desc}</p>
                <button className="learn" onClick={() => openModal(s)} aria-haspopup="dialog">Learn more →</button>
              </article>
            ))}
          </div>
        </section>

        {modalOpen && modalContent && (
          <ServiceModal content={modalContent} onClose={closeModal} />
        )}

        {showDetails && (
          <section className="detail-section">
            <div className="reveal"><LeftServices/></div>
            <div className="reveal"><MiddleService/></div>
            <div className="reveal"><RightServices/></div>
            <div className="reveal"><Interactive/></div>
            <div className="reveal"><Tele/></div>
            <div className="reveal"><Power/></div>
          </section>
        )}

      </div>

      <FacebookMsg/>
    </div>
  )
}

  function getIcon(name) {
    switch (name) {
      case 'consultancy':
        return (
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2c5.5 0 10 4.5 10 10s-4.5 10-10 10S2 17.5 2 12 6.5 2 12 2z" stroke="currentColor" strokeWidth="1.2"/>
            <path d="M12 7v5m0 4h.01" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
        )
      case 'financial':
        return (
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 6h18v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6z" stroke="currentColor" strokeWidth="1.2"/>
            <path d="M3 6l9-3 9 3" stroke="currentColor" strokeWidth="1.2"/>
            <circle cx="12" cy="13" r="2" stroke="currentColor" strokeWidth="1.2"/>
          </svg>
        )
      case 'ict':
        return (
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="3" y="4" width="18" height="12" rx="1" stroke="currentColor" strokeWidth="1.2"/>
            <path d="M8 18l8 0" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            <path d="M10 20h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
        )
      case 'building':
        return (
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 20V4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v16" stroke="currentColor" strokeWidth="1.2"/>
            <rect x="6" y="7" width="3" height="3" stroke="currentColor" strokeWidth="1.2"/>
            <rect x="12" y="7" width="3" height="3" stroke="currentColor" strokeWidth="1.2"/>
            <rect x="6" y="13" width="3" height="3" stroke="currentColor" strokeWidth="1.2"/>
            <rect x="12" y="13" width="3" height="3" stroke="currentColor" strokeWidth="1.2"/>
          </svg>
        )
      case 'support':
        return (
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 15v1a4 4 0 0 0 4 4h8a4 4 0 0 0 4-4v-1" stroke="currentColor" strokeWidth="1.2"/>
            <path d="M12 3a7 7 0 0 0-7 7v1h14V10a7 7 0 0 0-7-7z" stroke="currentColor" strokeWidth="1.2"/>
          </svg>
        )
      case 'integration':
        return (
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="3" y="4" width="7" height="6" stroke="currentColor" strokeWidth="1.2" rx="1.2"/>
            <rect x="14" y="4" width="7" height="6" stroke="currentColor" strokeWidth="1.2" rx="1.2"/>
            <rect x="8" y="14" width="8" height="6" stroke="currentColor" strokeWidth="1.2" rx="1.2"/>
            <path d="M7.5 10.5V14" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            <path d="M16.5 10.5V14" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
        )
      default:
        return null
    }
  }

  function ServiceModal({ content, onClose }) {
    const modalRef = useRef(null)

    useEffect(() => {
      const onKey = (e) => { if (e.key === 'Escape') onClose() }
      document.addEventListener('keydown', onKey)
      const prev = document.activeElement
      const prevOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      if (modalRef.current) modalRef.current.focus()
      return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prevOverflow; if (prev) prev.focus() }
    }, [onClose])

    return (
      <div className="modal-overlay" role="presentation" onClick={onClose}>
        <div className="modal" role="dialog" aria-modal="true" aria-label={content.title} onClick={e=>e.stopPropagation()} tabIndex={-1} ref={modalRef}>
          <header className="modal-header">
            <h4>{content.title}</h4>
            <button className="modal-close" onClick={onClose} aria-label="Close">×</button>
          </header>
          <div className="modal-body">
            <p className="modal-lead">{content.desc}</p>
            <ul>
              {content.details && content.details.map((d, i) => <li key={i}>{d}</li>)}
            </ul>
          </div>
          <footer className="modal-actions">
            <button className="btn primary" onClick={onClose}>Close</button>
          </footer>
        </div>
      </div>
    )
  }

  export default Services
