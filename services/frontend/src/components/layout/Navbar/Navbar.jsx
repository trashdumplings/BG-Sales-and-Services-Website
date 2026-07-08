import './Navbar.css'
import logo from '../../../assets/logo.png'
import { useEffect, useRef, useState } from 'react'
import { FiArrowRight } from 'react-icons/fi'

const navItems = [
  { label: 'Home', id: 'hero' },
  { label: 'Services', id: 'service' },
  { label: 'Products', id: 'product' },
  { label: 'About', id: 'about' },
  { label: 'Projects', id: 'gallery' },
  { label: 'Partners', id: 'partners' },
  { label: 'Contact', id: 'contact' },
]

const Navbar = () => {
  const [sticky, setSticky] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeSection, setActiveSection] = useState('hero')
  const menuRef = useRef(null)
  const menuButtonRef = useRef(null)

  useEffect(() => {
    const handleScroll = () => setSticky(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const sections = navItems
      .map(({ id }) => document.getElementById(id))
      .filter(Boolean)

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
        if (visible) setActiveSection(visible.target.id)
      },
      { rootMargin: '-30% 0px -55% 0px', threshold: [0, 0.15, 0.4] },
    )

    sections.forEach((section) => observer.observe(section))
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!mobileMenuOpen) return undefined

    const closeOnEscape = (event) => {
      if (event.key === 'Escape') {
        setMobileMenuOpen(false)
        menuButtonRef.current?.focus()
      }
    }
    menuRef.current?.querySelector('a')?.focus()
    document.addEventListener('keydown', closeOnEscape)
    return () => document.removeEventListener('keydown', closeOnEscape)
  }, [mobileMenuOpen])

  const closeMobileMenu = () => setMobileMenuOpen(false)

  return (
    <nav className={`navbar ${sticky ? 'navbar--sticky' : ''}`} aria-label="Primary navigation">
      <div className="container-nav navbar-container">
        <a className="navbar-logo" href="#hero" onClick={closeMobileMenu}>
          <img src={logo} alt="" className="navbar-logo-img" />
          <span className="navbar-brand">BG Sales &amp; Supplies</span>
        </a>

        <ul
          className={`navbar-menu ${mobileMenuOpen ? 'navbar-menu--open' : ''}`}
          id="primary-navigation"
          ref={menuRef}
        >
          {navItems.map((item) => (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                onClick={closeMobileMenu}
                className={`navbar-link ${activeSection === item.id ? 'navbar-link--active' : ''}`}
                aria-current={activeSection === item.id ? 'location' : undefined}
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="navbar-actions">
          <a href="#contact" className="navbar-quote-link" onClick={closeMobileMenu}>
            Get a Quote <i><FiArrowRight /></i>
          </a>

          <button
            type="button"
            ref={menuButtonRef}
            className={`hamburger ${mobileMenuOpen ? 'hamburger--active' : ''}`}
            onClick={() => setMobileMenuOpen((current) => !current)}
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileMenuOpen}
            aria-controls="primary-navigation"
          >
            <span className="hamburger-line" />
            <span className="hamburger-line" />
            <span className="hamburger-line" />
          </button>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
