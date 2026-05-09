import { FaCheckCircle } from "react-icons/fa";

const BulletInfo = ({title}) => {
  return (
    <div className='check-icon-desc'>
      <FaCheckCircle className="check-icon"/><h4>{title}</h4>
    </div>
  )
}

export default BulletInfo
