import { useEffect, useRef } from 'react'
import { animate, stagger } from 'animejs'
import { useReducedMotion } from 'motion/react'
import About from '../../components/home/About/About'
import Challenge from '../../components/home/Challenge/Challenge'
import Contact from '../../components/home/Contact/Contact'
import Footer from '../../components/layout/Footer/Footer'
import Gallery from '../../components/home/Gallery/Gallery'
import Hero from '../../components/home/Hero/Hero'
import Navbar from '../../components/layout/Navbar/Navbar'
import Partner from '../../components/home/Partner/Partner'
import Product from '../../components/home/Product/Product'
import SolutionsStory from '../../components/home/SolutionsStory/SolutionsStory'
import FacebookMsg from '../../components/home/FacebookMsg'
import LandingProgress from './LandingProgress'
import './Landing.css'

const Home = () => {
  const pageRef = useRef(null)
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    const page = pageRef.current
    if (!page || reduceMotion) return undefined

    const animations = new Map()
    const labels = page.querySelectorAll('.landing-section-label')
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting || animations.has(entry.target)) return
          const animation = animate(entry.target.children, {
            opacity: [0, 1],
            y: [18, 0],
            duration: 650,
            delay: stagger(90),
            ease: 'outCubic',
          })
          animations.set(entry.target, animation)
          observer.unobserve(entry.target)
        })
      },
      { threshold: 0.45 },
    )

    labels.forEach((label) => observer.observe(label))
    return () => {
      observer.disconnect()
      animations.forEach((animation) => animation.revert())
      animations.clear()
    }
  }, [reduceMotion])

  return (
    <div className='landing-page' ref={pageRef}>
      <a className='skip-link' href='#main-content'>Skip to main content</a>
      <Navbar />
      <LandingProgress />
      <main id='main-content'>
        <Hero />
        <Challenge />
        <SolutionsStory />

        <section className='landing-standard-section landing-products'>
          <div className='landing-shell'>
            <div className='landing-section-label'>
              <span>Products</span>
              <p>Business-ready hardware, selected for dependable deployment.</p>
            </div>
            <Product />
          </div>
        </section>

        <section className='landing-standard-section landing-about'>
          <About />
        </section>

        <section className='landing-projects' id='gallery'>
          <Gallery />
        </section>

        <section className='landing-partners' id='partners' aria-label='Technology partners'>
          <div className='landing-shell'>
            <div className='landing-section-label'>
              <span>Technology partners</span>
              <p>A broad supplier network for complete project delivery.</p>
            </div>
          </div>
          <Partner />
        </section>

        <section className='landing-contact'>
          <Contact />
        </section>
      </main>

      <Footer />
      <FacebookMsg />
    </div>
  )
}

export default Home
