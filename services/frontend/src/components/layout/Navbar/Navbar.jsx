
import './Navbar.css'
import logo from '../../../assets/logo.png'
import { useState, useEffect } from 'react'
import { Link } from 'react-scroll'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../../stores/AuthProvider'
import { LuMoon, LuSun } from 'react-icons/lu'

const Navbar = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [sticky, setSticky] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [theme, setTheme] = useState('light')

  // Initialize theme
  useEffect(() => {
    const stored = window.localStorage.getItem('theme')
    const initial = stored === 'light' || stored === 'dark' ? stored : 'light'
    setTheme(initial)
    document.documentElement.setAttribute('data-theme', initial)
  }, [])

  // Apply theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    window.localStorage.setItem('theme', theme)
  }, [theme])

  // Handle scroll
  useEffect(() => {
    const handleScroll = () => {
      setSticky(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark')
  }

  const ThemeIcon = theme === 'dark' ? LuSun : LuMoon

  const closeMobileMenu = () => {
    setMobileMenuOpen(false)
  }

  const handleLogout = async () => {
    await logout()
    navigate('/')
    closeMobileMenu()
  }

  return (
    <nav className={`navbar ${sticky ? 'navbar--sticky' : ''}`}>
      <div className="container-nav navbar-container">
        {/* Logo */}
        <div className="navbar-logo">
          <img src={logo} alt="BG Sales & Supplies" className="navbar-logo-img" />
          <div className="navbar-brand">
            <h3>BG Sales & Supplies</h3>
          </div>
        </div>

        {/* Navigation Links */}
        <ul className={`navbar-menu ${mobileMenuOpen ? 'navbar-menu--open' : ''}`}>
          <li>
            <Link
              to='hero'
              smooth={true}
              offset={0}
              duration={500}
              spy={true}
              activeClass='navbar-link--active'
              onClick={closeMobileMenu}
              className='navbar-link'
            >
              Home
            </Link>
          </li>
          <li>
            <Link
              to='product'
              smooth={true}
              offset={-260}
              duration={500}
              spy={true}
              activeClass='navbar-link--active'
              onClick={closeMobileMenu}
              className='navbar-link'
            >
              Products
            </Link>
          </li>
          <li>
            <Link
              to='service'
              smooth={true}
              offset={-260}
              duration={500}
              spy={true}
              activeClass='navbar-link--active'
              onClick={closeMobileMenu}
              className='navbar-link'
            >
              Services
            </Link>
          </li>
          <li>
            <Link
              to='about'
              smooth={true}
              offset={-150}
              duration={500}
              spy={true}
              activeClass='navbar-link--active'
              onClick={closeMobileMenu}
              className='navbar-link'
            >
              About
            </Link>
          </li>
          <li>
            <Link
              to='gallery'
              smooth={true}
              offset={-240}
              duration={500}
              spy={true}
              activeClass='navbar-link--active'
              onClick={closeMobileMenu}
              className='navbar-link'
            >
              Gallery
            </Link>
          </li>
          <li>
            <Link
              to='contact'
              smooth={true}
              offset={-260}
              duration={500}
              spy={true}
              activeClass='navbar-link--active'
              onClick={closeMobileMenu}
              className='navbar-link'
            >
              Contact
            </Link>
          </li>
        </ul>

        {/* Right Actions */}
        <div className="navbar-actions">

          <button
            type="button"
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
          >
            <ThemeIcon />
          </button>

          {/* Mobile Menu Toggle */}
          <button
            type="button"
            className={`hamburger ${mobileMenuOpen ? 'hamburger--active' : ''}`}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <span className="hamburger-line"></span>
            <span className="hamburger-line"></span>
            <span className="hamburger-line"></span>
          </button>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
