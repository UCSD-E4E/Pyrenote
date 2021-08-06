import React from 'react';

const ChangePlayback = props => {
  const { annotate } = props;
  const { state } = annotate;
  const { wavesurfer, playbackOn, playbackRate } = state;
  const changePlayback = e => {
    wavesurfer.setPlaybackRate(e.target.value / 100);
    annotate.setState({ playbackRate: e.target.value });
  };

  return (
    <div>
      {playbackOn ? (
        <input
          type="range"
          min="1"
          max="200"
          value={playbackRate}
          onChange={e => changePlayback(e)}
        />
      ) : null}
    </div>
  );
};

export default ChangePlayback;
