import './Power.css'
import { FaPowerOff } from "react-icons/fa6";
import { VscGithubAction } from "react-icons/vsc";
import BulletInfo from '../../../components/common/BulletInfo/BulletInfo'

const Power = () => {
  return (
    <div className='power-services-container'>
        <div className="power-side">
            <h2>Power Solutions</h2>
            <p>
            comprehensive power solutions tailored to meet the diverse needs of our clients. 
            From safeguarding against power interruptions with cutting-edge UPS systems to designing efficient electrical layouts,
            ensuring seamless fittings, and optimizing HVAC systems for comfort and efficiency, we deliver excellence at every step.
            </p>
            <BulletInfo title='Uninterruptible Power Supply (UPS) Systems'/>
            <BulletInfo title='Electrical Design and Engineering'/>
            <BulletInfo title='Precision Fittings and Installations'/>
            <BulletInfo title='HVAC System Optimization'/>
        </div>
        <div className="power-right-side">
            <div className="power-right-side-card">
                <div className="power-right-circle bg-red">
                    <FaPowerOff className='power-icon'/>
                </div>
                <div className='power-card-desc'>
                    <h2>Discover Reliable UPS Solutions</h2>
                    <p>
                        Schneider, Numeric, & Vertiv
                        Leading Brands in Power Protection
                        Explore our range today!
                    </p>
                </div>
            </div>

            <div className="power-right-side-card">
                <div className="power-right-circle bg-blue">
                    <VscGithubAction className='power-icon'/>
                </div>
                <div className='power-card-desc'>
                    <h2>HVAC Services</h2>
                    <p>
                        Explore our HVAC Services: Enhance comfort, improve air quality, 
                        and optimize energy efficiency with our comprehensive HVAC solutions.
                    </p>
                </div>
            </div>
        </div>
    </div>
  )
}

export default Power
