import './Footer.css'
import { motion } from 'framer-motion'
import { Link } from 'react-scroll'

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = [
    { name: 'Home', link: 'hero' },
    { name: 'Products', link: 'product' },
    { name: 'Services', link: 'service' },
    { name: 'About', link: 'about' },
    { name: 'Contact', link: 'contact' }
  ];

  const legalLinks = [
    { name: 'Terms of Service', href: '#' },
    { name: 'Privacy Policy', href: '#' },
    { name: 'Cookie Policy', href: '#' }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  return (
    <footer className='footer'>
      <motion.div 
        className='footer-container'
        initial="hidden"
        whileInView="visible"
        viewport={{ once: false, amount: 0.3 }}
        variants={containerVariants}
      >
        {/* Brand Section */}
        <motion.div className='footer-brand' variants={itemVariants}>
          <h3>BG Sales & Supplies</h3>
          <p>Delivering excellence in IT solutions since 2008. Your trusted partner for digital transformation.</p>
          <div className='footer-socials'>
            <a href='#' aria-label='Facebook' title='Follow us on Facebook'>f</a>
            <a href='#' aria-label='Twitter' title='Follow us on Twitter'>𝕏</a>
            <a href='#' aria-label='LinkedIn' title='Connect on LinkedIn'>in</a>
          </div>
        </motion.div>

        {/* Quick Links */}
        <motion.div className='footer-section' variants={itemVariants}>
          <h4>Quick Links</h4>
          <ul>
            {footerLinks.map((link) => (
              <li key={link.name}>
                <Link
                  to={link.link}
                  smooth={true}
                  offset={-80}
                  duration={500}
                  className='footer-link'
                >
                  {link.name}
                </Link>
              </li>
            ))}
          </ul>
        </motion.div>

        {/* Services */}
        <motion.div className='footer-section' variants={itemVariants}>
          <h4>Services</h4>
          <ul>
            <li><a href='#' className='footer-link'>Consulting</a></li>
            <li><a href='#' className='footer-link'>Network Solutions</a></li>
            <li><a href='#' className='footer-link'>Data Center</a></li>
            <li><a href='#' className='footer-link'>Support Services</a></li>
          </ul>
        </motion.div>

        {/* Contact Info */}
        <motion.div className='footer-section' variants={itemVariants}>
          <h4>Contact</h4>
          <div className='footer-info'>
            <p><strong>Email:</strong><br/><a href='mailto:bgsales@outlook.com'>bgsales@outlook.com</a></p>
            <p><strong>Phone:</strong><br/><a href='tel:+97577208946'>+975 77208946</a></p>
            <p><strong>Address:</strong><br/>Hongkong Market, Thimphu</p>
          </div>
        </motion.div>
      </motion.div>

      {/* Bottom Bar */}
      <motion.div 
        className='footer-bottom'
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.6 }}
        viewport={{ once: false }}
      >
        <div className='footer-bottom-container'>
          <p className='footer-copyright'>
            &copy; {currentYear} BG Sales & Supplies. All rights reserved.
          </p>
          <ul className='footer-legal'>
            {legalLinks.map((link) => (
              <li key={link.name}>
                <a href={link.href} className='footer-legal-link'>{link.name}</a>
              </li>
            ))}
          </ul>
        </div>
      </motion.div>
    </footer>
  )
}

export default Footer
