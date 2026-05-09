

const Input = ({handleChange, value,title, name}) => {
  return (
    <>
      
      <div>
        <label className="sidebar-label-container">
          <span className="checkmark"></span>{title}
          <input onChange={handleChange} type="radio" value={value}  name={name} />
        </label>
      </div>
    </>
  )
}

export default Input
