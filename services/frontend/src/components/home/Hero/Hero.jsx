import './Hero.css'
import { Link } from 'react-scroll'
import { motion } from 'framer-motion'
import heroImage from '../../../assets/hero/hero.png.png'
import Magnetic from '../../common/Magnetic'

const Hero = () => {
  const MotionLink = motion(Link)

  const heroBackground = {
     backgroundImage: `linear-gradient(135deg, rgba(26, 26, 46, 0.85), rgba(37, 99, 235, 0.4)), url(${heroImage})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat'
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2, delayChildren: 0.3 }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.34, 1.56, 0.64, 1] } }
  }

  return (
    <section className='hero' id='hero' style={heroBackground}>
      <motion.div 
        className='hero-content'
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: false, amount: 0.3 }}
      >
        <motion.h1 variants={itemVariants} className='hero-title'>
          Transform Your Business with Expert MEP & ICT Solutions
        </motion.h1>
        
        <motion.p variants={itemVariants} className='hero-subtitle'>
          We deliver innovative consulting services that drive digital transformation and unlock your business potential. Partner with us to achieve sustainable growth.
        </motion.p>
        
        <motion.div variants={itemVariants} className="hero-actions">
          <Magnetic>
            <MotionLink
              to='about'
              smooth={true}
              offset={-80}
              duration={500}
              className='btn btn-primary btn-lg'
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.97 }}
              data-cursor="hover"
            >
              Explore Our Services
            </MotionLink>
          </Magnetic>
          <Magnetic>
            <MotionLink
              to='contact'
              smooth={true}
              offset={-80}
              duration={500}
              className='btn btn-secondary btn-lg'
              whileHover={{ scale: 1.03, y: -1 }}
              whileTap={{ scale: 0.97 }}
              data-cursor="hover"
            >
              Get in Touch
            </MotionLink>
          </Magnetic>
        </motion.div>
      </motion.div>
    </section>
  )
}

export default Hero
