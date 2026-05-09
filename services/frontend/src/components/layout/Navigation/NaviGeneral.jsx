import './NaviGeneral.css'
import { FaHome } from "react-icons/fa";
import logo from '../../../assets/logo.png'


const NaviGeneral = ({title}) => {
  return (
    <div className='general-nav'>
      <div className="general-logo-container">
        <a href="/">
             <img src={logo} className='logo' alt="company logo" />
        </a>
      </div>
      <div className="general-title">
        <h2>{title}</h2>
      </div>
      <div className="general-container">
        <a href="/">
          <FaHome className='nav-icons'/>
        </a>
      </div>
    </div>
  )
}

export default NaviGeneral
