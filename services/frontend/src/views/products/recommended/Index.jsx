import './Recommended.css'

const Recommended = ({handleClick}) => {
  return (
    <div>
      <h2 className="recommended-title">Recommended</h2>
      <div className="recommended-flex">
        <button onClick={handleClick} className='btns'value= ''>All Products</button>
        <button onClick={handleClick} className='btns' value='laptop'>Laptops</button>
        <button onClick={handleClick} className='btns'value='printer'>Printers</button>
        <button onClick={handleClick} className='btns' value='desktop'>Desktop</button>
      </div>
    </div>
  )
}

export default Recommended
