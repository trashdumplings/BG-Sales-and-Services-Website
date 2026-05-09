import './About.css'
import { motion } from 'framer-motion'
import about_img from '../../../assets/about/about.png'
import play_icon from '../../../assets/play-icon.png'

const About = ({setPalyState}) => {
  const textVariants = {
    hidden: { opacity: 0, x: -30 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.8, ease: [0.34, 1.56, 0.64, 1] } }
  }

  const imageVariants = {
    hidden: { opacity: 0, x: 30 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.8, ease: [0.34, 1.56, 0.64, 1] } }
  }

  return (
    <section className='section section--spacious' id='about'>
      <div className='about-container'>
        <motion.div 
          className="about-left"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: false, amount: 0.3 }}
          variants={imageVariants}
        >
          <div className='about-image-wrapper'>
            <img src={about_img} className='about-img' alt="About BG Sales & Supplies" />
            <div className='play-button' onClick={()=>{setPalyState(true)}}>
              <img src={play_icon} alt="Play video" className='play-icon' />
            </div>
          </div>
        </motion.div>

        <motion.div 
          className="about-right"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: false, amount: 0.3 }}
          variants={textVariants}
        >
          <div className='about-label'>Our Story</div>
          <h2 className='h2'>Unlock Possibilities, Access Solutions</h2>
          
          <div className='about-content'>
            <p>
              BG Sales & Supplies stands as your premier partner for all IT needs since 2008. 
              With a legacy built on steadfast commitment to excellence, we've become the cornerstone 
              of reliability in information technology.
            </p>
            
            <p>
              We specialize in delivering bespoke solutions that propel your business into the digital age. 
              Over a decade of industry experience has equipped our seasoned team with the knowledge and 
              skills to exceed your expectations consistently.
            </p>
            
            <p>
              Our comprehensive range of services is tailored to meet your specific needs—from cutting-edge 
              hardware solutions to enterprise-level consulting. We provide a holistic approach to address 
              all your IT requirements.
            </p>
            
            <p>
              At BG Sales & Supplies, we deliver more than products and services—we deliver peace of mind. 
              Trust us to be your partner on your journey towards digital transformation.
            </p>
          </div>

          <a href='/about' className='btn btn-primary'>
            Learn More
          </a>
        </motion.div>
      </div>
    </section>
  )
}

export default About
