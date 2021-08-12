import React from 'react';
import { Button } from '../button';

const SpectroChanger = props => {
  const { annotate } = props;
  const { state } = annotate;
  const { spectrogram, colorChange } = state;
  let { contrast } = state;

  const ChangeColorChange = e => {
    annotate.setState({ colorChange: e.target.value });
  };
  if (contrast === null) {
    annotate.setState({ contrast: 0 });
    contrast = 0;
  }
  return (
    <div className="sideMenuItem">
      <text>brightness</text>
      <input
        type="range"
        min="-1"
        max="1"
        value={colorChange}
        onChange={e => {
          ChangeColorChange(e);
          spectrogram.brightness(e.target.value);
        }}
        // can also do spectrogram.contrast
      />
      <text>contrast</text>
      <input
        type="range"
        min="-155"
        max="155"
        value={contrast}
        onChange={e => {
          annotate.setState({ contrast: e.target.value });
          spectrogram.contrast(e.target.value);
        }}
      />
      <text>change color map</text>
      <Button
        size="lg"
        type="primary"
        onClick={() => spectrogram.setColorMap('winter')}
        text="change color map"
      />
      <text>RESET</text>
      <Button
        size="lg"
        type="danger"
        onClick={() => spectrogram.setColorMap('hot')}
        text="Reset Color Map"
      />
      <br></br>
    </div>
  );
};

export default SpectroChanger;
