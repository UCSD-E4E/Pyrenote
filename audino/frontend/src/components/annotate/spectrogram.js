import React from 'react';

const Spectrogram = props => {

  return (
    <div
      className="row justify-content-md-center my-4 mx-3"
      style={{ display: props.isRendering ? 'none' : '' }}
    >
      <div id="waveform-labels" style={{ float: 'left' }} />
      <div id="wavegraph" style={{ float: 'left' }} />
      <div id="waveform" style={{ float: 'left' }} />
      <div id="timeline" />
    </div>
  )
}

export default Spectrogram

