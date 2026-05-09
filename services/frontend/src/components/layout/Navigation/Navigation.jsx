import './Navigation.css'
import { FaHome } from "react-icons/fa";

const Navigation = ({query,handleInputChange}) => {
  return (
    <div className='product-nav'>
      <div className="nav-containers">
        <input 
        onChange={handleInputChange}
        value={query} 
        type="text" 
        className='search-input'
        placeholder='Enter your search'/>
      </div>
      <div className="profile-container">
        <a href="/">
          <FaHome className='nav-icons'/>
        </a>
      </div>
    </div>
  )
}

export default Navigation
