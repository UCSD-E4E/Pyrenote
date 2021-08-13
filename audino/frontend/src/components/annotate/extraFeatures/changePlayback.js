import React from 'react';
import StickySlider from '../../stickySlider';
const ChangePlayback = props => {
  const { annotate } = props;
  const { state } = annotate;
  const { wavesurfer, playbackOn } = state;
  const stickySpeeds = [0, 25, 50, 75, 100, 125, 150, 175, 200];

  const changeCallback = (value) => {
    wavesurfer.setPlaybackRate(value / 100);
  }

  return (
    <div>
      {playbackOn ? (
        <div>
          <text style={{ textAlign: 'center' }}>Change Playback</text>
          <StickySlider
            min="0"
            max="200"
            changeCallback={(value) => changeCallback(value)}
            stickyPos={stickySpeeds}
            threshold={5}
          />
          <br />
        </div>
      ) : null}
      <br/>
    </div>
  );
};

export default ChangePlayback;
