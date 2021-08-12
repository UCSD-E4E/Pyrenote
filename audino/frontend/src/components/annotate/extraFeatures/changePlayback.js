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
        <div className="sideMenuItem">
          <text style={{textAlign: 'center',}}>Change Playback</text>
          <input
            type="range"
            min="1"
            max="200"
            value={playbackRate}
            onChange={e => changePlayback(e)}
          />
          <br></br>
        </div>
      ) : null}
      
    </div>
  );
};

export default ChangePlayback;
