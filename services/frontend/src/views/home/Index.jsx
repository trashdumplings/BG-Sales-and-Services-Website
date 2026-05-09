import { useState } from 'react'
import About from '../../components/home/About/About'
import Contact from '../../components/home/Contact/Contact'
import Footer from '../../components/layout/Footer/Footer'
import Gallery from '../../components/home/Gallery/Gallery'
import Hero from '../../components/home/Hero/Hero'
import Navbar from '../../components/layout/Navbar/Navbar'
import Partner from '../../components/home/Partner/Partner'
import Product from '../../components/home/Product/Product'
import Service from '../../components/home/Service/Service'
import Title from '../../components/common/Title/Title'
import VideoPlayer from '../../components/common/VideoPlayer/VideoPlayer'
import FacebookMsg from '../../components/home/FacebookMsg'
import useScrollReveal from '../../composables/useScrollReveal'

const Home = () => {
    const [playState, setPalyState] = useState(false);
    useScrollReveal();
  return (
    <div>
        <div className="container-nav">
            <Navbar/>
        </div>
        <Hero/>
        <div className="container">
            <div className="reveal">
              <Title subTitle = 'Our Product' title = 'Seamless Network Solution'/>
              <Product/>
            </div>

            <div className="reveal">
              <Title subTitle='Our Core Services' title='Practical, scalable solutions tailored to your business.'/>
              <Service/>
            </div>

            <div className="reveal">
              <About setPalyState={setPalyState}/>
            </div>

            <div className="reveal">
              <Title subTitle = 'Gallery' title = 'Explore Our Portfolio'/>
              <Gallery/>
            </div>

            <div className="reveal">
              <Title subTitle = 'Contact Us' title = 'Connect with Us Today'/>
              <Contact/>
            </div>

            <div className="reveal">
              <Title subTitle = 'Partners' title = 'Our Trusted Network of Partners'/>
              <Partner/>
            </div>

            <Footer/>
            <VideoPlayer playState= {playState} setPalyState={setPalyState}/>
            <FacebookMsg/>
        </div>
    </div>
  )
}

export default Home
