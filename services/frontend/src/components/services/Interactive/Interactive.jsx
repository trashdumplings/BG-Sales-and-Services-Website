import './Interactive.css'
import certify from '../../../assets/services/interactive/certify.png'
import white_arrow from '../../../assets/white-arrow.png'
const Interactive = () => {
  return (
    <div className='interactive-container'>
      <div className='interactive-desc'>
        <p className='interactive-desc-title'>Interactive Display Solution</p>
        <p className='interactive-desc-sub-title' >Elevate Meetings On Board with the Yealink </p>
        <img src={certify} alt="" />
        <button className='interactive-btn'>Contact us <img className='btn-img-white-arrow' src={white_arrow} alt="" /></button>
      </div>
    </div>
  )
}

export default Interactive
