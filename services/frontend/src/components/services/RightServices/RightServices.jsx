import './RightServices.css'
import av1 from '../../../assets/services/av/av1.png'

const RightServices = () => {
  return (
    <div className='right-services-container'>
        <div className="right-services-section">
            <div className="right-services-section-img-card">
                <img src={av1} alt="" />
            </div>
        </div>
        <div className="left-services-section">
            <p className='left-services-title'>Cutting-Edge Audio-Visual and Video Conference Systems</p>
            <p className='left-services-title-desc'>
            Experience seamless collaboration and communication with our cutting-edge 
            audio-visual and video conference systems. Our solutions combine 
            state-of-the-art technology with intuitive design, 
            ensuring crystal-clear audio and high-definition video for all your 
            meetings and presentations. 
            </p>
            <p className='left-services-title-desc'>
            With easy-to-use interfaces and 
            robust features, our systems empower teams to connect effortlessly, 
            whether they're in the same room or across the globe. Elevate your 
            communication experience with our advanced audio-visual and 
            video conference solutions.
            </p>
        </div>
    </div>
  )
}

export default RightServices
