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
import './Landing.css'

const Home = () => {
  return (
    <div className='landing-page'>
      <a className='skip-link' href='#main-content'>Skip to main content</a>
      <Navbar />
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
