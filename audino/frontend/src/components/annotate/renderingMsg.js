import React from 'react';
import Loader from '../loader';

const RenderingMsg = props => {
  const {isRendering} = props
  return (
   <div>
     {isRendering && (
      <div className="row justify-content-md-center my-4">
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}
        >
          <text style={{ marginBottom: '2%' }}>
            Please wait while spectrogram renders &nbsp;
          </text>
          <Loader />
        </div>
      </div>
    )}
   </div>
  )
}

export default RenderingMsg






