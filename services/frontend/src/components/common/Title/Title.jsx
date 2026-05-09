import './Title.css'
import RevealText from '../RevealText'

const Title = ({subTitle, title}) => {
  return (
    <div className='title'>
      <RevealText>
        <p>{subTitle}</p>
      </RevealText>
      <RevealText delay={0.1}>
        <h2>{title}</h2>
      </RevealText>
    </div>
  )
}

export default Title
