import Input from '../../common/Input/Input'
import './Category.css'

const Category = ({handleChange}) => {
  return (
    <div>
      <h2 className='sidebar-title'>Category</h2>
      <label className="sidebar-label-container">
          <span className="checkmark"></span>All
          <input onChange={handleChange} type="radio" value="" name='test' />
      </label>
      <Input 
        handleChange ={handleChange} 
        value="laptop"
        title="Laptops"
        name = "test"
      />
      <Input 
        handleChange ={handleChange} 
        value="desktop"
        title="Desktop"
        name = "test"
      />
      <Input 
        handleChange ={handleChange} 
        value="printer"
        title="Printer"
        name = "test"
      />
    </div>
  )
}

export default Category
