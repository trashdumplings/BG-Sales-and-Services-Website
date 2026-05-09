// Facebook Messenger integration disabled - use direct messenger embed instead
// For future implementation, consider using Facebook's native SDK

const FacebookMsg = () => {
  // Facebook messenger embed script - add to index.html if needed:
  // <div id="fb-root"></div>
  // <script async defer crossOrigin="anonymous" 
  //   src="https://connect.facebook.net/en_US/sdk.js#xfbml=1&version=v18.0" 
  //   nonce="XXXX"></script>
  
  return (
    <div>
      {/* Facebook Messenger widget can be added here when needed */}
      {/* Using native Facebook SDK instead of deprecated react-facebook library */}
    </div>
  )
}

export default FacebookMsg
