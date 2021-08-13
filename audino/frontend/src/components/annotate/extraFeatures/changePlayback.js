import React from 'react';

const ChangePlayback = props => {
  const { annotate } = props;
  const { state } = annotate;
  const { wavesurfer, playbackOn, playbackRate } = state;
  const stickySpeeds = [
    25, 50, 75, 100, 125, 150, 175, 200
  ]
  const changePlayback = e => {
    let speed = e.target.value
    wavesurfer.setPlaybackRate(speed / 100);
    annotate.setState({ playbackRate: speed });
  };

  const stickToSpeed = (e) => {
    let speed = e.target.value
    stickySpeeds.forEach((value) => {
      if (Math.abs(speed - value) < 10)
        speed = value
    })
    wavesurfer.setPlaybackRate(speed / 100);
    annotate.setState({ playbackRate: speed });
  }

  return (
    <div>
      {playbackOn ? (
        <div className="sideMenuItem">
          <text style={{ textAlign: 'center' }}>Change Playback</text>
          <input
            type="range"
            min="1"
            max="200"
            value={playbackRate}
            onChange={e => changePlayback(e)}
            onMouseUp={e => stickToSpeed(e)}
          />
          <br />
        </div>
      ) : null}
    </div>
  );
};

export default ChangePlayback;
