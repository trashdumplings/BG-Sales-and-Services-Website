import './Footer.css'
import { motion } from 'motion/react'

const footerLinks = [
  { name: 'Home', href: '#hero' },
  { name: 'Products', href: '#product' },
  { name: 'Services', href: '#service' },
  { name: 'About', href: '#about' },
  { name: 'Projects', href: '#gallery' },
  { name: 'Contact', href: '#contact' },
]

const serviceLinks = [
  'Consulting',
  'Network solutions',
  'Data centres',
  'Support services',
]

const Footer = () => {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="footer">
      <motion.div
        className="footer-container"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={{
          hidden: { opacity: 0 },
          visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
        }}
      >
        <motion.div
          className="footer-brand"
          variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}
        >
          <h2>BG Sales &amp; Supplies</h2>
          <p>
            Technology, infrastructure, and accountable local support for
            organizations across Bhutan.
          </p>
        </motion.div>

        <motion.nav
          className="footer-section"
          aria-label="Footer navigation"
          variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}
        >
          <h3>Explore</h3>
          <ul>
            {footerLinks.map((link) => (
              <li key={link.name}>
                <a href={link.href} className="footer-link">{link.name}</a>
              </li>
            ))}
          </ul>
        </motion.nav>

        <motion.div
          className="footer-section"
          variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}
        >
          <h3>Services</h3>
          <ul>
            {serviceLinks.map((service) => (
              <li key={service}>
                <a href="#service" className="footer-link">{service}</a>
              </li>
            ))}
          </ul>
        </motion.div>

        <motion.div
          className="footer-section"
          variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}
        >
          <h3>Contact</h3>
          <address className="footer-info">
            <a href="mailto:bgsales@outlook.com">bgsales@outlook.com</a>
            <a href="tel:+97577208946">+975 77208946</a>
            <span>Hongkong Market, Thimphu, Bhutan</span>
          </address>
        </motion.div>
      </motion.div>

      <div className="footer-bottom">
        <div className="footer-bottom-container">
          <p className="footer-copyright">
            &copy; {currentYear} BG Sales &amp; Supplies. All rights reserved.
          </p>
          <p className="footer-status">Established in Bhutan · 2008</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
