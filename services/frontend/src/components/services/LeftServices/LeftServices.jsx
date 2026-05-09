import BulletInfo from '../../common/BulletInfo/BulletInfo'
import './LeftServices.css'
import { FaNetworkWired } from "react-icons/fa";
import { FaServer } from "react-icons/fa";
import { MdOutlineSecurity } from "react-icons/md";
import { GiSecurityGate } from "react-icons/gi";


const LeftServices = () => {
  return (
    <div className='left-services-container'>
        <div className="left-side">
            <h2>Empower Your Network</h2>
            <p>Seamless Integration of Passive and Active Solutions for Optimal Performance and Security.</p>
            <BulletInfo title='Network Design: Customized design tailored to your specific needs and goals.'/>
            <BulletInfo title='Cable Layout: Strategic planning and organization of cable infrastructure for optimal performance and efficiency.'/>
            <BulletInfo title='Installation: Professional installation services ensuring seamless integration and functionality.'/>
            <BulletInfo title='Testing: Thorough testing and validation to guarantee reliability and performance standards are met.'/>
        </div>
        <div className="right-side">
            <div className="right-side-card">
                <div className="right-circle bg-red">
                    <FaNetworkWired className='network-icon'/>
                </div>
                <div className='card-desc'>
                    <h2>Active Network Solutions</h2>
                    <p>
                        Seamlessly Integrating Your Network with 
                        Industry-Leading Brands for Superior Connectivity.
                    </p>
                </div>
            </div>

            <div className="right-side-card">
                <div className="right-circle bg-blue">
                    <FaServer className='network-icon'/>
                </div>
                <div className='card-desc'>
                    <h2>Passive Network Solutions</h2>
                    <p>
                    Enhanced Connectivity : Building a Reliable Passive 
                    Network Infrastructure for Seamless Data Transmission.
                    </p>
                </div>
            </div>

            <div className="right-side-card">
                <div className="right-circle bg-green">
                    <MdOutlineSecurity  className='network-icon'/>
                </div>
                <div className='card-desc'>
                    <h2>Network Security</h2>
                    <p>
                    Protecting Your Digital Assets: 
                    Comprehensive Solutions for Peace of Mind
                    </p>
                </div>
            </div>
            <div className="right-side-card">
                <div className="right-circle bg-purple ">
                    <GiSecurityGate className='network-icon'/>
                </div>
                <div className='card-desc'>
                    <h2>Security System</h2>
                    <p>
                    Safeguarding Your Space : Tailored Solutions for Comprehensive Protection.
                    </p>
                </div>
            </div>
        </div>
    </div>
  )
}

export default LeftServices
