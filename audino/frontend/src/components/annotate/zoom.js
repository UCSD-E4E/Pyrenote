import React from 'react';
import StickySlider from '../stickySlider';
const Zoom = props => {
  const {annotate} = props
  const {state} = annotate;
  const {isRendering, wavesurfer} = state

  const handleZoom = value => {
    console.log("hello", wavesurfer, state, annotate, props)
    wavesurfer.zoom(value);
  }

  return (
    <div
      style={{ display: isRendering ? 'none' : '' }}
    >
     <StickySlider
      min="1"
      max="200"
      finalChangeCallback={value => handleZoom(value)}
      stickyPos={[0, 200]}
      threshold={5}
    />
    </div>
  );
};

export default Zoom;
