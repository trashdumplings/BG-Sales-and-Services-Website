import './VideoPlayer.css'
import video from '../../../assets/video.mp4'
import { useRef } from 'react'

const VideoPlayer = ({playState,setPalyState}) => {
    const player = useRef(null);
    const closePlayer = (e)=>{
        if(e.target === player.current){
            setPalyState(false)
        }
    }
  return (
    <div className={`video-player ${playState?'':'hide'}` } ref={player}
    onClick={closePlayer}>
      <video src={video}
      autoPlay muted controls></video>
    </div>
  )
}

export default VideoPlayer
