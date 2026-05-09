import './Sidebar.css'
import Category from '../../products/Category/Category'
import logo from '../../../assets/logo.png'
const Sidebar = ({handleChange}) => {
  return (
    <div>
      <section className="sidebar">
        <div className="logo-container">
            <a href="/">
             <img src={logo} className='logo' alt="company logo" />
            </a>
        </div>
        <Category handleChange ={handleChange}/>
      </section>
      
    </div>
  )
}

export default Sidebar
