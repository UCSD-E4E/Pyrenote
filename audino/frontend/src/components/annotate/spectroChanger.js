import React from 'react';
import { Button } from '../button';

const SpectroChanger = props => {
  const { annotate } = props;
  const {state} = annotate
  let {spectrogram, colorChange, contrast} = state

  const ChangeColorChange = (e) => {
    annotate.setState({colorChange: e.target.value})
  }
  if (contrast === null) {
    annotate.setState({contrast: 0})
    contrast = 0
  }
  return (
    <div>
          <input
            type="range"
            min="-1"
            max="1"
            value={colorChange}
            onChange={(e) => {ChangeColorChange(e); spectrogram.brightness(e.target.value)}} 
            //can also do spectrogram.contrast
          />
           <input
            type="range"
            min="-155"
            max="155"
            value={contrast}
            onChange={(e) => {annotate.setState({contrast: e.target.value}); spectrogram.contrast(e.target.value)}} 
            //can also do spectrogram.contrast
          />
          <Button
            size="lg"
            type="danger"
            onClick={e => spectrogram.setColorMap('winter')}
            text="test"
          /> 
          </div>
  );
};

export default SpectroChanger;
